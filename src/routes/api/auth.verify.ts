import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { buildSessionCookie } from "@/lib/server/session";

export const Route = createFileRoute("/api/auth/verify")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("t") ?? "";
        const raw = url.searchParams.get("next") ?? "/workspace";
        // Prevent open redirect
        const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/workspace";

        if (token.length < 10) {
          return new Response(null, { status: 302, headers: { Location: "/signin?error=invalid" } });
        }

        const sb = getSupabaseAdmin();
        const { data: tok, error } = await sb
          .from("application_tokens")
          .select("id, application_id, expires_at, used_at")
          .eq("token", token)
          .in("type", ["onboarding"])
          .maybeSingle();

        if (error || !tok) {
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
        const { data: updated } = await sb
          .from("application_tokens")
          .update({ used_at: new Date().toISOString() })
          .eq("id", tok.id as string)
          .is("used_at", null)
          .select("id");
        if (!updated || updated.length === 0) {
          // Another request already consumed this token
          return new Response(null, { status: 302, headers: { Location: "/signin?error=expired" } });
        }

        const cookie = buildSessionCookie(applicationId);
        return new Response(null, {
          status: 302,
          headers: { Location: next, "Set-Cookie": cookie },
        });
      },
    },
  },
});
