import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/client/supabase";

// Client-side signout page: clears the Supabase session then redirects to /.
// Also used as the redirect target from the legacy /api/auth/signout endpoint.
export const Route = createFileRoute("/signout")({
  head: () => ({
    meta: [
      { title: "Signing out — Worknesta" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SignoutPage,
});

function SignoutPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.signOut().finally(() => {
      void navigate({ to: "/" });
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f1419]">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  );
}
