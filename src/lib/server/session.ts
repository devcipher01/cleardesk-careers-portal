import crypto from "node:crypto";

const COOKIE_NAME = "wn_session";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
const IS_DEV = process.env.NODE_ENV !== "production";

function getSecret(): Buffer {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    if (!IS_DEV) {
      throw new Error("SESSION_SECRET env var is missing or too short. Set at least 32 random characters.");
    }
    // Dev-only fallback — only ever reached in local development
    return Buffer.from("dev-secret-not-configured-change-me", "utf8");
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
