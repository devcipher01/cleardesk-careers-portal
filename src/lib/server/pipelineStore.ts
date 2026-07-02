import { getJobBySlug } from "@/lib/jobs";
import { adminNotifyEmail } from "./devMode";
import {
  displaySkillsScore,
  getSkillsQuizForRole,
  scoreSkillsProfile,
  VDE_TOKEN_REGEX,
} from "@/lib/careersPipeline";
import { getSupabaseAdmin } from "./supabaseAdmin";
import {
  isLocalDevMode,
  pipelineAcceptanceEmailDelayMs,
  pipelineCandidateEmailDelayMs,
  publicBaseUrl,
  isImmediateTestEmail,
} from "./devMode";
import { generateToken, expiresInHours } from "./tokens";
import { localDevStore } from "./localDevStore";
import { renderEmailHtml, renderEmailText } from "./emailTemplates";
import { scheduleEmail, sendOrQueueEmailSafe } from "./mailer";

export type ApplicationInsertInput = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  timezone: string;
  roleSlug: string;
  roleTitle: string;
  hasComputer: boolean;
  internet: string;
  typingSpeed: string;
  availability: string;
  hoursPerWeek: number;
  whyRemote: string;
  experience: string;
  workedRemote: boolean;
  remoteDescription: string | null;
  source: string;
  resumeFilename: string | null;
  resumeMime: string | null;
  resumeSizeBytes: number | null;
};

function firstName(full: string) {
  return (full.trim().split(/\s+/)[0] || "there").slice(0, 40);
}

export async function pipelineInsertApplication(data: ApplicationInsertInput) {
  if (isLocalDevMode()) {
    const inserted = localDevStore.insertApplication({
      status: "pending",
      full_name: data.fullName,
      email: data.email,
      role_title: data.roleTitle,
      role_slug: data.roleSlug,
      phone: data.phone,
      country: data.country,
      timezone: data.timezone,
      has_computer: data.hasComputer,
      internet: data.internet,
      typing_speed: data.typingSpeed,
      availability: data.availability,
      hours_per_week: data.hoursPerWeek,
      why_remote: data.whyRemote,
      experience: data.experience,
      worked_remote: data.workedRemote,
      remote_description: data.remoteDescription,
      source: data.source,
      resume_filename: data.resumeFilename,
      resume_mime: data.resumeMime,
      resume_size_bytes: data.resumeSizeBytes,
    });
    return {
      id: inserted.id,
      full_name: inserted.full_name,
      email: inserted.email,
      role_title: inserted.role_title,
    };
  }

  const sb = getSupabaseAdmin();
  const { data: inserted, error } = await sb
    .from("applications")
    .insert({
      status: "pending",
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      country: data.country,
      timezone: data.timezone,
      role_slug: data.roleSlug,
      role_title: data.roleTitle,
      has_computer: data.hasComputer,
      internet: data.internet,
      typing_speed: data.typingSpeed,
      availability: data.availability,
      hours_per_week: data.hoursPerWeek,
      why_remote: data.whyRemote,
      experience: data.experience,
      worked_remote: data.workedRemote,
      remote_description: data.remoteDescription,
      source: data.source,
      resume_filename: data.resumeFilename,
      resume_mime: data.resumeMime,
      resume_size_bytes: data.resumeSizeBytes,
    })
    .select("id, full_name, email, role_title")
    .single();
  if (error) throw new Error(error.message);
  return inserted;
}

export async function pipelineSendApplicationEmails(app: {
  id: string;
  full_name: string;
  email: string;
  role_title: string;
}) {
  const assessmentUrl = `${publicBaseUrl()}/careers/assessment?applicationId=${encodeURIComponent(app.id)}`;
  const adminEmail = adminNotifyEmail();
  const adminSubject = `New application: ${app.full_name} — ${app.role_title}`;
  const adminHtml = renderEmailHtml({
    subjectHeadline: "New careers application",
    paragraphs: [
      `Candidate: ${app.full_name}`,
      `Email: ${app.email}`,
      `Role: ${app.role_title}`,
      `Application ID: ${app.id}`,
      "The candidate continues directly to Skills Profile Review in the portal — no separate candidate email is sent for that step.",
    ],
  });
  const adminText = renderEmailText({
    subjectHeadline: "New careers application",
    paragraphs: [
      `Candidate: ${app.full_name}`,
      `Email: ${app.email}`,
      `Role: ${app.role_title}`,
      `Application ID: ${app.id}`,
    ],
  });

  if (isLocalDevMode()) {
    localDevStore.queueEmail({ to: adminEmail, subject: adminSubject, html: adminHtml, text: adminText, delayMs: 0 });
    return { mode: "local" as const, assessmentUrl };
  }

  await sendOrQueueEmailSafe({ to: adminEmail, subject: adminSubject, html: adminHtml, text: adminText });
  return { mode: "sent" as const, assessmentUrl };
}

export async function pipelineGetSkillsProfileState(applicationId: string) {
  if (isLocalDevMode()) {
    const app = localDevStore.getApplication(applicationId);
    if (!app) return { valid: false as const };
    const existing = localDevStore.getSkillsProfile(applicationId);
    return {
      valid: true as const,
      candidateName: app.full_name,
      roleTitle: app.role_title,
      roleSlug: app.role_slug as string,
      email: app.email as string,
      alreadySubmitted: Boolean(existing),
      scorePercent: existing?.score_percent ?? null,
      selectedForWorkspace: existing?.selected_for_workspace ?? false,
    };
  }

  const sb = getSupabaseAdmin();
  const { data: app, error: appErr } = await sb
    .from("applications")
    .select("id, full_name, role_title, role_slug, email")
    .eq("id", applicationId)
    .single();
  if (appErr || !app) return { valid: false as const };

  const { data: existing } = await sb
    .from("skills_profile_submissions")
    .select("score_percent, selected_for_workspace, submitted_at")
    .eq("application_id", applicationId)
    .maybeSingle();

  return {
    valid: true as const,
    candidateName: app.full_name as string,
    roleTitle: app.role_title as string,
    roleSlug: app.role_slug as string,
    email: app.email as string,
    alreadySubmitted: Boolean(existing),
    scorePercent: existing?.score_percent ?? null,
    selectedForWorkspace: existing?.selected_for_workspace ?? false,
  };
}

function buildHiredEmail(opts: {
  name: string;
  roleTitle: string;
  workspaceSetupUrl: string;
}) {
  const subject = `Worknesta: Skills Profile Review complete — workspace setup required`;
  const base = {
    subjectHeadline: "Skills Profile Review complete",
    intro: `Hi ${firstName(opts.name)},`,
    paragraphs: [
      `Your Skills Profile Review for the ${opts.roleTitle} role is complete.`,
      "You are cleared to begin contractor onboarding. Review your agreement, confirm the $24.50/hr USD rate, and finish workspace setup before your first production tasks.",
      "Use the secure link below to open your contractor workspace. Save this message — it contains your personal setup link.",
    ],
    ctaLabel: "Open contractor workspace",
    ctaUrl: opts.workspaceSetupUrl,
  };
  return {
    subject,
    html: renderEmailHtml(base),
    text: renderEmailText(base),
  };
}

async function notifyAdminSkillsProfile(opts: {
  name: string;
  email: string;
  roleTitle: string;
  scorePercent: number;
  selected: boolean;
}) {
  const adminEmail = adminNotifyEmail();
  const subject = `Skills Profile: ${opts.name} — ${opts.scorePercent}% — hired (onboarding pending)`;
  const html = renderEmailHtml({
    subjectHeadline: "Skills Profile Review submitted",
    paragraphs: [
      `Candidate: ${opts.name}`,
      `Email: ${opts.email}`,
      `Role: ${opts.roleTitle}`,
      `Score: ${opts.scorePercent}%`,
      `Outcome: Cleared for contractor onboarding`,
    ],
  });
  const text = renderEmailText({
    subjectHeadline: "Skills Profile Review submitted",
    paragraphs: [
      `Candidate: ${opts.name}`,
      `Email: ${opts.email}`,
      `Role: ${opts.roleTitle}`,
      `Score: ${opts.scorePercent}%`,
      `Outcome: Cleared for contractor onboarding`,
    ],
  });
  await sendOrQueueEmailSafe({ to: adminEmail, subject, html, text });
}

export async function pipelineSubmitSkillsProfile(applicationId: string, answers: Record<string, string>) {
  const submittedAt = new Date().toISOString();
  const workspaceSetupUrl = `${publicBaseUrl()}/onboarding/workspace-setup?applicationId=${encodeURIComponent(applicationId)}`;
  const candidateDelayMs = pipelineCandidateEmailDelayMs();

  if (isLocalDevMode()) {
    const app = localDevStore.getApplication(applicationId);
    if (!app) throw new Error("Application not found");
    if (localDevStore.getSkillsProfile(applicationId)) throw new Error("Skills profile already submitted");

    const roleSlug = (app.role_slug as string) || "ai-content-transcription-validator";
    const questions = getSkillsQuizForRole(roleSlug);
    const scorePercent = scoreSkillsProfile(answers, questions);
    const selected = true;

    localDevStore.insertSkillsProfile({
      application_id: applicationId,
      submitted_at: submittedAt,
      answers,
      score_percent: scorePercent,
      selected_for_workspace: selected,
    });
    localDevStore.updateApplicationStatus(applicationId, "assessment_complete");

    const email = buildHiredEmail({
      name: app.full_name as string,
      roleTitle: app.role_title as string,
      workspaceSetupUrl,
    });
    // If this is the admin/test address or a configured test email, deliver immediately for testing.
    const isTestEmail = isImmediateTestEmail(app.email) || app.email === adminNotifyEmail();
    localDevStore.queueEmail({
      to: app.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      delayMs: isTestEmail ? 0 : candidateDelayMs,
    });
    await notifyAdminSkillsProfile({
      name: app.full_name as string,
      email: app.email as string,
      roleTitle: app.role_title as string,
      scorePercent,
      selected,
    });

    return { ok: true, scorePercent, selectedForWorkspace: selected };
  }

  const sb = getSupabaseAdmin();
  const { data: app, error: appErr } = await sb
    .from("applications")
    .select("id, full_name, email, role_title, role_slug")
    .eq("id", applicationId)
    .single();
  if (appErr || !app) throw new Error("Application not found");

  const { data: dup } = await sb
    .from("skills_profile_submissions")
    .select("application_id")
    .eq("application_id", applicationId)
    .maybeSingle();
  if (dup) throw new Error("Skills profile already submitted");

  const roleSlug = (app.role_slug as string) || "ai-content-transcription-validator";
  const questions = getSkillsQuizForRole(roleSlug);
  const scorePercent = scoreSkillsProfile(answers, questions);
  const selected = true;

  const { error: insErr } = await sb.from("skills_profile_submissions").insert({
    application_id: applicationId,
    submitted_at: submittedAt,
    answers,
    score_percent: scorePercent,
    selected_for_workspace: selected,
  });
  if (insErr) throw new Error(insErr.message);

  await sb.from("applications").update({ status: "assessment_complete" }).eq("id", applicationId);

  // For production (non-local), create an onboarding token and onboarding row so the
  // email contains a single reliable onboarding link: `/onboarding?token=...`.
  if (!isLocalDevMode()) {
    let onboardingLink = workspaceSetupUrl; // fallback if token creation fails
    try {
      const onboardingToken = generateToken();
      const expiresAt = expiresInHours(24 * 30);
      const { data: tokRow, error: tokErr } = await sb
        .from("application_tokens")
        .insert({
          application_id: applicationId,
          type: "onboarding",
          token: onboardingToken,
          expires_at: expiresAt,
          role_slug: app.role_slug,
          role_title: app.role_title,
        })
        .select("id, token")
        .single();
      if (tokRow && !tokErr) {
        const { error: onboardErr } = await sb.from("onboarding").insert({ application_id: applicationId, token_id: tokRow.id });
        if (onboardErr) console.warn("Failed to insert onboarding row:", onboardErr.message);
        onboardingLink = `${publicBaseUrl()}/api/auth/verify?t=${encodeURIComponent(tokRow.token)}&next=/onboarding`;
      } else {
        console.warn("Failed to create onboarding token:", tokErr?.message ?? tokErr);
      }
    } catch (e) {
      console.warn("Error creating onboarding token:", e instanceof Error ? e.message : e);
    }

    const emailWithToken = buildHiredEmail({
      name: app.full_name as string,
      roleTitle: app.role_title as string,
      workspaceSetupUrl: onboardingLink,
    });

    if (isImmediateTestEmail(app.email) || app.email === adminNotifyEmail()) {
      await sendOrQueueEmailSafe({ to: app.email as string, subject: emailWithToken.subject, html: emailWithToken.html, text: emailWithToken.text });
    } else {
      await scheduleEmail(
        {
          to: app.email as string,
          subject: emailWithToken.subject,
          html: emailWithToken.html,
          text: emailWithToken.text,
        },
        candidateDelayMs,
      );
    }
  } else {
    // local dev: keep existing applicationId-based link
    const email = buildHiredEmail({
      name: app.full_name as string,
      roleTitle: app.role_title as string,
      workspaceSetupUrl,
    });
    const isTestEmail = isImmediateTestEmail(app.email) || app.email === adminNotifyEmail();
    localDevStore.queueEmail({
      to: app.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      delayMs: isTestEmail ? 0 : candidateDelayMs,
    });
  }
  await notifyAdminSkillsProfile({
    name: app.full_name as string,
    email: app.email as string,
    roleTitle: app.role_title as string,
    scorePercent,
    selected,
  });

  return { ok: true, scorePercent, selectedForWorkspace: selected };
}

export async function pipelineGetWorkspaceSetupState(applicationId: string) {
  if (isLocalDevMode()) {
    const app = localDevStore.getApplication(applicationId);
    if (!app) return { allowed: false as const };
    const skills = localDevStore.getSkillsProfile(applicationId);
    if (!skills?.selected_for_workspace) return { allowed: false as const };
    const ws = localDevStore.getWorkspace(applicationId);
    return {
      allowed: true as const,
      candidateName: app.full_name,
      roleTitle: app.role_title,
      ndaSigned: Boolean(ws?.nda_signed_at),
      contractSubmitted: Boolean(ws?.contract_submitted_at),
      ndaLegalName: ws?.nda_legal_name ?? "",
    };
  }

  const sb = getSupabaseAdmin();
  const { data: app, error: appErr } = await sb
    .from("applications")
    .select("id, full_name, role_title")
    .eq("id", applicationId)
    .single();
  if (appErr || !app) return { allowed: false as const };

  const { data: skills } = await sb
    .from("skills_profile_submissions")
    .select("selected_for_workspace")
    .eq("application_id", applicationId)
    .maybeSingle();
  if (!skills?.selected_for_workspace) return { allowed: false as const };

  const { data: ws } = await sb
    .from("workspace_onboarding")
    .select("nda_signed_at, contract_submitted_at, nda_legal_name")
    .eq("application_id", applicationId)
    .maybeSingle();

  return {
    allowed: true as const,
    candidateName: app.full_name as string,
    roleTitle: app.role_title as string,
    ndaSigned: Boolean(ws?.nda_signed_at),
    contractSubmitted: Boolean(ws?.contract_submitted_at),
    ndaLegalName: (ws?.nda_legal_name as string) ?? "",
  };
}

export async function pipelineGetWorkspaceDashboardState(applicationId: string) {
  if (isLocalDevMode()) {
    const app = localDevStore.getApplication(applicationId);
    if (!app) return { allowed: false as const };
    const skills = localDevStore.getSkillsProfile(applicationId);
    if (!skills?.selected_for_workspace) return { allowed: false as const };
    const ws = localDevStore.getWorkspace(applicationId);
    return {
      allowed: true as const,
      candidateName: app.full_name as string,
      roleTitle: app.role_title as string,
      scorePercent: displaySkillsScore(skills.score_percent),
      ndaSigned: Boolean(ws?.nda_signed_at),
      contractSubmitted: Boolean(ws?.contract_submitted_at),
    };
  }

  const sb = getSupabaseAdmin();
  const { data: app, error: appErr } = await sb
    .from("applications")
    .select("id, full_name, role_title")
    .eq("id", applicationId)
    .single();
  if (appErr || !app) return { allowed: false as const };

  const { data: skills } = await sb
    .from("skills_profile_submissions")
    .select("selected_for_workspace, score_percent")
    .eq("application_id", applicationId)
    .maybeSingle();
  if (!skills?.selected_for_workspace) return { allowed: false as const };

  const { data: ws } = await sb
    .from("workspace_onboarding")
    .select("nda_signed_at, contract_submitted_at")
    .eq("application_id", applicationId)
    .maybeSingle();

  return {
    allowed: true as const,
    candidateName: app.full_name as string,
    roleTitle: app.role_title as string,
    scorePercent: displaySkillsScore(skills.score_percent as number),
    ndaSigned: Boolean(ws?.nda_signed_at),
    contractSubmitted: Boolean(ws?.contract_submitted_at),
  };
}

export async function pipelineSubmitWorkspaceNda(
  applicationId: string,
  legalName: string,
  signature: string,
) {
  if (isLocalDevMode()) {
    await pipelineAssertWorkspaceAccess(applicationId);
    const now = new Date().toISOString();
    localDevStore.upsertWorkspaceNda(applicationId, {
      nda_legal_name: legalName.trim(),
      nda_signature: signature.trim(),
      nda_signed_at: now,
    });
    const app = localDevStore.getApplication(applicationId)!;
    return { ok: true, candidateName: app.full_name };
  }

  const sb = getSupabaseAdmin();
  const access = await pipelineAssertWorkspaceAccess(applicationId);
  const now = new Date().toISOString();
  const { error } = await sb.from("workspace_onboarding").upsert(
    {
      application_id: applicationId,
      nda_legal_name: legalName.trim(),
      nda_signature: signature.trim(),
      nda_signed_at: now,
    },
    { onConflict: "application_id" },
  );
  if (error) throw new Error(error.message);
  return { ok: true, candidateName: access.full_name as string };
}

export async function pipelineSubmitWorkspaceContract(
  applicationId: string,
  data: {
    employeeSignature: string;
    witnessSignature: string;
    vdeToken: string;
  },
) {
  if (!VDE_TOKEN_REGEX.test(data.vdeToken.trim().toUpperCase())) {
    throw new Error("Invalid V-VDE token format");
  }

  if (isLocalDevMode()) {
    await pipelineAssertWorkspaceAccess(applicationId);
    const ws = localDevStore.getWorkspace(applicationId);
    if (!ws?.nda_signed_at) throw new Error("NDA must be completed first");

    const now = new Date().toISOString();
    localDevStore.updateWorkspaceContract(applicationId, {
      declare_accurate: true,
      agree_schedule: true,
      employee_signature: data.employeeSignature.trim(),
      witness_signature: data.witnessSignature.trim(),
      vde_token: data.vdeToken.trim().toUpperCase(),
      contract_submitted_at: now,
    });
    localDevStore.updateApplicationStatus(applicationId, "onboarding");
    return { ok: true };
  }

  const sb = getSupabaseAdmin();
  await pipelineAssertWorkspaceAccess(applicationId);

  const { data: ws, error: wsErr } = await sb
    .from("workspace_onboarding")
    .select("nda_signed_at")
    .eq("application_id", applicationId)
    .single();
  if (wsErr || !ws?.nda_signed_at) throw new Error("NDA must be completed first");

  const now = new Date().toISOString();
  const { error } = await sb
    .from("workspace_onboarding")
    .update({
      declare_accurate: true,
      agree_schedule: true,
      employee_signature: data.employeeSignature.trim(),
      witness_signature: data.witnessSignature.trim(),
      vde_token: data.vdeToken.trim().toUpperCase(),
      contract_submitted_at: now,
    })
    .eq("application_id", applicationId);
  if (error) throw new Error(error.message);

  await sb.from("applications").update({ status: "onboarding" }).eq("id", applicationId);
  return { ok: true };
}

export async function pipelineAssertWorkspaceAccess(applicationId: string) {
  if (isLocalDevMode()) {
    const app = localDevStore.getApplication(applicationId);
    if (!app) throw new Error("Application not found");
    const skills = localDevStore.getSkillsProfile(applicationId);
    if (!skills?.selected_for_workspace) {
      throw new Error("Workspace setup is not available for this application");
    }
    return app;
  }

  const sb = getSupabaseAdmin();
  const { data: app, error: appErr } = await sb
    .from("applications")
    .select("id, full_name")
    .eq("id", applicationId)
    .single();
  if (appErr || !app) throw new Error("Application not found");

  const { data: skills } = await sb
    .from("skills_profile_submissions")
    .select("selected_for_workspace")
    .eq("application_id", applicationId)
    .maybeSingle();
  if (!skills?.selected_for_workspace) {
    throw new Error("Workspace setup is not available for this application");
  }
  return app;
}

export function pipelineRoleFromSlug(slug: string) {
  return getJobBySlug(slug);
}

export function pipelineDevInbox() {
  if (!isLocalDevMode()) return null;
  return {
    localDevMode: true,
    acceptanceDelayMs: pipelineAcceptanceEmailDelayMs(),
    latestApplicationId: localDevStore.getLatestApplicationId(),
    emails: localDevStore.listEmails(),
  };
}
