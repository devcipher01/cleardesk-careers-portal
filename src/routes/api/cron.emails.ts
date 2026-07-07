import { createFileRoute } from "@tanstack/react-router";
import { cronProcessEmails } from "@/lib/server/actions";

export const Route = createFileRoute("/api/cron/emails")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env.CRON_SECRET;
        if (!secret) return new Response("CRON_SECRET not configured", { status: 500 });
        const auth = request.headers.get("authorization");
        if (auth !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
        try {
          const result = await cronProcessEmails({ data: { secret } });
          return Response.json(result);
        } catch {
          return new Response("Error", { status: 500 });
        }
      },
    },
  },
});
