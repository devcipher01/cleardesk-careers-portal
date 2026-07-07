import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/client/supabase";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Signing in — Worknesta" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const next = searchParams.get("next") || "/workspace";
    const code = searchParams.get("code");

    let done = false;

    // 5 second timeout — if Supabase hasn't fired auth state by then, the link is bad
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        setError("Sign-in link expired or already used. Request a new one.");
      }
    }, 5000);

    // Listen for Supabase auth state changes (handles both implicit and PKCE flows)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (done) return;
      if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        done = true;
        clearTimeout(timer);
        void navigate({ to: next });
      }
    });

    // For PKCE code flow: explicitly exchange the code
    if (code) {
      supabase.auth.exchangeCodeForSession(code).catch(() => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          setError("Sign-in link expired or already used.");
        }
      });
    }

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1419] px-4">
        <div className="max-w-sm text-center">
          <p className="text-sm text-rose-400">{error}</p>
          <a
            href="/workspace/signin"
            className="mt-4 inline-block rounded-lg bg-lime px-4 py-2 text-sm font-medium text-ink hover:opacity-90"
          >
            Request a new sign-in link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1419]">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
        <p className="mt-4 text-sm text-slate-400">Signing you in…</p>
      </div>
    </div>
  );
}
