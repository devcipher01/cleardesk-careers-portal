import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { publicBaseUrl } from "@/lib/server/devMode";

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

          // Look up application email + name for Supabase Auth user creation
          const { data: app, error: appErr } = await sb
            .from("applications")
            .select("email, full_name, role_title, status")
            .eq("id", applicationId)
            .single();
          if (appErr || !app) {
            console.error("[auth/verify] app lookup failed:", appErr?.message ?? "not found");
            return new Response(null, { status: 302, headers: { Location: "/signin?error=server" } });
          }

          // Smart redirect: returning users go to dashboard, new users go to onboarding
          const destination = await resolveDestination(sb, applicationId, rawNext);

          // Create/update Supabase Auth user and generate a magic sign-in link
          const callbackUrl = `${publicBaseUrl()}/auth/callback?next=${encodeURIComponent(destination)}`;
          const { data: linkData, error: linkErr } = await sb.auth.admin.generateLink({
            type: "magiclink",
            email: app.email as string,
            options: {
              redirectTo: callbackUrl,
              data: {
                applicationId,
                candidateName: app.full_name,
                roleTitle: app.role_title,
              },
            },
          });

          if (linkErr || !linkData) {
            console.error("[auth/verify] generateLink failed:", linkErr?.message);
            return new Response(null, { status: 302, headers: { Location: "/signin?error=server" } });
          }

          // Mark token used only after magic link generation succeeds —
          // conditional update so concurrent replays lose the race
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
            // Concurrent request already used this token
            return new Response(null, { status: 302, headers: { Location: "/signin?error=expired" } });
          }

          // Update user_metadata for existing users (generateLink's data option only applies to new users)
          await sb.auth.admin
            .updateUserById(linkData.user.id, {
              user_metadata: {
                applicationId,
                candidateName: app.full_name as string,
                roleTitle: app.role_title as string,
              },
            })
            .catch((e: unknown) =>
              console.warn("[auth/verify] metadata update:", e instanceof Error ? e.message : e)
            );

          // Redirect through Supabase magic link → /auth/callback → destination
          return new Response(null, {
            status: 302,
            headers: { Location: linkData.properties.action_link },
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

    if (status === "active" || onboarding?.completed_at) return "/workspace";
    if (status === "onboarding" || status === "assessment_complete") return "/onboarding/workspace-setup";

    if (hintNext && hintNext.startsWith("/") && !hintNext.startsWith("//")) return hintNext;
  } catch {
    // DB lookup failed — fall through to safe defaults
  }

  return "/workspace";
}
