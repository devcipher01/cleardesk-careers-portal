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
import { VideoEmbed } from "@/components/site/VideoEmbed";
import { Section, SectionHeader } from "@/components/site/Section";
import { JOBS } from "@/lib/jobs";
import contractorMaria from "@/assets/contractor-maria.jpg";
import contractorDavid from "@/assets/contractor-david.jpg";
import contractorAna from "@/assets/contractor-ana.jpg";
import teamElena from "@/assets/team-elena.jpg";
import teamMarcus from "@/assets/team-marcus.jpg";
import teamPriya from "@/assets/team-priya.jpg";
import teamJames from "@/assets/team-james.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Worknesta — Remote Data Entry & Transcription Jobs" },
      {
        name: "description",
        content:
          "Work from anywhere. Worknesta hires remote professionals globally for data entry, transcription, and document processing. Apply today.",
      },
      { property: "og:title", content: "Worknesta — Work From Anywhere" },
      {
        property: "og:description",
        content:
          "Build a remote career in data entry, transcription, and document processing. 800+ team members across North America and Western Europe.",
      },
    ],
  }),
  component: HomePage,
});

const benefits = [
  { icon: Clock, color: "bg-lavender", title: "Flexible hours", body: "Full-time, part-time, or flexible — you set the pace." },
  { icon: Wallet, color: "bg-mint", title: "Paid weekly", body: "Reliable Friday payouts via Wise, Payoneer, or bank transfer." },
  { icon: GraduationCap, color: "bg-butter", title: "No experience needed", body: "Most entry roles only require attention to detail." },
  { icon: Globe2, color: "bg-rose", title: "Focused regional team", body: "Join teammates across the US, Canada, UK, and Western Europe." },
];

const testimonials = [
  { name: "Maria S.", country: "United States", role: "AI Content & Transcription Validator", image: contractorMaria,
    quote: "Worknesta gave me the chance to work from home with a real team and steady weekly pay. The onboarding was clear and the support is genuine." },
  { name: "David O.", country: "United Kingdom", role: "Data Entry Specialist", image: contractorDavid,
    quote: "I applied without any prior remote experience. Within a week I had finished training and was working on real client accounts." },
  { name: "Ana P.", country: "Canada", role: "Quality Assurance Reviewer", image: contractorAna,
    quote: "The flexibility is unmatched. I work the hours I choose and get paid every Friday — no surprises, no fees." },
];

const team = [
  { name: "Elena Vasquez", role: "Founder & CEO", image: teamElena, accent: "bg-peach" },
  { name: "Marcus Chen", role: "Head of Talent", image: teamMarcus, accent: "bg-lime" },
  { name: "Priya Anand", role: "Head of Operations", image: teamPriya, accent: "bg-lavender" },
  { name: "James Okafor", role: "Head of Engineering", image: teamJames, accent: "bg-mint" },
];

const journeySteps = [
  { n: "01", title: "Submit Application", body: "Complete the short application form with your details and work setup.", color: "bg-lime" },
  { n: "02", title: "Skills Profile Review", body: "Answer role-fit questions; successful submissions receive a follow-up email.", color: "bg-peach" },
  { n: "03", title: "Conditional Selection", body: "Top profiles are invited to continue based on review scores and role demand.", color: "bg-lavender" },
  { n: "04", title: "Technical Workspace Configuration", body: "Sign agreements, verify network credentials, and await platform activation.", color: "bg-mint" },
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

          <div className="relative grid items-center gap-10 md:grid-cols-12">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="md:col-span-7"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-cream px-3 py-1 text-xs font-medium text-ink/70">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                Now hiring · NA & Western Europe
              </span>
              <h1 className="mt-6 text-balance text-5xl font-medium leading-[1.02] text-ink md:text-7xl">
                Work from anywhere.
                <br />
                <span className="font-serif italic text-ink/85">Build a career,</span>
                <br />
                remotely.
              </h1>
              <p className="mt-6 max-w-xl text-base text-ink/65 md:text-lg">
                We hire detail-oriented remote professionals across North America and Western
                Europe for data entry, transcription, and document processing roles.
              </p>
              <p className="mt-3 max-w-xl text-sm text-ink/55 md:text-base">
                Worknesta is a data services company — we work directly with enterprise clients
                and need reliable people on our team.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/careers"
                  className="inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-medium text-lime-foreground shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  View open roles <ArrowUpRight className="h-4 w-4" />
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

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="md:col-span-5"
            >
              <VideoEmbed label="HOME — HR Welcome" caption="A note from our talent team" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS — friendly pill row */}
      <section className="container-page mt-10">
        <div className="grid gap-3 rounded-3xl bg-ink p-6 text-ink-foreground md:grid-cols-4 md:p-8">
          {[
            ["800+", "Team Members", "bg-lime"],
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
            title="Real opportunities,"
            italicWord="real respect."
            description="No gatekeepers, no fees, no fluff. A modern remote hiring experience built for talent across North America and Western Europe."
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

      {/* OPEN ROLES PEEK */}
      <Section className="!py-12">
        <div className="container-page">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <SectionHeader
              eyebrow="Open positions"
              title="Find your"
              italicWord="next role."
              description="Open positions across our team — fully remote. Apply in under five minutes."
            />
            <Link
              to="/careers"
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-card px-5 py-2 text-sm font-medium text-ink hover:bg-ink/5"
            >
              See all roles <ArrowRight className="h-4 w-4" />
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
            title="Life at"
            italicWord="Worknesta."
            description="What working here actually looks like — no embellishment."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {[
              {
                title: "Real client work, real deadlines",
                body: "You'll process actual documents for enterprise clients. The work matters and accuracy is non-negotiable.",
                color: "bg-lime",
              },
              {
                title: "Quiet, focused days",
                body: "This isn't a chatty startup. Most days are heads-down work with async check-ins from your team lead.",
                color: "bg-peach",
              },
              {
                title: "Steady, predictable pay",
                body: "Weekly payouts every Friday via Wise, Payoneer, or bank transfer. No surprise fees, no missed cycles.",
                color: "bg-lavender",
              },
              {
                title: "Room to grow into senior roles",
                body: "Top performers move into QA, team lead, and account specialist positions within 6–12 months.",
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
            eyebrow="From our team"
            title="Stories from"
            italicWord="our team."
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
                  “{t.quote}”
                </blockquote>
              </motion.figure>
            ))}
          </div>
        </div>
      </Section>

      {/* MEET THE MINDS */}
      <Section>
        <div className="container-page">
          <SectionHeader
            eyebrow="Meet the minds"
            title="The team behind"
            italicWord="Worknesta."
            description="A small, distributed crew delivering precision data entry and transcription services for clients across industries."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="group overflow-hidden rounded-3xl border border-ink/10 bg-card transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className={`relative aspect-[4/5] overflow-hidden ${m.accent}`}>
                  <img
                    src={m.image}
                    alt={`Portrait of ${m.name}, ${m.role}`}
                    loading="lazy"
                    width={512}
                    height={640}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-medium text-ink">{m.name}</h3>
                  <p className="mt-1 font-serif text-sm italic text-ink/60">{m.role}</p>
                </div>
              </motion.div>
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
                description="Four simple steps from clicking apply to your first weekly paycheck."
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
            Start your <span className="font-serif italic">remote career</span> today.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-foreground/60">
            Browse our open positions and apply in under 5 minutes — no fees, no commute.
          </p>
          <Link
            to="/careers"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-medium text-lime-foreground transition hover:opacity-90"
          >
            View open roles <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
