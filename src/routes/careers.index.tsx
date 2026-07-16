import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, MapPin, CheckCircle2, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Section } from "@/components/site/Section";
import { JOBS } from "@/lib/jobs";

export const Route = createFileRoute("/careers/")({
  head: () => ({
    meta: [
      { title: "Open Transcription Projects — Worknesta" },
      {
        name: "description",
        content:
          "Browse open transcription projects for independent contractors across North America and Western Europe. Weekly earnings, fully remote.",
      },
      { property: "og:title", content: "Open Transcription Projects at Worknesta" },
      {
        property: "og:description",
        content:
          "Transcription projects for independent contractors. Fully remote across the US, Canada, UK, and Western Europe. Weekly earnings.",
      },
    ],
  }),
  component: CareersIndexPage,
});

const swatches = ["bg-lime", "bg-peach", "bg-lavender", "bg-mint", "bg-butter", "bg-rose"];

function CareersIndexPage() {
  const openCount = JOBS.filter((j) => j.status === "open").length;

  return (
    <>
      <section className="container-page pt-6 md:pt-10">
        <div className="relative overflow-hidden rounded-3xl bg-card p-8 shadow-sm md:p-14">
          <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-peach/40 blur-3xl" />
          <div className="absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-lime/30 blur-3xl" />

          <div className="relative mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-cream px-3 py-1 text-xs font-medium text-ink/70">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" />
              {openCount} open {openCount === 1 ? "project" : "projects"} · North America & Europe
            </span>
            <h1 className="mt-6 text-balance text-4xl font-medium leading-[1.05] text-ink md:text-6xl">
              Open transcription{" "}
              <span className="font-serif italic">projects.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-ink/65 md:text-lg">
              Projects are open to independent contractors in North America and Western Europe. Worknesta is
              headquartered in Wilmington, Delaware, USA.
            </p>
          </div>

        </div>
      </section>

      <Section>
        <div className="container-page">
          <div className="mx-auto mb-10 max-w-3xl rounded-3xl border border-ink/10 bg-card p-6 text-center md:p-8">
            <p className="text-sm text-ink/70 md:text-base">
              We regularly open new projects. Don't see a project that fits your skills? Submit a
              general application and we'll reach out when a matching project becomes available.
            </p>
            <Link
              to="/careers/apply"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-ink-foreground transition hover:bg-lime hover:text-lime-foreground"
            >
              Submit General Application <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {JOBS.map((job, i) => {
              const isFilled = job.status === "filled";
              return (
                <motion.article
                  key={job.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: (i % 2) * 0.05 }}
                  className={`group flex flex-col rounded-3xl border border-ink/10 bg-card p-6 transition md:p-7 ${
                    isFilled ? "opacity-60" : "hover:-translate-y-1 hover:shadow-xl"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${swatches[i % swatches.length]} font-serif text-xl italic text-ink`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {isFilled ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink/60">
                        <Lock className="h-3 w-3" />
                        Project Filled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink">
                        <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                        Open
                      </span>
                    )}
                  </div>

                  <h3 className="mt-5 text-2xl font-medium text-ink">{job.title}</h3>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    {job.types.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-ink/10 bg-cream px-2.5 py-0.5 font-medium text-ink/70"
                      >
                        {t}
                      </span>
                    ))}
                    <span className="inline-flex items-center gap-1 text-ink/50">
                      <MapPin className="h-3 w-3" /> 🌎 Remote · North America & Europe
                    </span>
                  </div>

                  <p className="mt-4 font-serif text-lg italic text-ink/80">{job.pay}</p>
                  <p className="mt-3 text-sm text-ink/60">{job.description}</p>

                  <ul className="mt-5 space-y-1.5 text-sm">
                    {job.requirements.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-ink/75">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex-1" />
                  <Link
                    to="/careers/$slug"
                    params={{ slug: job.slug }}
                    className="mb-3 inline-flex text-sm font-medium text-ink/70 underline-offset-4 transition hover:text-ink hover:underline"
                  >
                    View project details
                  </Link>
                  {isFilled ? (
                    <>
                      <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        className="inline-flex cursor-not-allowed items-center justify-between gap-2 rounded-full bg-ink/15 px-5 py-3 text-sm font-medium text-ink/50"
                      >
                        Project Filled
                        <Lock className="h-4 w-4" />
                      </button>
                      <Link
                        to="/careers/apply"
                        className="mt-3 text-center text-xs text-ink/55 underline-offset-4 hover:text-ink hover:underline"
                      >
                        Join our contractor pool — we open this project regularly
                      </Link>
                    </>
                  ) : (
                    <Link
                      to="/careers/apply"
                      search={{ role: job.slug }}
                      className="inline-flex items-center justify-between gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-ink-foreground transition hover:bg-lime hover:text-lime-foreground"
                    >
                      Apply now
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  )}
                </motion.article>
              );
            })}
          </div>

          <p className="mt-12 text-center font-script text-xl text-ink/60">
            ✦ no application fees · 100% remote · NA & Europe contractors
          </p>
        </div>
      </Section>
    </>
  );
}
