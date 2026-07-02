import crypto from "node:crypto";

export function generateToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function expiresInHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

