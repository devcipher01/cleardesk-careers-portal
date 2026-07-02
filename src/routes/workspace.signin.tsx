import { createFileRoute } from "@tanstack/react-router";
import { SignInPage } from "@/components/auth/SignInPage";

export const Route = createFileRoute("/workspace/signin")({
  head: () => ({
    meta: [
      { title: "Workspace Sign In — Worknesta" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SignInPage,
});
