import { createFileRoute } from "@tanstack/react-router";
import { clearSessionCookie } from "@/lib/server/session";

export const Route = createFileRoute("/api/auth/signout")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/",
            "Set-Cookie": clearSessionCookie(),
          },
        });
      },
    },
  },
});
