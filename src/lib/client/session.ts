/**
 * Client-side localStorage session helpers.
 * Stores the applicationId so workspace pages can pass it as a fallback
 * to server functions when the HTTP cookie is unavailable (Vercel edge cases).
 */

export const APP_ID_KEY = "wn_appid";

/** Returns the stored applicationId, or undefined if not in browser / not set. */
export function getStoredAppId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return localStorage.getItem(APP_ID_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

/** Persist the applicationId for future page loads. */
export function saveAppId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(APP_ID_KEY, id);
  } catch {
    /* ignore storage errors */
  }
}

/** Remove the stored session (sign-out). */
export function clearAppId(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(APP_ID_KEY);
    // Clear legacy key from earlier implementation
    localStorage.removeItem("wn_workspace_appid");
  } catch {
    /* ignore */
  }
}
