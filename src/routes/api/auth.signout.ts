import { createFileRoute } from "@tanstack/react-router";

// Sign-out is handled client-side by supabase.auth.signOut() in OrgShell.
// This endpoint redirects stale bookmarks to the /signout client page which
// properly clears the Supabase session before navigating home.
export const Route = createFileRoute("/api/auth/signout")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(null, { status: 302, headers: { Location: "/signout" } });
      },
    },
  },
});
