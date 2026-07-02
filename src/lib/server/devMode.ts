/** Local pipeline testing without Supabase. */
export function isLocalDevMode(): boolean {
  if (process.env.LOCAL_DEV_MODE === "true") return true;
  if (process.env.LOCAL_DEV_MODE === "false") return false;
  return !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;
}

/** Random delay between min–max hours for candidate-facing emails (production). */
export function pipelineCandidateEmailDelayMs(): number {
  if (isLocalDevMode()) {
    const raw = process.env.LOCAL_PIPELINE_EMAIL_DELAY_MS;
    if (raw === undefined || raw === "") return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }
  const minH = Number(process.env.PIPELINE_EMAIL_DELAY_MIN_HOURS) || 18;
  const maxH = Number(process.env.PIPELINE_EMAIL_DELAY_MAX_HOURS) || 24;
  const lo = Math.min(minH, maxH);
  const hi = Math.max(minH, maxH);
  const hours = lo + Math.random() * (hi - lo);
  return Math.round(hours * 60 * 60 * 1000);
}

/** @deprecated Use pipelineCandidateEmailDelayMs */
export function pipelineAcceptanceEmailDelayMs() {
  return pipelineCandidateEmailDelayMs();
}

export function adminNotifyEmail() {
  return process.env.ADMIN_NOTIFY_EMAIL || "profdanx@gmail.com";
}

export function publicBaseUrl() {
  return process.env.PUBLIC_BASE_URL || "https://worknesta.com";
}

/** Comma-separated list of emails that should receive immediate test emails. */
export function testEmailsList(): string[] {
  const raw = process.env.TEST_EMAILS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.toLowerCase());
}

export function isImmediateTestEmail(email?: string) {
  if (!email) return false;
  const target = email.trim().toLowerCase();
  const list = testEmailsList();
  return list.includes(target);
}
