import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { buildSessionCookie } from "@/lib/server/session";

export const Route = createFileRoute("/api/auth/verify")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("t") ?? "";
        const rawNext = url.searchParams.get("next") ?? "";

        if (token.length < 10) {
          return new Response(null, { status: 302, headers: { Location: "/signin?error=invalid" } });
        }

        try {
          const sb = getSupabaseAdmin();
          const { data: tok, error } = await sb
            .from("application_tokens")
            .select("id, application_id, expires_at, used_at")
            .eq("token", token)
            .in("type", ["onboarding"])
            .maybeSingle();

          if (error || !tok) {
            console.error("[auth/verify] token lookup failed:", error?.message ?? "not found");
            return new Response(null, { status: 302, headers: { Location: "/signin?error=invalid" } });
          }
          if (tok.used_at) {
            return new Response(null, { status: 302, headers: { Location: "/signin?error=expired" } });
          }
          if (new Date(tok.expires_at as string).getTime() <= Date.now()) {
            return new Response(null, { status: 302, headers: { Location: "/signin?error=expired" } });
          }

          const applicationId = tok.application_id as string;

          // Mark token used — conditional update so concurrent replays lose the race
          const { data: updated, error: updateError } = await sb
            .from("application_tokens")
            .update({ used_at: new Date().toISOString() })
            .eq("id", tok.id as string)
            .is("used_at", null)
            .select("id");
          if (updateError) {
            console.error("[auth/verify] token mark-used failed:", updateError.message);
            return new Response(null, { status: 302, headers: { Location: "/signin?error=expired" } });
          }
          if (!updated || updated.length === 0) {
            return new Response(null, { status: 302, headers: { Location: "/signin?error=expired" } });
          }

          // Smart redirect: returning users who finished onboarding go straight to dashboard;
          // new users who haven't completed onboarding go to the setup flow.
          const destination = await resolveDestination(sb, applicationId, rawNext);

          const cookie = buildSessionCookie(applicationId);
          return new Response(null, {
            status: 302,
            headers: { Location: destination, "Set-Cookie": cookie },
          });
        } catch (err: unknown) {
          console.error("[auth/verify] unhandled error:", err instanceof Error ? err.message : String(err));
          return new Response(null, { status: 302, headers: { Location: "/signin?error=server" } });
        }
      },
    },
  },
});

async function resolveDestination(
  sb: ReturnType<typeof import("@/lib/server/supabaseAdmin").getSupabaseAdmin>,
  applicationId: string,
  hintNext: string,
): Promise<string> {
  try {
    const [{ data: app }, { data: onboarding }] = await Promise.all([
      sb.from("applications").select("status").eq("id", applicationId).single(),
      sb.from("onboarding").select("completed_at").eq("application_id", applicationId).maybeSingle(),
    ]);

    const status = (app?.status as string) ?? "";

    // Already fully onboarded — go straight to the workspace dashboard
    if (status === "active" || onboarding?.completed_at) {
      return "/workspace";
    }

    // In the middle of onboarding or just selected — go to onboarding setup
    if (status === "onboarding" || status === "assessment_complete") {
      return "/onboarding/workspace-setup";
    }

    // Fall back to the hint from the email link, then a safe default
    if (hintNext && hintNext.startsWith("/") && !hintNext.startsWith("//")) {
      return hintNext;
    }
  } catch {
    // If the DB lookup fails, fall through to safe defaults below
  }

  return "/workspace";
}
