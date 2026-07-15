import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/start-server-core";
import { z } from "zod";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { expiresInHours, generateToken } from "./tokens";
import { renderEmailHtml, renderEmailText } from "./emailTemplates";
import { sendOrQueueEmail, processScheduledEmails } from "./mailer";
import { getJobBySlug } from "@/lib/jobs";
import { COUNTRIES } from "@/lib/countries";
import { adminNotifyEmail, publicBaseUrl } from "./devMode";
import {
  pipelineDevInbox,
  pipelineGetSkillsProfileState,
  pipelineGetWorkspaceDashboardState,
  pipelineGetWorkspaceSetupState,
  pipelineInsertApplication,
  pipelineRoleFromSlug,
  pipelineSendApplicationEmails,
  pipelineSubmitSkillsProfile,
  pipelineSubmitWorkspaceContract,
  pipelineSubmitWorkspaceNda,
} from "./pipelineStore";

const ADMIN_PASSWORD = () => (process.env.ADMIN_PASSWORD || "secr3tpass!").trim();
const ADMIN_EMAIL = () => adminNotifyEmail();

const emailSchema = z.string().email().max(150);

function roleFromSlug(slug: string) {
  return pipelineRoleFromSlug(slug) ?? getJobBySlug(slug);
}

function mustAdmin(password: string) {
  if (password.trim() !== ADMIN_PASSWORD()) throw new Error("Invalid admin password");
}

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      fullName: z.string().min(1).max(100),
      email: emailSchema,
      phone: z.string().min(6).max(50),
      country: z
        .string()
        .min(1)
        .max(80)
        .refine((c) => COUNTRIES.includes(c), "Country not in hiring region"),
      timezone: z.string().min(1).max(200),
      position: z.string().min(1).max(80), // role_slug
      hasComputer: z.enum(["yes", "no"]),
      internet: z.string().min(1).max(40),
      typingSpeed: z.string().min(1).max(40),
      availability: z.string().min(1).max(40),
      hoursPerWeek: z.number().int().min(1).max(60),
      whyRemote: z.string().min(30).max(1000),
      experience: z.string().min(30).max(1500),
      workedRemote: z.enum(["yes", "no"]),
      remoteDescription: z.string().max(1000).optional().nullable(),
      source: z.string().min(1).max(80),
      resumeMeta: z
        .object({
          filename: z.string().max(200),
          mime: z.string().max(120),
          size: z.number().int().min(1).max(5 * 1024 * 1024),
        })
        .optional()
        .nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const role = roleFromSlug(data.position);
    if (!role) throw new Error("Unknown role");
    if (role.status !== "open") throw new Error("This position is not available for applications");

    const inserted = await pipelineInsertApplication({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      country: data.country,
      timezone: data.timezone,
      roleSlug: role.slug,
      roleTitle: role.title,
      hasComputer: data.hasComputer === "yes",
      internet: data.internet,
      typingSpeed: data.typingSpeed,
      availability: data.availability,
      hoursPerWeek: data.hoursPerWeek,
      whyRemote: data.whyRemote,
      experience: data.experience,
      workedRemote: data.workedRemote === "yes",
      remoteDescription: data.remoteDescription ?? null,
      source: data.source,
      resumeFilename: data.resumeMeta?.filename ?? null,
      resumeMime: data.resumeMeta?.mime ?? null,
      resumeSizeBytes: data.resumeMeta?.size ?? null,
    });

    await pipelineSendApplicationEmails({
      id: inserted.id as string,
      full_name: inserted.full_name as string,
      email: inserted.email as string,
      role_title: inserted.role_title as string,
    });

    return { applicationId: inserted.id as string, roleTitle: inserted.role_title as string };
  });

export const resendWorkspaceLink = createServerFn({ method: "POST" })
    .inputValidator(z.object({ email: emailSchema }))
    .handler(async ({ data }) => {
      const sb = getSupabaseAdmin();

      const { data: app } = await sb
        .from("applications")
        .select("id, full_name, email, role_slug, role_title, status")
        .ilike("email", data.email.trim())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!app) throw new Error("No application found for that email");

      const { data: skills } = await sb
        .from("skills_profile_submissions")
        .select("selected_for_workspace")
        .eq("application_id", app.id)
        .maybeSingle();

      const appStatus = app.status ?? "";
      const eligibleForWorkspace =
        Boolean(skills?.selected_for_workspace) ||
        ["onboarding", "active"].includes(appStatus);
      if (!eligibleForWorkspace) {
        throw new Error("This email is not eligible for a workspace sign-in link yet. Please apply and complete the Skills Review first.");
      }

      // Check onboarding completion to decide where the link should land
      const { data: onboardingRow } = await sb
        .from("onboarding")
        .select("completed_at")
        .eq("application_id", app.id as string)
        .maybeSingle();

      const onboardingDone = Boolean(onboardingRow?.completed_at) || appStatus === "active";
      const nextPath = onboardingDone ? "/workspace" : "/onboarding/workspace-setup";

      // Create/update Supabase Auth user and generate a magic sign-in link (24-hour window)
      const callbackUrl = `${publicBaseUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { data: linkData, error: linkErr } = await sb.auth.admin.generateLink({
        type: "magiclink",
        email: data.email.trim(),
        options: {
          redirectTo: callbackUrl,
          data: {
            applicationId: app.id,
            candidateName: app.full_name,
            roleTitle: app.role_title,
          },
        },
      });
      if (linkErr || !linkData) {
        throw new Error("Failed to generate sign-in link. Please try again.");
      }
      // Update user_metadata for existing users (generateLink's data option only applies to new users)
      await sb.auth.admin
        .updateUserById(linkData.user.id, {
          user_metadata: {
            applicationId: app.id,
            candidateName: app.full_name,
            roleTitle: app.role_title,
          },
        })
        .catch((e: unknown) =>
          console.warn("[resendWorkspaceLink] metadata update:", e instanceof Error ? e.message : e)
        );

      const link = linkData.properties.action_link;

      // Choose email copy based on where the user is in the pipeline
      let subject: string;
      let subjectHeadline: string;
      let paragraphs: string[];
      let ctaLabel: string;
      const intro = `Hi ${firstName(app.full_name)},`;

      if (appStatus === "active") {
        subject = "Worknesta: Your workspace sign-in link";
        subjectHeadline = "Your workspace sign-in link";
        paragraphs = [
          "Here is your secure sign-in link to access your Worknesta workspace.",
          "The link is valid for 24 hours.",
        ];
        ctaLabel = "Open my workspace";
      } else if (appStatus === "onboarding") {
        subject = "Worknesta: Continue your onboarding";
        subjectHeadline = "Continue your onboarding";
        paragraphs = [
          `You have a pending onboarding for the ${app.role_title} role.`,
          "Use the link below to pick up where you left off.",
        ];
        ctaLabel = "Continue onboarding";
      } else {
        // selected_for_workspace but not yet in onboarding/active
        subject = "Worknesta: Skills Profile Review complete — workspace setup required";
        subjectHeadline = "Skills Profile Review complete";
        paragraphs = [
          `Your Skills Profile Review for the ${app.role_title} role is complete.`,
          "You are cleared to begin contractor onboarding.",
          "Use the secure link below to open your contractor workspace.",
        ];
        ctaLabel = "Open contractor workspace";
      }

      try {
        const html = renderEmailHtml({
          subjectHeadline,
          intro,
          paragraphs,
          ctaLabel,
          ctaUrl: link,
        });
        const text = renderEmailText({
          subjectHeadline,
          intro,
          paragraphs,
          ctaLabel,
          ctaUrl: link,
        });
        await sendOrQueueEmail({ to: app.email as string, subject, html, text });
        return { ok: true };
      } catch (e) {
        console.error("resendWorkspaceLink error:", e);
        throw e;
      }
    });

/** Verify admin password without touching Supabase — safe for environments where DB isn't configured. */
export const adminCheckPassword = createServerFn({ method: "POST" })
  .inputValidator(z.object({ password: z.string().min(1) }))
  .handler(async ({ data }) => {
    mustAdmin(data.password);
    return { ok: true };
  });

export const adminListApplications = createServerFn({ method: "POST" })
  .inputValidator(z.object({ password: z.string().min(1), status: z.string().optional() }))
  .handler(async ({ data }) => {
    mustAdmin(data.password);
    const sb = getSupabaseAdmin();
    let q = sb
      .from("applications")
      .select(
        "id, created_at, status, full_name, email, role_title, role_slug, phone, country, timezone, has_computer, internet, typing_speed, availability, hours_per_week, why_remote, experience, worked_remote, remote_description, source, resume_filename, resume_mime, resume_size_bytes",
      )
      .order("created_at", { ascending: false });
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

export const adminReject = createServerFn({ method: "POST" })
  .inputValidator(z.object({ password: z.string().min(1), applicationId: z.string().uuid() }))
  .handler(async ({ data }) => {
    mustAdmin(data.password);
    const sb = getSupabaseAdmin();

    const { data: app, error: fetchErr } = await sb
      .from("applications")
      .select("id, full_name, email, role_title")
      .eq("id", data.applicationId)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);

    const { error } = await sb.from("applications").update({ status: "rejected" }).eq("id", app.id);
    if (error) throw new Error(error.message);

    const subject = "Your application — Worknesta";
    const html = renderEmailHtml({
      subjectHeadline: "Your application",
      intro: `Hi ${firstName(app.full_name)},`,
      paragraphs: [
        `Thank you for your time and for applying to Worknesta for ${app.role_title}.`,
        "After careful review, we were not able to move forward with your application for this round.",
        "We encourage you to apply again when new roles open.",
        "We wish you all the best in your job search.",
      ],
    });
    const text = renderEmailText({
      subjectHeadline: "Your application",
      intro: `Hi ${firstName(app.full_name)},`,
      paragraphs: [
        `Thank you for your time and for applying to Worknesta for ${app.role_title}.`,
        "After careful review, we were not able to move forward with your application for this round.",
        "We encourage you to apply again when new roles open.",
        "We wish you all the best in your job search.",
      ],
    });

    await sendOrQueueEmail({ to: app.email, subject, html, text });
    return { ok: true };
  });

export const adminSendInterviewLink = createServerFn({ method: "POST" })
  .inputValidator(z.object({ password: z.string().min(1), applicationId: z.string().uuid() }))
  .handler(async ({ data }) => {
    mustAdmin(data.password);
    const sb = getSupabaseAdmin();

    const { data: app, error: fetchErr } = await sb
      .from("applications")
      .select("id, full_name, email, role_slug, role_title")
      .eq("id", data.applicationId)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);

    const token = generateToken();
    const expiresAt = expiresInHours(72);
    const { data: tok, error: tokenErr } = await sb
      .from("application_tokens")
      .insert({
        application_id: app.id,
        type: "interview",
        token,
        expires_at: expiresAt,
        role_slug: app.role_slug,
        role_title: app.role_title,
      })
      .select("token")
      .single();
    if (tokenErr) throw new Error(tokenErr.message);

    const { error: statusErr } = await sb
      .from("applications")
      .update({ status: "interview_sent" })
      .eq("id", app.id);
    if (statusErr) throw new Error(statusErr.message);

    const link = `${publicBaseUrl()}/interview?token=${encodeURIComponent(tok.token)}`;

    const subject = "You're shortlisted — complete your interview · Worknesta";
    const html = renderEmailHtml({
      subjectHeadline: "You're shortlisted",
      intro: `Hi ${firstName(app.full_name)},`,
      paragraphs: [
        "Congratulations — you’ve been shortlisted for the next step.",
        "This is a 20-minute text interview. No video or phone call is required, and you can complete it on your own time.",
        "Your private interview link expires in 72 hours.",
        "Please find a quiet space before starting. Once you begin, you cannot pause or go back.",
      ],
      ctaLabel: "Begin interview",
      ctaUrl: link,
    });
    const text = renderEmailText({
      subjectHeadline: "You're shortlisted",
      intro: `Hi ${firstName(app.full_name)},`,
      paragraphs: [
        "Congratulations — you’ve been shortlisted for the next step.",
        "This is a 20-minute text interview. No video or phone call is required, and you can complete it on your own time.",
        "Your private interview link expires in 72 hours.",
        "Please find a quiet space before starting. Once you begin, you cannot pause or go back.",
      ],
      ctaLabel: "Begin interview",
      ctaUrl: link,
    });

    await sendOrQueueEmail({ to: app.email, subject, html, text });
    return { ok: true };
  });

export const adminSendAssessmentLink = createServerFn({ method: "POST" })
  .inputValidator(z.object({ password: z.string().min(1), applicationId: z.string().uuid() }))
  .handler(async ({ data }) => {
    mustAdmin(data.password);
    const sb = getSupabaseAdmin();

    const { data: app, error: fetchErr } = await sb
      .from("applications")
      .select("id, full_name, email, role_slug, role_title")
      .eq("id", data.applicationId)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);

    const token = generateToken();
    const expiresAt = expiresInHours(48);
    const { data: tok, error: tokenErr } = await sb
      .from("application_tokens")
      .insert({
        application_id: app.id,
        type: "assessment",
        token,
        expires_at: expiresAt,
        role_slug: app.role_slug,
        role_title: app.role_title,
      })
      .select("token")
      .single();
    if (tokenErr) throw new Error(tokenErr.message);

    const { error: statusErr } = await sb
      .from("applications")
      .update({ status: "assessment_sent" })
      .eq("id", app.id);
    if (statusErr) throw new Error(statusErr.message);

    const link = `${publicBaseUrl()}/assessment?token=${encodeURIComponent(tok.token)}`;
    const subject = "Final step — your skill assessment · Worknesta";
    const html = renderEmailHtml({
      subjectHeadline: "Final step — your skill assessment",
      intro: `Hi ${firstName(app.full_name)},`,
      paragraphs: [
        "You’re one step away from an offer.",
        "This assessment takes approximately 30–45 minutes and should be completed in one sitting.",
        "Please complete it within 48 hours.",
        "Use a laptop (not a phone). For transcription roles, we recommend headphones.",
      ],
      ctaLabel: "Begin assessment",
      ctaUrl: link,
    });
    const text = renderEmailText({
      subjectHeadline: "Final step — your skill assessment",
      intro: `Hi ${firstName(app.full_name)},`,
      paragraphs: [
        "You’re one step away from an offer.",
        "This assessment takes approximately 30–45 minutes and should be completed in one sitting.",
        "Please complete it within 48 hours.",
        "Use a laptop (not a phone). For transcription roles, we recommend headphones.",
      ],
      ctaLabel: "Begin assessment",
      ctaUrl: link,
    });
    await sendOrQueueEmail({ to: app.email, subject, html, text });
    return { ok: true };
  });

export const adminSendOffer = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      password: z.string().min(1),
      applicationId: z.string().uuid(),
      payRate: z.string().min(1).max(50),
      startDate: z.string().min(1).max(50),
      contractDuration: z.string().min(1).max(80),
    }),
  )
  .handler(async ({ data }) => {
    mustAdmin(data.password);
    const sb = getSupabaseAdmin();

    const { data: app, error: fetchErr } = await sb
      .from("applications")
      .select("id, full_name, email, role_slug, role_title, timezone, hours_per_week")
      .eq("id", data.applicationId)
      .single();
    if (fetchErr) throw new Error(fetchErr.message);

    const token = generateToken();
    const expiresAt = expiresInHours(48);
    const { data: tokRow, error: tokenErr } = await sb
      .from("application_tokens")
      .insert({
        application_id: app.id,
        type: "offer",
        token,
        expires_at: expiresAt,
        role_slug: app.role_slug,
        role_title: app.role_title,
      })
      .select("id, token")
      .single();
    if (tokenErr) throw new Error(tokenErr.message);

    const { error: offerErr } = await sb.from("offers").insert({
      application_id: app.id,
      token_id: tokRow.id,
      pay_rate_usd_per_hour: data.payRate,
      start_date: data.startDate,
      contract_duration: data.contractDuration,
    });
    if (offerErr) throw new Error(offerErr.message);

    const { error: statusErr } = await sb.from("applications").update({ status: "offer_sent" }).eq("id", app.id);
    if (statusErr) throw new Error(statusErr.message);

    const link = `${publicBaseUrl()}/offer?token=${encodeURIComponent(tokRow.token)}`;
    const subject = "Your offer from Worknesta 🎉";
    const html = renderEmailHtml({
      subjectHeadline: "Your offer from Worknesta",
      intro: `Hi ${firstName(app.full_name)},`,
      paragraphs: [
        "Congratulations — we’re excited to offer you a position at Worknesta.",
        `Role: ${app.role_title}`,
        `Pay rate: ${data.payRate} USD per hour`,
        `Start date: ${data.startDate}`,
        `Contract duration: ${data.contractDuration}`,
        "You get paid every Friday via Wise or Payoneer.",
        "Your offer link expires in 48 hours.",
      ],
      ctaLabel: "View offer",
      ctaUrl: link,
    });
    const text = renderEmailText({
      subjectHeadline: "Your offer from Worknesta",
      intro: `Hi ${firstName(app.full_name)},`,
      paragraphs: [
        "Congratulations — we’re excited to offer you a position at Worknesta.",
        `Role: ${app.role_title}`,
        `Pay rate: ${data.payRate} USD per hour`,
        `Start date: ${data.startDate}`,
        `Contract duration: ${data.contractDuration}`,
        "You get paid every Friday via Wise or Payoneer.",
        "Your offer link expires in 48 hours.",
      ],
      ctaLabel: "View offer",
      ctaUrl: link,
    });
    await sendOrQueueEmail({ to: app.email, subject, html, text });
    return { ok: true };
  });

export const validateToken = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().min(10), type: z.enum(["interview", "assessment", "offer", "onboarding"]) }))
  .handler(async ({ data }) => {
    const sb = getSupabaseAdmin();
    const { data: row, error } = await sb
      .from("application_tokens")
      .select("id, token, type, expires_at, used_at, application_id, role_slug, role_title")
      .eq("token", data.token)
      .eq("type", data.type)
      .single();
    if (error) return { valid: false as const };
    const expired = new Date(row.expires_at).getTime() <= Date.now();
    const used = Boolean(row.used_at);
    if (expired || used) return { valid: false as const };
    return {
      valid: true as const,
      tokenId: row.id as string,
      applicationId: row.application_id as string,
      roleSlug: row.role_slug as string,
      roleTitle: row.role_title as string,
      expiresAt: row.expires_at as string,
    };
  });

export const submitInterview = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().min(10),
      name: z.string().min(1).max(100),
      email: emailSchema,
      startedAt: z.number().int().nullable(),
      answers: z.array(z.string().max(3000)).length(8),
      timeTakenSeconds: z.number().int().min(0).max(60 * 60).nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const sb = getSupabaseAdmin();
    const { data: tok, error } = await sb
      .from("application_tokens")
      .select("id, application_id, expires_at, used_at, role_title")
      .eq("token", data.token)
      .eq("type", "interview")
      .single();
    if (error) throw new Error("Invalid token");
    if (tok.used_at) throw new Error("Token already used");
    if (new Date(tok.expires_at).getTime() <= Date.now()) throw new Error("Token expired");

    const submittedAt = new Date().toISOString();
    const answersObj = data.answers.reduce<Record<string, string>>((acc, ans, i) => {
      acc[`Q${i + 1}`] = ans ?? "";
      return acc;
    }, {});

    const { error: insertErr } = await sb.from("interview_responses").insert({
      application_id: tok.application_id,
      token_id: tok.id,
      name: data.name,
      email: data.email,
      submitted_at: submittedAt,
      time_taken_seconds: data.timeTakenSeconds ?? null,
      answers: answersObj,
    });
    if (insertErr) throw new Error(insertErr.message);

    const { error: usedErr } = await sb
      .from("application_tokens")
      .update({ used_at: submittedAt })
      .eq("id", tok.id);
    if (usedErr) throw new Error(usedErr.message);

    const { error: statusErr } = await sb
      .from("applications")
      .update({ status: "interview_complete" })
      .eq("id", tok.application_id);
    if (statusErr) throw new Error(statusErr.message);

    const subject = "Interview received — next steps · Worknesta";
    const html = renderEmailHtml({
      subjectHeadline: "Interview received — next steps",
      intro: `Hi ${firstName(data.name)},`,
      paragraphs: [
        "We received your interview responses. Our team will review and reach out within 48 hours with your next step — a short skill assessment.",
      ],
    });
    const text = renderEmailText({
      subjectHeadline: "Interview received — next steps",
      intro: `Hi ${firstName(data.name)},`,
      paragraphs: [
        "We received your interview responses. Our team will review and reach out within 48 hours with your next step — a short skill assessment.",
      ],
    });
    await sendOrQueueEmail({ to: data.email, subject, html, text });

    return { ok: true, roleTitle: tok.role_title as string };
  });

export const submitAssessment = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().min(10),
      name: z.string().min(1).max(100),
      email: emailSchema,
      timeTakenSeconds: z.number().int().min(0).max(3 * 60 * 60).nullable(),
      kind: z.enum(["transcription", "data-entry", "qa"]),
      payload: z.record(z.any()),
    }),
  )
  .handler(async ({ data }) => {
    const sb = getSupabaseAdmin();
    const { data: tok, error } = await sb
      .from("application_tokens")
      .select("id, application_id, expires_at, used_at, role_title")
      .eq("token", data.token)
      .eq("type", "assessment")
      .single();
    if (error) throw new Error("Invalid token");
    if (tok.used_at) throw new Error("Token already used");
    if (new Date(tok.expires_at).getTime() <= Date.now()) throw new Error("Token expired");

    const submittedAt = new Date().toISOString();
    const { error: insertErr } = await sb.from("assessment_submissions").insert({
      application_id: tok.application_id,
      token_id: tok.id,
      name: data.name,
      email: data.email,
      submitted_at: submittedAt,
      time_taken_seconds: data.timeTakenSeconds ?? null,
      kind: data.kind,
      payload: data.payload,
    });
    if (insertErr) throw new Error(insertErr.message);

    const { error: usedErr } = await sb.from("application_tokens").update({ used_at: submittedAt }).eq("id", tok.id);
    if (usedErr) throw new Error(usedErr.message);

    const { error: statusErr } = await sb
      .from("applications")
      .update({ status: "assessment_complete" })
      .eq("id", tok.application_id);
    if (statusErr) throw new Error(statusErr.message);

    const subject = "Assessment received — offer coming soon · Worknesta";
    const html = renderEmailHtml({
      subjectHeadline: "Assessment received",
      intro: `Hi ${firstName(data.name)},`,
      paragraphs: [
        "We received your assessment. Our team will review and send your official offer letter within 24 hours.",
      ],
    });
    const text = renderEmailText({
      subjectHeadline: "Assessment received",
      intro: `Hi ${firstName(data.name)},`,
      paragraphs: [
        "We received your assessment. Our team will review and send your official offer letter within 24 hours.",
      ],
    });
    await sendOrQueueEmail({ to: data.email, subject, html, text });
    return { ok: true, roleTitle: tok.role_title as string };
  });

export const getOfferByToken = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().min(10) }))
  .handler(async ({ data }) => {
    const sb = getSupabaseAdmin();
    const { data: tok, error } = await sb
      .from("application_tokens")
      .select("id, application_id, expires_at, used_at, role_title")
      .eq("token", data.token)
      .eq("type", "offer")
      .single();
    if (error) return { valid: false as const };
    if (new Date(tok.expires_at).getTime() <= Date.now()) return { valid: false as const };

    const { data: app, error: appErr } = await sb
      .from("applications")
      .select("full_name, email, timezone, hours_per_week, role_title, role_slug, status")
      .eq("id", tok.application_id)
      .single();
    if (appErr) return { valid: false as const };

    const { data: offer, error: offerErr } = await sb
      .from("offers")
      .select("pay_rate_usd_per_hour, start_date, contract_duration, accepted_at, declined_at")
      .eq("token_id", tok.id)
      .single();
    if (offerErr) return { valid: false as const };

    return {
      valid: true as const,
      applicationId: tok.application_id as string,
      tokenId: tok.id as string,
      expiresAt: tok.expires_at as string,
      roleTitle: app.role_title as string,
      roleSlug: app.role_slug as string,
      candidateName: app.full_name as string,
      candidateEmail: app.email as string,
      timezone: app.timezone as string,
      hoursPerWeek: String(app.hours_per_week),
      payRate: offer.pay_rate_usd_per_hour as string,
      startDate: offer.start_date as string,
      contractDuration: offer.contract_duration as string,
      acceptedAt: offer.accepted_at as string | null,
      declinedAt: offer.declined_at as string | null,
    };
  });

export const acceptOffer = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().min(10),
      agree: z.boolean(),
      signatureName: z.string().min(2).max(120),
      signatureDate: z.string().min(6).max(40),
    }),
  )
  .handler(async ({ data }) => {
    if (!data.agree) throw new Error("Must agree to terms");
    const sb = getSupabaseAdmin();

    const { data: tok, error } = await sb
      .from("application_tokens")
      .select("id, application_id, expires_at, used_at, role_title")
      .eq("token", data.token)
      .eq("type", "offer")
      .single();
    if (error) throw new Error("Invalid token");
    if (tok.used_at) throw new Error("Token already used");
    if (new Date(tok.expires_at).getTime() <= Date.now()) throw new Error("Token expired");

    const { data: app, error: appErr } = await sb
      .from("applications")
      .select("full_name, email, role_title, role_slug")
      .eq("id", tok.application_id)
      .single();
    if (appErr) throw new Error(appErr.message);

    const ip =
      getRequestIP({ xForwardedFor: true }) ||
      getRequestHeader("cf-connecting-ip") ||
      getRequestHeader("x-forwarded-for") ||
      null;
    const now = new Date().toISOString();

    const { error: offerErr } = await sb
      .from("offers")
      .update({
        accepted_at: now,
        signature_name: data.signatureName,
        signature_date: data.signatureDate,
        signature_ip: ip,
      })
      .eq("token_id", tok.id);
    if (offerErr) throw new Error(offerErr.message);

    const { error: usedErr } = await sb.from("application_tokens").update({ used_at: now }).eq("id", tok.id);
    if (usedErr) throw new Error(usedErr.message);

    const { error: statusErr } = await sb
      .from("applications")
      .update({ status: "offer_accepted" })
      .eq("id", tok.application_id);
    if (statusErr) throw new Error(statusErr.message);

    // issue onboarding token
    const onboardingToken = generateToken();
    const { data: onboardTok, error: onboardErr } = await sb
      .from("application_tokens")
      .insert({
        application_id: tok.application_id,
        type: "onboarding",
        token: onboardingToken,
        expires_at: expiresInHours(24 * 30), // generous window for onboarding
        role_slug: app.role_slug,
        role_title: app.role_title,
      })
      .select("token, id")
      .single();
    if (onboardErr) throw new Error(onboardErr.message);

    await sb.from("onboarding").insert({
      application_id: tok.application_id,
      token_id: onboardTok.id,
    });

    const onboardingLink = `${publicBaseUrl()}/api/auth/verify?t=${encodeURIComponent(onboardTok.token)}&next=${encodeURIComponent("/onboarding")}`;

    const candidateSubject = "Welcome to Worknesta! Here is how to get started 🎉";
    const candidateHtml = renderEmailHtml({
      subjectHeadline: "Welcome to Worknesta!",
      intro: `Hi ${firstName(app.full_name)},`,
      paragraphs: [
        `Welcome to Worknesta. This email confirms your role as ${app.role_title}.`,
        "Please complete your onboarding before your start date using the link below.",
        "Your first task arrives within 24 hours of completing onboarding.",
      ],
      ctaLabel: "Complete onboarding",
      ctaUrl: onboardingLink,
    });
    const candidateText = renderEmailText({
      subjectHeadline: "Welcome to Worknesta!",
      intro: `Hi ${firstName(app.full_name)},`,
      paragraphs: [
        `Welcome to Worknesta. This email confirms your role as ${app.role_title}.`,
        "Please complete your onboarding before your start date using the link below.",
        "Your first task arrives within 24 hours of completing onboarding.",
      ],
      ctaLabel: "Complete onboarding",
      ctaUrl: onboardingLink,
    });
    await sendOrQueueEmail({ to: app.email, subject: candidateSubject, html: candidateHtml, text: candidateText });

    const adminSubject = `${app.full_name} accepted their offer — ${app.role_title}`;
    const adminHtml = renderEmailHtml({
      subjectHeadline: "Offer accepted",
      paragraphs: [
        `Candidate: ${app.full_name}`,
        `Role: ${app.role_title}`,
        `Email: ${app.email}`,
        `Signed at: ${now}`,
      ],
    });
    const adminText = renderEmailText({
      subjectHeadline: "Offer accepted",
      paragraphs: [
        `Candidate: ${app.full_name}`,
        `Role: ${app.role_title}`,
        `Email: ${app.email}`,
        `Signed at: ${now}`,
      ],
    });
    await sendOrQueueEmail({ to: ADMIN_EMAIL(), subject: adminSubject, html: adminHtml, text: adminText });

    return { ok: true, onboardingLink };
  });

export const declineOffer = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().min(10),
      reason: z.string().min(1).max(120),
      note: z.string().max(500).optional().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const sb = getSupabaseAdmin();
    const { data: tok, error } = await sb
      .from("application_tokens")
      .select("id, application_id, expires_at, used_at")
      .eq("token", data.token)
      .eq("type", "offer")
      .single();
    if (error) throw new Error("Invalid token");
    if (tok.used_at) throw new Error("Token already used");
    if (new Date(tok.expires_at).getTime() <= Date.now()) throw new Error("Token expired");

    const now = new Date().toISOString();
    const { error: offerErr } = await sb
      .from("offers")
      .update({
        declined_at: now,
        decline_reason: data.reason,
        decline_note: data.note ?? null,
      })
      .eq("token_id", tok.id);
    if (offerErr) throw new Error(offerErr.message);

    const { error: usedErr } = await sb.from("application_tokens").update({ used_at: now }).eq("id", tok.id);
    if (usedErr) throw new Error(usedErr.message);

    const { error: statusErr } = await sb
      .from("applications")
      .update({ status: "offer_declined" })
      .eq("id", tok.application_id);
    if (statusErr) throw new Error(statusErr.message);
    return { ok: true };
  });

export const onboardingGet = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().min(10) }))
  .handler(async ({ data }) => {
    const sb = getSupabaseAdmin();
    const { data: tok, error } = await sb
      .from("application_tokens")
      .select("id, application_id, expires_at, used_at, role_title, role_slug")
      .eq("token", data.token)
      .eq("type", "onboarding")
      .single();
    if (error) return { valid: false as const };
    if (new Date(tok.expires_at).getTime() <= Date.now()) return { valid: false as const };

    const { data: app, error: appErr } = await sb
      .from("applications")
      .select("full_name, email, role_title, role_slug, status")
      .eq("id", tok.application_id)
      .single();
    if (appErr) return { valid: false as const };

    return {
      valid: true as const,
      applicationId: tok.application_id as string,
      roleSlug: app.role_slug as string,
      roleTitle: app.role_title as string,
      name: app.full_name as string,
      email: app.email as string,
    };
  });

export const onboardingComplete = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().min(10), ready: z.boolean() }))
  .handler(async ({ data }) => {
    if (!data.ready) throw new Error("Not ready");
    const sb = getSupabaseAdmin();
    const { data: tok, error } = await sb
      .from("application_tokens")
      .select("id, application_id, expires_at")
      .eq("token", data.token)
      .eq("type", "onboarding")
      .single();
    if (error) throw new Error("Invalid token");
    if (new Date(tok.expires_at).getTime() <= Date.now()) throw new Error("Token expired");
      const now = new Date().toISOString();
      try {
        await sb.from("onboarding").update({ completed_at: now }).eq("token_id", tok.id);
      } catch (e) {
        console.warn("Failed to update onboarding.completed_at", e instanceof Error ? e.message : e);
      }

      try {
        await sb.from("applications").update({ status: "active" }).eq("id", tok.application_id);
      } catch (e) {
        console.warn("Failed to update application status during onboardingComplete", e instanceof Error ? e.message : e);
      }

      let app: any = null;
      try {
        const res = await sb
          .from("applications")
          .select("full_name, email, role_title")
          .eq("id", tok.application_id)
          .single();
        app = res.data;
      } catch (e) {
        console.warn("Failed to fetch application after onboardingComplete", e instanceof Error ? e.message : e);
      }

      try {
        const adminSubject = `${app?.full_name ?? "Candidate"} completed onboarding — ${app?.role_title ?? ""}`.trim();
        const adminHtml = renderEmailHtml({
          subjectHeadline: "Onboarding completed",
          paragraphs: [
            `Name: ${app?.full_name ?? ""}`,
            `Role: ${app?.role_title ?? ""}`,
            `Email: ${app?.email ?? ""}`,
            `Completed at: ${now}`,
            "This candidate is ready for their first task.",
          ],
        });
        const adminText = renderEmailText({
          subjectHeadline: "Onboarding completed",
          paragraphs: [
            `Name: ${app?.full_name ?? ""}`,
            `Role: ${app?.role_title ?? ""}`,
            `Email: ${app?.email ?? ""}`,
            `Completed at: ${now}`,
            "This candidate is ready for their first task.",
          ],
        });
        await sendOrQueueEmail({ to: ADMIN_EMAIL(), subject: adminSubject, html: adminHtml, text: adminText });
      } catch (e) {
        console.warn("Failed to send admin onboarding-completed email", e instanceof Error ? e.message : e);
      }

      return { ok: true };
  });


export const adminMarkActive = createServerFn({ method: "POST" })
  .inputValidator(z.object({ password: z.string().min(1), applicationId: z.string().uuid() }))
  .handler(async ({ data }) => {
    mustAdmin(data.password);
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("applications").update({ status: "active" }).eq("id", data.applicationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendSupportMessage = createServerFn({ method: "POST" })
  .inputValidator(z.object({ applicationId: z.string().uuid(), message: z.string().min(3).max(2000) }))
  .handler(async ({ data }) => {
    const sb = getSupabaseAdmin();
    const { data: app, error: appErr } = await sb
      .from("applications")
      .select("id, full_name, email, role_title")
      .eq("id", data.applicationId)
      .single();
    if (appErr || !app) throw new Error("Application not found");

    const subject = `Support message from ${app.full_name}`;
    const html = renderEmailHtml({
      subjectHeadline: "Support message",
      paragraphs: [
        `From: ${app.full_name} <${app.email}>`,
        `Role: ${app.role_title}`,
        "",
        data.message,
      ],
    });
    const text = renderEmailText({
      subjectHeadline: "Support message",
      paragraphs: [
        `From: ${app.full_name} <${app.email}>`,
        `Role: ${app.role_title}`,
        "",
        data.message,
      ],
    });
    await sendOrQueueEmail({ to: ADMIN_EMAIL(), subject, html, text });
    return { ok: true };
  });

const applicationIdSchema = z.string().uuid();

export const getSkillsProfileState = createServerFn({ method: "POST" })
  .inputValidator(z.object({ applicationId: applicationIdSchema }))
  .handler(async ({ data }) => pipelineGetSkillsProfileState(data.applicationId));

export const submitSkillsProfile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      applicationId: applicationIdSchema,
      answers: z.record(z.string()),
    }),
  )
  .handler(async ({ data }) => {
    try {
      return await pipelineSubmitSkillsProfile(data.applicationId, data.answers);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Skills profile submission failed";
      throw new Error(msg);
    }
  });

export const getWorkspaceDashboardState = createServerFn({ method: "POST" })
  .inputValidator(z.object({ applicationId: applicationIdSchema }))
  .handler(async ({ data }) => pipelineGetWorkspaceDashboardState(data.applicationId));

export const getWorkspaceSetupState = createServerFn({ method: "POST" })
  .inputValidator(z.object({ applicationId: applicationIdSchema }))
  .handler(async ({ data }) => pipelineGetWorkspaceSetupState(data.applicationId));

export const submitWorkspaceNda = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      applicationId: applicationIdSchema,
      legalName: z.string().min(2).max(120),
      signature: z.string().min(2).max(120),
    }),
  )
  .handler(async ({ data }) =>
    pipelineSubmitWorkspaceNda(data.applicationId, data.legalName, data.signature),
  );

export const submitWorkspaceContract = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      applicationId: applicationIdSchema,
      declareAccurate: z.literal(true),
      agreeSchedule: z.literal(true),
      employeeSignature: z.string().min(2).max(120),
      witnessSignature: z.string().min(2).max(120),
      vdeToken: z.string().min(16).max(24),
    }),
  )
  .handler(async ({ data }) =>
    pipelineSubmitWorkspaceContract(data.applicationId, {
      employeeSignature: data.employeeSignature,
      witnessSignature: data.witnessSignature,
      vdeToken: data.vdeToken,
    }),
  );

export const getDevPipelineInbox = createServerFn({ method: "POST" }).handler(async () => {
  const inbox = pipelineDevInbox();
  if (!inbox) return { enabled: false as const };
  return { enabled: true as const, ...inbox };
});

export const cronProcessEmails = createServerFn({ method: "POST" })
  .inputValidator(z.object({ secret: z.string().min(1) }))
  .handler(async ({ data }) => {
    const expected = process.env.CRON_SECRET;
    if (!expected || data.secret !== expected) throw new Error("Unauthorized");
    return processScheduledEmails();
  });

function firstName(full: string) {
  const f = full.trim().split(/\s+/)[0] || "there";
  return f.slice(0, 40);
}

// assertWorkspaceAccess removed — use pipelineStore helpers

// ─── Session-based workspace server functions ─────────────────────────────────

// ─── Session resolution ────────────────────────────────────────────────────────
// UUID regex — used to validate client-supplied fallback IDs.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Cookie-first applicationId resolver.
 * Falls back to the client-supplied `clientAppId` (from localStorage) when the
 * Primary: verify Supabase JWT via auth.getUser() and extract applicationId from user metadata.
 * Fallback: accept client-supplied UUID (still protected by DB existence/status check in each caller).
 */
async function resolveAppId(clientAppId?: string | null, accessToken?: string | null): Promise<string | null> {
  if (accessToken) {
    try {
      const { data: { user } } = await getSupabaseAdmin().auth.getUser(accessToken);
      if (user) {
        const metaAppId = user.user_metadata?.applicationId as string | undefined;
        if (metaAppId && UUID_RE.test(metaAppId)) return metaAppId;
      }
    } catch { /* fall through */ }
  }
  return clientAppId && UUID_RE.test(clientAppId) ? clientAppId : null;
}

export const getWorkspaceBySession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ clientAppId: z.string().optional(), accessToken: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const applicationId = await resolveAppId(data?.clientAppId, data?.accessToken);
    if (!applicationId) return { authenticated: false as const };

    const sb = getSupabaseAdmin();
    const { data: app, error: appErr } = await sb
      .from("applications")
      .select("id, full_name, email, role_title, role_slug, status")
      .eq("id", applicationId)
      .maybeSingle();
    if (appErr || !app) return { authenticated: false as const };

    const { data: skills } = await sb
      .from("skills_profile_submissions")
      .select("selected_for_workspace, score_percent")
      .eq("application_id", applicationId)
      .maybeSingle();

    const eligible =
      Boolean(skills?.selected_for_workspace) ||
      ["onboarding", "active", "assessment_complete"].includes(app.status ?? "");
    if (!eligible) return { authenticated: false as const };

    const { data: ws } = await sb
      .from("workspace_onboarding")
      .select("nda_signed_at, contract_submitted_at, nda_legal_name")
      .eq("application_id", applicationId)
      .maybeSingle();

    return {
      authenticated: true as const,
      applicationId,
      candidateName: app.full_name as string,
      email: app.email as string,
      roleTitle: app.role_title as string,
      roleSlug: app.role_slug as string,
      scorePercent: skills?.score_percent ?? null as number | null,
      ndaSigned: Boolean(ws?.nda_signed_at),
      contractSubmitted: Boolean(ws?.contract_submitted_at),
    };
  });

export const getTaskProgressBySession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ clientAppId: z.string().optional(), accessToken: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const applicationId = await resolveAppId(data?.clientAppId, data?.accessToken);
    if (!applicationId) return { authenticated: false as const, tasks: [] };

    const sb = getSupabaseAdmin();
    try {
      const { data } = await sb
        .from("task_progress")
        .select("task_id, status, transcription_text, submitted_at, reviewed_at, earnings_usd")
        .eq("application_id", applicationId);
      return {
        authenticated: true as const,
        applicationId,
        tasks: (data ?? []) as {
          task_id: string;
          status: string;
          transcription_text: string | null;
          submitted_at: string | null;
          reviewed_at: string | null;
          earnings_usd: number | null;
        }[],
      };
    } catch {
      return { authenticated: true as const, applicationId, tasks: [] };
    }
  });

export const submitTranscriptionTask = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      taskId: z.string().min(1),
      transcriptionText: z.string().min(1),
      earningsUsd: z.number().positive(),
      clientAppId: z.string().optional(),
      accessToken: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const applicationId = await resolveAppId(data.clientAppId, data.accessToken);
    if (!applicationId) throw new Error("Not authenticated");

    const sb = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { error } = await sb.from("task_progress").upsert(
      {
        application_id: applicationId,
        task_id: data.taskId,
        status: "submitted",
        transcription_text: data.transcriptionText,
        submitted_at: now,
        earnings_usd: data.earningsUsd,
        updated_at: now,
      },
      { onConflict: "application_id,task_id" },
    );
    if (error) throw new Error(`Failed to submit task: ${error.message}`);
    return { ok: true };
  });

export const getPaymentInfoBySession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ clientAppId: z.string().optional(), accessToken: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const applicationId = await resolveAppId(data?.clientAppId, data?.accessToken);
    if (!applicationId) return null;

    const sb = getSupabaseAdmin();
    try {
      const { data } = await sb
        .from("payment_info")
        .select("payment_method, account_email, account_name")
        .eq("application_id", applicationId)
        .maybeSingle();
      return data as { payment_method: string | null; account_email: string | null; account_name: string | null } | null;
    } catch {
      return null;
    }
  });

export const savePaymentInfoBySession = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      paymentMethod: z.enum(["wise", "payoneer"]),
      accountEmail: z.string().email().max(200),
      accountName: z.string().min(1).max(200),
      clientAppId: z.string().optional(),
      accessToken: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const applicationId = await resolveAppId(data.clientAppId, data.accessToken);
    if (!applicationId) throw new Error("Not authenticated");

    const sb = getSupabaseAdmin();
    const now = new Date().toISOString();
    await sb.from("payment_info").upsert(
      {
        application_id: applicationId,
        payment_method: data.paymentMethod,
        account_email: data.accountEmail,
        account_name: data.accountName,
        updated_at: now,
      },
      { onConflict: "application_id" },
    );
    return { ok: true };
  });

export const onboardingGetBySession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ clientAppId: z.string().optional(), accessToken: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const applicationId = await resolveAppId(data?.clientAppId, data?.accessToken);
    if (!applicationId) return { valid: false as const };

    const sb = getSupabaseAdmin();
    const { data: app, error } = await sb
      .from("applications")
      .select("full_name, role_title, role_slug")
      .eq("id", applicationId)
      .maybeSingle();
    if (error || !app) return { valid: false as const };

    return {
      valid: true as const,
      applicationId,
      name: app.full_name as string,
      roleTitle: app.role_title as string,
      roleSlug: app.role_slug as string,
    };
  });

export const onboardingCompleteBySession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ ready: z.boolean(), clientAppId: z.string().optional(), accessToken: z.string().optional() }))
  .handler(async ({ data }) => {
    const applicationId = await resolveAppId(data.clientAppId, data.accessToken);
    if (!applicationId) throw new Error("Not authenticated");
    if (!data.ready) throw new Error("Must confirm readiness");

    const sb = getSupabaseAdmin();

    // Fetch current application so we can be idempotent and send the admin email
    const { data: app, error: appErr } = await sb
      .from("applications")
      .select("full_name, email, role_title, status")
      .eq("id", applicationId)
      .maybeSingle();
    if (appErr || !app) throw new Error("Application not found");

    // Already active — nothing to do (idempotent)
    if (app.status === "active") return { ok: true, alreadyComplete: true };

    const now = new Date().toISOString();

    // Mark as active — this is the completion of onboarding.
    // .select("id") lets us check whether any row was actually updated, so a
    // concurrent request that already flipped the status won't trigger a
    // duplicate admin email.
    const { data: updated, error: updateErr } = await sb
      .from("applications")
      .update({ status: "active" })
      .eq("id", applicationId)
      .neq("status", "active") // race guard: only matches if not yet active
      .select("id");
    if (updateErr) throw new Error(updateErr.message);

    // 0 rows updated means a concurrent request already completed onboarding
    if (!updated || updated.length === 0) return { ok: true, alreadyComplete: true };

    // Notify admin — only reached when the transition actually happened
    try {
      const adminSubject = `${app.full_name} completed onboarding — ${app.role_title}`.trim();
      const adminHtml = renderEmailHtml({
        subjectHeadline: "Onboarding completed",
        paragraphs: [
          `Name: ${app.full_name}`,
          `Role: ${app.role_title}`,
          `Email: ${app.email}`,
          `Completed at: ${now}`,
          "This contractor is ready for their first task.",
        ],
      });
      const adminText = renderEmailText({
        subjectHeadline: "Onboarding completed",
        paragraphs: [
          `Name: ${app.full_name}`,
          `Role: ${app.role_title}`,
          `Email: ${app.email}`,
          `Completed at: ${now}`,
          "This contractor is ready for their first task.",
        ],
      });
      await sendOrQueueEmail({ to: ADMIN_EMAIL(), subject: adminSubject, html: adminHtml, text: adminText });
    } catch (e) {
      console.warn("Failed to send admin onboarding-completed email", e instanceof Error ? e.message : e);
    }

    return { ok: true, alreadyComplete: false };
  });

// ─── Document upload / fetch ───────────────────────────────────────────────────

export const uploadDocumentBySession = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      docType: z.enum(["medical_cert", "id_document", "other"]),
      fileName: z.string().min(1).max(200),
      mimeType: z.string().min(1).max(100),
      base64Data: z.string().min(1).max(8 * 1024 * 1024), // ~6 MB base64 → ~4.5 MB file
      clientAppId: z.string().optional(),
      accessToken: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const applicationId = await resolveAppId(data.clientAppId, data.accessToken);
    if (!applicationId) throw new Error("Not authenticated");

    const sb = getSupabaseAdmin();
    const buffer = Buffer.from(data.base64Data, "base64");
    const ext = data.fileName.split(".").pop()?.toLowerCase() ?? "bin";
    const storagePath = `${applicationId}/${data.docType}.${ext}`;

    // Upload to Supabase Storage bucket "contractor-docs"
    const { error: uploadErr } = await sb.storage
      .from("contractor-docs")
      .upload(storagePath, buffer, { contentType: data.mimeType, upsert: true });
    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

    const now = new Date().toISOString();
    await sb.from("contractor_documents").upsert(
      {
        application_id: applicationId,
        doc_type: data.docType,
        file_name: data.fileName,
        storage_path: storagePath,
        uploaded_at: now,
        verified_at: null,
        verified_by: null,
      },
      { onConflict: "application_id,doc_type" },
    );
    return { ok: true, storagePath };
  });

export const getDocumentsBySession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ clientAppId: z.string().optional(), accessToken: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const applicationId = await resolveAppId(data?.clientAppId, data?.accessToken);
    if (!applicationId) return { authenticated: false as const, docs: [] };

    const sb = getSupabaseAdmin();
    try {
      const { data: rows } = await sb
        .from("contractor_documents")
        .select("doc_type, file_name, uploaded_at, verified_at, verified_by")
        .eq("application_id", applicationId);
      return {
        authenticated: true as const,
        docs: (rows ?? []) as {
          doc_type: string;
          file_name: string;
          uploaded_at: string;
          verified_at: string | null;
          verified_by: string | null;
        }[],
      };
    } catch {
      return { authenticated: true as const, docs: [] };
    }
  });

// ─── Admin: transcription review ───────────────────────────────────────────────

export const adminListTranscriptions = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      password: z.string().min(1),
      status: z.enum(["all", "submitted", "reviewed"]).optional(),
      since: z.string().optional(), // ISO timestamp — only return rows submitted after this
    }),
  )
  .handler(async ({ data }) => {
    mustAdmin(data.password);
    const sb = getSupabaseAdmin();

    let q = sb
      .from("task_progress")
      .select(
        "id, task_id, status, submitted_at, reviewed_at, earnings_usd, application_id, applications(full_name, email, role_title)",
      )
      .order("submitted_at", { ascending: false });

    if (data.status && data.status !== "all") {
      q = q.eq("status", data.status);
    }
    if (data.since) {
      q = q.gte("submitted_at", data.since);
    }

    const { data: rows, error } = await q;
    if (error) {
      // Table not yet created in this Supabase project — return setup flag instead of crashing
      if (error.message.includes("task_progress") || error.message.includes("schema cache") || error.code === "42P01") {
        return { rows: [] as any[], setupRequired: true };
      }
      throw new Error(error.message);
    }
    return { rows: (rows ?? []) as any[], setupRequired: false };
  });

export const adminMarkTranscriptionReviewed = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      password: z.string().min(1),
      taskProgressId: z.string().uuid(),
    }),
  )
  .handler(async ({ data }) => {
    mustAdmin(data.password);
    const sb = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { error } = await sb
      .from("task_progress")
      .update({ status: "reviewed", reviewed_at: now, updated_at: now })
      .eq("id", data.taskProgressId);
    if (error) {
      if (error.message.includes("task_progress") || error.message.includes("schema cache") || error.code === "42P01") {
        throw new Error("The task_progress table does not exist yet. Please run schema-additions.sql in your Supabase SQL editor.");
      }
      throw new Error(error.message);
    }
    return { ok: true };
  });

/** Bulk-mark all submitted transcriptions since a given timestamp as reviewed */
export const adminBulkMarkReviewed = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      password: z.string().min(1),
      since: z.string().min(1), // ISO timestamp
    }),
  )
  .handler(async ({ data }) => {
    mustAdmin(data.password);
    const sb = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { error, count } = await sb
      .from("task_progress")
      .update({ status: "reviewed", reviewed_at: now, updated_at: now })
      .eq("status", "submitted")
      .gte("submitted_at", data.since);
    if (error) {
      if (error.message.includes("task_progress") || error.message.includes("schema cache") || error.code === "42P01") {
        return { ok: true, updated: 0 };
      }
      throw new Error(error.message);
    }
    return { ok: true, updated: count ?? 0 };
  });

/** Per-contractor transcription summary for the admin stats view */
export const adminGetContractorBreakdown = createServerFn({ method: "POST" })
  .inputValidator(z.object({ password: z.string().min(1) }))
  .handler(async ({ data }) => {
    mustAdmin(data.password);
    const sb = getSupabaseAdmin();
    const { data: rows, error } = await sb
      .from("task_progress")
      .select("application_id, status, earnings_usd, applications(full_name, email)")
      .in("status", ["submitted", "reviewed"]);
    if (error) {
      // Table not yet created — return empty gracefully
      if (error.message.includes("task_progress") || error.message.includes("schema cache") || error.code === "42P01") {
        return { contractors: [], setupRequired: true };
      }
      throw new Error(error.message);
    }

    // Aggregate per application
    const map = new Map<string, { name: string; email: string; submitted: number; reviewed: number; earnings: number }>();
    for (const r of rows ?? []) {
      const app = r.applications as any;
      if (!map.has(r.application_id)) {
        map.set(r.application_id, { name: app?.full_name ?? "—", email: app?.email ?? "", submitted: 0, reviewed: 0, earnings: 0 });
      }
      const entry = map.get(r.application_id)!;
      if (r.status === "submitted") entry.submitted++;
      if (r.status === "reviewed") { entry.reviewed++; entry.earnings += Number(r.earnings_usd ?? 0); }
    }

    return {
      contractors: Array.from(map.values()).sort((a, b) => (b.submitted + b.reviewed) - (a.submitted + a.reviewed)),
      setupRequired: false,
    };
  });

export const adminGetStats = createServerFn({ method: "POST" })
  .inputValidator(z.object({ password: z.string().min(1) }))
  .handler(async ({ data }) => {
    mustAdmin(data.password);
    const sb = getSupabaseAdmin();

    const [{ count: totalContractors }, { count: totalSubmitted }, { count: underReview }, { count: totalReviewed }, earningsResult] =
      await Promise.all([
        sb.from("applications").select("id", { count: "exact", head: true }).in("status", ["active", "onboarding"]),
        sb.from("task_progress").select("id", { count: "exact", head: true }),
        sb.from("task_progress").select("id", { count: "exact", head: true }).eq("status", "submitted"),
        sb.from("task_progress").select("id", { count: "exact", head: true }).eq("status", "reviewed"),
        sb.from("task_progress").select("earnings_usd").eq("status", "reviewed"),
      ]);

    const totalEarningsUsd = ((earningsResult.data ?? []) as { earnings_usd: number | null }[]).reduce(
      (sum, r) => sum + (r.earnings_usd ?? 0),
      0,
    );

    return {
      totalContractors: totalContractors ?? 0,
      totalSubmitted: totalSubmitted ?? 0,
      underReview: underReview ?? 0,
      totalReviewed: totalReviewed ?? 0,
      totalEarningsUsd: parseFloat(totalEarningsUsd.toFixed(2)),
    };
  });

export const adminVerifyDocument = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      password: z.string().min(1),
      applicationId: z.string().uuid(),
      docType: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    mustAdmin(data.password);
    const sb = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { error } = await sb
      .from("contractor_documents")
      .update({ verified_at: now, verified_by: "admin" })
      .eq("application_id", data.applicationId)
      .eq("doc_type", data.docType);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendSupportMessageBySession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ message: z.string().min(5).max(2000), clientAppId: z.string().optional(), accessToken: z.string().optional() }))
  .handler(async ({ data }) => {
    const applicationId = await resolveAppId(data.clientAppId, data.accessToken);
    if (!applicationId) throw new Error("Not authenticated");

    const sb = getSupabaseAdmin();
    const { data: app } = await sb
      .from("applications")
      .select("email, full_name")
      .eq("id", applicationId)
      .maybeSingle();

    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || "talent@worknesta.com";
    const subject = `Workspace support request — ${app?.full_name ?? applicationId}`;
    const html = renderEmailHtml({
      subjectHeadline: "Support request",
      paragraphs: [
        `From: ${app?.full_name ?? "Contractor"} (${app?.email ?? applicationId})`,
        data.message,
      ],
    });
    const text = renderEmailText({
      subjectHeadline: "Support request",
      paragraphs: [
        `From: ${app?.full_name ?? "Contractor"} (${app?.email ?? applicationId})`,
        data.message,
      ],
    });
    await sendOrQueueEmail({ to: adminEmail, subject, html, text });
    return { ok: true };
  });

