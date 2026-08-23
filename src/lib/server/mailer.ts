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
  // Scheduled email processing is hard-disabled. This is intentional to stop cron jobs.
  // To re-enable, remove this early return and restore the original processing logic.
  return { processed: 0 };
}

export async function sendOrQueueEmailSafe(input: SendEmailInput) {
  try {
    return await sendOrQueueEmail(input);
  } catch (e) {
    console.error("[mailer] send failed:", e instanceof Error ? e.message : e);
    return { mode: "failed" as const };
  }
}
