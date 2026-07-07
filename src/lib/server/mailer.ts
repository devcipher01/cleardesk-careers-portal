import nodemailer from "nodemailer";
import { BRAND_NAME, BRAND_SUPPORT_EMAIL } from "@/lib/brand";
import { isLocalDevMode } from "./devMode";
import { localDevStore } from "./localDevStore";
import { getSupabaseAdmin } from "./supabaseAdmin";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function hasSmtp() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );
}

async function deliverSmtp(input: SendEmailInput) {
  const from = process.env.MAIL_FROM || `${BRAND_NAME} <${BRAND_SUPPORT_EMAIL}>`;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

/** Send immediately (admin test notifications). */
export async function sendOrQueueEmail(input: SendEmailInput) {
  if (isLocalDevMode()) {
    localDevStore.queueEmail({ ...input, delayMs: 0 });
    return { mode: "local" as const };
  }

  if (hasSmtp()) {
    await deliverSmtp(input);
    return { mode: "smtp" as const };
  }

  const sb = getSupabaseAdmin();
  const { error } = await sb.from("email_outbox").insert({
    to_email: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text ?? null,
    status: "queued",
    send_after: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  return { mode: "outbox" as const };
}

/** Schedule candidate-facing email (18–24h in production). */
export async function scheduleEmail(input: SendEmailInput, delayMs: number) {
  if (isLocalDevMode()) {
    localDevStore.queueEmail({ ...input, delayMs });
    return { mode: "local" as const };
  }

  const sendAfter = new Date(Date.now() + Math.max(0, delayMs)).toISOString();
  const sb = getSupabaseAdmin();
  const { error } = await sb.from("email_outbox").insert({
    to_email: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text ?? null,
    status: "scheduled",
    send_after: sendAfter,
  });
  if (error) throw new Error(error.message);
  return { mode: "scheduled" as const, sendAfter };
}

export async function processScheduledEmails() {
  if (isLocalDevMode()) return { processed: 0 };

  const sb = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data: rows, error } = await sb
    .from("email_outbox")
    .select("id, to_email, subject, html, text")
    .eq("status", "scheduled")
    .lte("send_after", now)
    .limit(50);
  if (error) throw new Error(error.message);

  let processed = 0;
  for (const row of rows ?? []) {
    try {
      if (hasSmtp()) {
        await deliverSmtp({
          to: row.to_email as string,
          subject: row.subject as string,
          html: row.html as string,
          text: (row.text as string) ?? undefined,
        });
      }
      await sb
        .from("email_outbox")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id);
      processed += 1;
    } catch (e) {
      await sb
        .from("email_outbox")
        .update({
          status: "error",
          error: e instanceof Error ? e.message : "send failed",
        })
        .eq("id", row.id);
    }
  }
  return { processed };
}

export async function sendOrQueueEmailSafe(input: SendEmailInput) {
  try {
    return await sendOrQueueEmail(input);
  } catch (e) {
    console.error("[mailer] send failed:", e instanceof Error ? e.message : e);
    return { mode: "failed" as const };
  }
}
