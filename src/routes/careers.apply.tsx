import { createFileRoute } from "@tanstack/react-router";
import { ApplyFormPage } from "@/components/careers/ApplyFormPage";

interface Search {
  role?: string;
}

export const Route = createFileRoute("/careers/apply")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    role: typeof search.role === "string" ? search.role : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Apply Now — Worknesta" },
      {
        name: "description",
        content: "Apply to a remote role at Worknesta in 5 minutes. Continue to Skills Profile Review after submission.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CareersApplyPage,
});

function CareersApplyPage() {
  const { role } = Route.useSearch();
  return <ApplyFormPage role={role} />;
}
