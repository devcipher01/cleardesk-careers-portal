import { createFileRoute, Link } from "@tanstack/react-router";
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

  const inviteOnly = true;

  if (inviteOnly) {
    return (
      <section className="container-page py-12 md:py-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-ink/10 bg-card p-8 text-center shadow-sm md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">Application status</p>
          <h1 className="mt-4 text-3xl font-medium text-ink md:text-5xl">
            Applications are <span className="font-serif italic">by invitation only.</span>
          </h1>
          <p className="mt-4 text-base text-ink/65 md:text-lg">
            We are not accepting new applications at the moment. Please check back later or keep an eye on open project updates.
          </p>
          <Link
            to="/careers"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-ink-foreground transition hover:bg-lime hover:text-lime-foreground"
          >
            Back to open projects
          </Link>
        </div>
      </section>
    );
  }

  return <ApplyFormPage role={role} />;
}
