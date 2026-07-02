import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Lock, MapPin } from "lucide-react";
import { Section } from "@/components/site/Section";
import { getJobBySlug } from "@/lib/jobs";

const RESERVED_SLUGS = new Set(["apply", "assessment"]);

export const Route = createFileRoute("/careers/$slug")({
  loader: ({ params }) => {
    if (RESERVED_SLUGS.has(params.slug)) throw notFound();
    const job = getJobBySlug(params.slug);
    if (!job) throw notFound();
    return { job };
  },
  head: ({ loaderData }) => {
    const job = loaderData?.job;
    if (!job) return { meta: [{ title: "Role not found — Worknesta" }] };
    return {
      meta: [
        { title: `${job.title} — Worknesta Careers` },
        {
          name: "description",
          content: job.pitch ?? job.description,
        },
        { property: "og:title", content: `${job.title} at Worknesta` },
        {
          property: "og:description",
          content: job.pitch ?? job.description,
        },
      ],
    };
  },
  component: JobDetailPage,
});

function JobDetailPage() {
  const { job } = Route.useLoaderData();
  const isFilled = job.status === "filled";
  const details = job.details;

  return (
    <>
      <section className="container-page pt-6 md:pt-10">
        <Link
          to="/careers"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink/60 transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          All open roles
        </Link>

        <div className="relative mt-6 overflow-hidden rounded-3xl border border-ink/10 bg-card p-8 shadow-sm md:p-12">
          <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-lavender/40 blur-3xl" />
          <div className="absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-lime/30 blur-3xl" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              {isFilled ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink/60">
                  <Lock className="h-3 w-3" />
                  Position filled
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                  Now hiring
                </span>
              )}
              {job.types.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-ink/10 bg-cream px-2.5 py-0.5 text-xs font-medium text-ink/70"
                >
                  {t}
                </span>
              ))}
            </div>

            <h1 className="mt-6 text-balance text-3xl font-medium leading-[1.08] text-ink md:text-5xl">
              {job.title}
            </h1>

            <p className="mt-4 font-serif text-xl italic text-ink/80 md:text-2xl">{job.pay}</p>

            <p className="mt-3 inline-flex items-center gap-1 text-sm text-ink/55">
              <MapPin className="h-3.5 w-3.5" />
              Remote · North America & Western Europe
            </p>

            {job.pitch && (
              <p className="mt-8 max-w-3xl text-base leading-relaxed text-ink/75 md:text-lg">
                {job.pitch}
              </p>
            )}

            <div className="mt-10 flex flex-wrap gap-3">
              {isFilled ? (
                <>
                  <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-ink/15 px-5 py-3 text-sm font-medium text-ink/50">
                    Position filled
                    <Lock className="h-4 w-4" />
                  </span>
                  <Link
                    to="/careers/apply"
                    className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-cream px-5 py-3 text-sm font-medium text-ink transition hover:bg-ink/5"
                  >
                    Join talent pool
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </>
              ) : (
                <Link
                  to="/careers/apply"
                  search={{ role: job.slug }}
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-ink-foreground transition hover:bg-lime hover:text-lime-foreground"
                >
                  Apply for this role
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <Section className="!pt-0">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div className="rounded-3xl border border-ink/10 bg-card p-6 md:p-8">
            <h2 className="text-xl font-medium text-ink">What you&apos;ll need</h2>
            <ul className="mt-5 space-y-3">
              {job.requirements.map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm text-ink/75">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-ink/10 bg-card p-6 md:p-8">
            <h2 className="text-xl font-medium text-ink">Role overview</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink/70">{job.description}</p>
            {!details && (
              <p className="mt-4 text-sm text-ink/55">
                Questions about this role?{" "}
                <Link to="/contact" className="font-medium text-ink underline-offset-4 hover:underline">
                  Contact our talent team
                </Link>
                .
              </p>
            )}
          </div>
        </div>

        {details && (
          <div className="container-page mt-10 space-y-8">
            <DetailBlock title="Key responsibilities" items={details.responsibilities} />
            <DetailBlock title="A typical day" items={details.dayToDay} />
            <div className="rounded-3xl border border-ink/10 bg-butter/25 p-6 md:p-8">
              <h2 className="text-xl font-medium text-ink">Onboarding & training</h2>
              <p className="mt-4 text-sm leading-relaxed text-ink/75">{details.onboarding}</p>
            </div>
            <DetailBlock title="You might be a great fit if…" items={details.goodFit} />
          </div>
        )}
      </Section>
    </>
  );
}

function DetailBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-ink/10 bg-card p-6 md:p-8">
      <h2 className="text-xl font-medium text-ink">{title}</h2>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-ink/75">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
