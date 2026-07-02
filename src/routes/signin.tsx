import { createFileRoute } from "@tanstack/react-router";
import { SignInPage } from "@/components/auth/SignInPage";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign in — Worknesta" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SignInPage,
});
