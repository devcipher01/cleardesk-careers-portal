import crypto from "node:crypto";

const COOKIE_NAME = "wn_session";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * Use SUPABASE_SERVICE_ROLE_KEY as the HMAC signing key — it is already
 * required for all DB queries, so no extra secret variable is needed.
 * Falls back to a dev-only stub when running locally without Supabase.
 */
function getSecret(): Buffer {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s || s.length < 16) {
    // Dev-only fallback — Supabase isn't required for local testing
    return Buffer.from("dev-secret-local-only-not-used-in-prod", "utf8");
  }
  return Buffer.from(s, "utf8");
}

const SECURE_FLAG = IS_DEV ? "" : "; Secure";

/** Build a Set-Cookie header value for a workspace session. */
export function buildSessionCookie(applicationId: string): string {
  const payload = Buffer.from(applicationId, "utf8").toString("base64url");
  const mac = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${COOKIE_NAME}=${payload}.${mac}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}${SECURE_FLAG}`;
}

/** Build a Set-Cookie header value that immediately expires the session. */
export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${SECURE_FLAG}`;
}

/** Parse and verify the session cookie from a raw Cookie header string. Returns applicationId or null. */
export function getApplicationIdFromCookies(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() !== COOKIE_NAME) continue;
    const val = part.slice(eq + 1).trim();
    const dotIdx = val.lastIndexOf(".");
    if (dotIdx < 0) return null;
    const payload = val.slice(0, dotIdx);
    const mac = val.slice(dotIdx + 1);
    try {
      const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
      const eBuf = Buffer.from(expected);
      const gBuf = Buffer.from(mac);
      if (eBuf.length !== gBuf.length) return null;
      if (!crypto.timingSafeEqual(eBuf, gBuf)) return null;
      return Buffer.from(payload, "base64url").toString("utf8");
    } catch {
      return null;
    }
  }
  return null;
}
