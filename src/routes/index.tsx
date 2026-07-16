import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { getWorkspaceBySession } from "@/lib/server/actions";
import { getSessionData } from "@/lib/client/supabase";
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  Wallet,
  GraduationCap,
  Globe2,
  Star,
  CheckCircle2,
} from "lucide-react";
import { Section, SectionHeader } from "@/components/site/Section";
import { JOBS } from "@/lib/jobs";
import contractorMaria from "@/assets/contractor-maria.jpg";
import contractorDavid from "@/assets/contractor-david.jpg";
import contractorAna from "@/assets/contractor-ana.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Worknesta — Freelance Transcription Projects" },
      {
        name: "description",
        content:
          "Work from anywhere. Worknesta connects independent contractors with transcription projects from enterprise clients. Apply today.",
      },
      { property: "og:title", content: "Worknesta — Freelance Transcription Projects" },
      {
        property: "og:description",
        content:
          "Build a freelance transcription career. 800+ contractors across North America and Western Europe earn weekly on Worknesta.",
      },
    ],
  }),
  component: HomePage,
});

const benefits = [
  { icon: Clock, color: "bg-lavender", title: "Flexible schedule", body: "Take on projects full-time, part-time, or at your own pace — you choose." },
  { icon: Wallet, color: "bg-mint", title: "Earnings paid weekly", body: "Reliable Friday payouts via Wise, Payoneer, or bank transfer." },
  { icon: GraduationCap, color: "bg-butter", title: "No experience needed", body: "Most entry-level projects only require attention to detail and clear English." },
  { icon: Globe2, color: "bg-rose", title: "Focused contractor network", body: "Join contractors across the US, Canada, UK, and Western Europe." },
];

const testimonials = [
  { name: "Maria S.", country: "United States", role: "Transcription Specialist", image: contractorMaria,
    quote: "Worknesta gave me the chance to work from home with real projects and steady weekly earnings. The onboarding modules were clear and the support is genuine." },
  { name: "David O.", country: "United Kingdom", role: "Transcription Specialist", image: contractorDavid,
    quote: "I applied without any prior remote experience. Within a week I had completed the workspace setup and was working on real client transcription projects." },
  { name: "Ana P.", country: "Canada", role: "Transcription Contractor", image: contractorAna,
    quote: "The flexibility is unmatched. I complete my modules when I choose and receive my earnings every Friday — no surprises, no fees." },
];

const journeySteps = [
  { n: "01", title: "Submit Application", body: "Complete the short application form with your details and work setup.", color: "bg-lime" },
  { n: "02", title: "Skills Profile Review", body: "Answer role-fit questions; successful submissions receive a follow-up email within a few days.", color: "bg-peach" },
  { n: "03", title: "Conditional Selection", body: "Top profiles are invited to continue based on review scores and project demand.", color: "bg-lavender" },
  { n: "04", title: "Workspace Setup", body: "Sign your contractor agreement, configure your workspace, and await platform activation.", color: "bg-mint" },
];

function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    void (async () => {
      const { appId, accessToken } = await getSessionData();
      if (!appId) return;
      try {
        const s = await getWorkspaceBySession({ data: { clientAppId: appId, accessToken } });
        if (s.authenticated) {
          void navigate({ to: s.contractSubmitted ? "/workspace" : "/onboarding/workspace-setup" });
        }
      } catch { /* no auto-redirect on error */ }
    })();
  }, [navigate]);

  return (
    <>
      {/* HERO */}
      <section className="container-page pt-6 md:pt-10">
        <div className="relative overflow-hidden rounded-3xl bg-card p-8 shadow-sm md:p-14">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-lime/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-peach/40 blur-3xl" />

          <div className="relative max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-cream px-3 py-1 text-xs font-medium text-ink/70">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                Now accepting contractors · NA & Western Europe
              </span>
              <h1 className="mt-6 text-balance text-5xl font-medium leading-[1.02] text-ink md:text-7xl">
                Work from anywhere.
                <br />
                <span className="font-serif italic text-ink/85">Build a freelance</span>
                <br />
                transcription career.
              </h1>
              <p className="mt-6 max-w-xl text-base text-ink/65 md:text-lg">
                We connect detail-oriented independent contractors with transcription projects
                from enterprise clients across North America and Western Europe.
              </p>
              <p className="mt-3 max-w-xl text-sm text-ink/55 md:text-base">
                Worknesta is a freelance platform — contractors earn weekly by completing
                transcription projects and modules at their own pace.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/careers"
                  className="inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-medium text-lime-foreground shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  View open projects <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-card px-6 py-3 text-sm font-medium text-ink hover:bg-ink/5"
                >
                  How it works
                </Link>
              </div>
              <p className="mt-5 font-script text-lg text-ink/55">
                ✦ no fees, ever — applying is always free
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS — friendly pill row */}
      <section className="container-page mt-10">
        <div className="grid gap-3 rounded-3xl bg-ink p-6 text-ink-foreground md:grid-cols-4 md:p-8">
          {[
            ["800+", "Active Contractors", "bg-lime"],
            ["15+", "Countries", "bg-peach"],
            ["98%", "Client satisfaction", "bg-lavender"],
            ["100%", "Remote, always", "bg-mint"],
          ].map(([n, l, c]) => (
            <div key={l} className="flex items-center gap-4">
              <span className={`flex h-12 w-12 items-center justify-center rounded-full ${c} text-ink`}>
                <Star className="h-5 w-5" />
              </span>
              <div>
                <div className="text-2xl font-medium md:text-3xl">{n}</div>
                <div className="text-xs text-ink-foreground/60">{l}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY */}
      <Section>
        <div className="container-page">
          <SectionHeader
            eyebrow="Why Worknesta"
            title="Real projects,"
            italicWord="real respect."
            description="No gatekeepers, no fees, no fluff. A modern freelance platform built for independent contractors across North America and Western Europe."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="rounded-3xl border border-ink/10 bg-card p-6 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-full ${b.color} text-ink`}>
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-medium text-ink">{b.title}</h3>
                <p className="mt-2 text-sm text-ink/60">{b.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* OPEN PROJECTS PEEK */}
      <Section className="!py-12">
        <div className="container-page">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <SectionHeader
              eyebrow="Open projects"
              title="Find your"
              italicWord="next project."
              description="Open transcription projects — fully remote. Apply in under five minutes."
            />
            <Link
              to="/careers"
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-card px-5 py-2 text-sm font-medium text-ink hover:bg-ink/5"
            >
              See all projects <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 overflow-hidden rounded-3xl border border-ink/10 bg-card">
            {JOBS.slice(0, 6).map((j, i) => {
              const isFilled = j.status === "filled";
              const Row = (
                <>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {isFilled ? (
                        <span className="rounded-full bg-ink/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink/55">
                          Filled
                        </span>
                      ) : (
                        <span className="rounded-full bg-lime px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-lime-foreground">
                          Open
                        </span>
                      )}
                      <span className="truncate text-base font-medium text-ink md:text-lg">{j.title}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-ink/55">{j.types.join(" · ")} · {j.pay}</p>
                  </div>
                  <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isFilled ? "bg-ink/15 text-ink/40" : "bg-ink text-ink-foreground transition group-hover:bg-lime group-hover:text-lime-foreground"}`}>
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </>
              );
              const baseCls = `group flex items-center justify-between gap-4 px-5 py-5 md:px-7 ${i !== 0 ? "border-t border-ink/10" : ""}`;
              return isFilled ? (
                <div key={j.slug} className={`${baseCls} opacity-60`}>{Row}</div>
              ) : (
                <Link
                  key={j.slug}
                  to="/careers/$slug"
                  params={{ slug: j.slug }}
                  className={`${baseCls} transition hover:bg-cream`}
                >
                  {Row}
                </Link>
              );
            })}
          </div>
        </div>
      </Section>

      {/* LIFE AT WORKNESTA */}
      <Section>
        <div className="container-page">
          <SectionHeader
            eyebrow="The honest pitch"
            title="Life as a"
            italicWord="Worknesta contractor."
            description="What working on our platform actually looks like — no embellishment."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {[
              {
                title: "Real client projects, real deadlines",
                body: "You'll transcribe actual content for enterprise clients. The work matters and accuracy is non-negotiable.",
                color: "bg-lime",
              },
              {
                title: "Quiet, focused modules",
                body: "This isn't a chatty startup. Most sessions are heads-down transcription work with async feedback from your project lead.",
                color: "bg-peach",
              },
              {
                title: "Steady, predictable earnings",
                body: "Weekly payouts every Friday via Wise, Payoneer, or bank transfer. No surprise fees, no missed cycles.",
                color: "bg-lavender",
              },
              {
                title: "Room to take on higher-tier projects",
                body: "Top contractors move into specialist and quality-lead modules with higher earnings within 6–12 months.",
                color: "bg-mint",
              },
            ].map((p) => (
              <div key={p.title} className="rounded-3xl border border-ink/10 bg-card p-6">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${p.color}`}>
                  <CheckCircle2 className="h-5 w-5 text-ink" />
                </span>
                <h3 className="mt-5 text-lg font-medium text-ink">{p.title}</h3>
                <p className="mt-2 text-sm text-ink/60">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section>
        <div className="container-page">
          <SectionHeader
            eyebrow="From our contractors"
            title="Stories from"
            italicWord="our contractors."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.figure
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-3xl border border-ink/10 bg-card p-6"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={t.image}
                    alt={`Portrait of ${t.name}`}
                    loading="lazy"
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-cream"
                  />
                  <div className="text-sm">
                    <div className="font-medium text-ink">{t.name}</div>
                    <div className="text-ink/55">{t.role} · {t.country}</div>
                  </div>
                </div>
                <blockquote className="mt-5 text-[15px] leading-relaxed text-ink/80">
                  "{t.quote}"
                </blockquote>
              </motion.figure>
            ))}
          </div>
        </div>
      </Section>

      {/* START YOUR JOURNEY */}
      <Section>
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-card p-8 shadow-sm md:p-14">
            <div className="absolute -top-16 -left-10 h-56 w-56 rounded-full bg-lime/25 blur-3xl" />
            <div className="absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-lavender/40 blur-3xl" />
            <div className="relative">
              <SectionHeader
                eyebrow="The path ahead"
                title="Start your"
                italicWord="journey."
                description="Four simple steps from clicking apply to your first weekly earnings."
              />
              <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {journeySteps.map((s, i) => (
                  <motion.div
                    key={s.n}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="relative rounded-3xl border border-ink/10 bg-cream p-6"
                  >
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${s.color} font-serif text-xl italic text-ink`}>
                      {s.n}
                    </span>
                    <h3 className="mt-5 text-lg font-medium text-ink">{s.title}</h3>
                    <p className="mt-2 text-sm text-ink/60">{s.body}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  to="/careers/apply"
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-ink-foreground transition hover:bg-lime hover:text-lime-foreground"
                >
                  Start your application <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-card px-6 py-3 text-sm font-medium text-ink hover:bg-ink/5"
                >
                  See full process
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <section className="container-page pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-ink p-10 text-center text-ink-foreground md:p-16">
          <div className="absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-lime/20 blur-3xl" />
          <p className="font-script text-2xl text-lime">ready when you are</p>
          <h2 className="mt-2 text-balance text-3xl font-medium md:text-5xl">
            Start your <span className="font-serif italic">freelance transcription</span> career today.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-foreground/60">
            Browse our open transcription projects and apply in under 5 minutes — no fees, no commute.
          </p>
          <Link
            to="/careers"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-medium text-lime-foreground transition hover:opacity-90"
          >
            View open projects <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
