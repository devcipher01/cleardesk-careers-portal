import { createClient } from "@supabase/supabase-js";

// During SSR, VITE_ env vars may be undefined; fall back to placeholders so the
// module initialises without throwing. Auth methods are only called client-side
// (inside useEffect / async handlers), so the placeholder client is never used.
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  "https://placeholder.supabase.co";
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Return both the applicationId and the raw Supabase access token for the current session.
 * Pass the accessToken to session-protected server functions so the server can verify the JWT.
 * Supabase persists the session in localStorage automatically — survives tab closes.
 */
export async function getSessionData(): Promise<{ appId: string | undefined; accessToken: string | undefined }> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return {
      appId: session?.user?.user_metadata?.applicationId as string | undefined,
      accessToken: session?.access_token,
    };
  } catch {
    return { appId: undefined, accessToken: undefined };
  }
}

/** Convenience alias for callers that only need the applicationId. */
export async function getSessionAppId(): Promise<string | undefined> {
  return (await getSessionData()).appId;
}
