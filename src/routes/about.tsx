import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Target, Sparkles, TrendingUp } from "lucide-react";
import { Section, SectionHeader } from "@/components/site/Section";
import { MARKET_COPY, marketFromContext } from "@/lib/market";
import { useMarket } from "@/lib/useMarket";

export const Route = createFileRoute("/about")({
  head: ({ match }) => {
    const copy = MARKET_COPY[marketFromContext(match.context)];
    return {
      meta: [
        { title: "About — Worknesta" },
        {
          name: "description",
          content: copy.aboutMeta,
        },
        { property: "og:title", content: "About Worknesta" },
        {
          property: "og:description",
          content: copy.aboutOg,
        },
      ],
    };
  },
  component: AboutPage,
});

const swatches = ["bg-lime/30", "bg-peach/30", "bg-lavender/30", "bg-mint/30", "bg-butter/40", "bg-rose/30"];

function AboutPage() {
  const copy = MARKET_COPY[useMarket()];
  const values = [
    { icon: ShieldCheck, color: "bg-mint", title: "Integrity", body: "Honest hiring, transparent pay, and zero application fees — ever." },
    { icon: Target, color: "bg-peach", title: "Accuracy", body: "Quality is our product. Every keystroke matters." },
    { icon: Sparkles, color: "bg-lavender", title: "Flexibility", body: copy.flexibilityValue },
    { icon: TrendingUp, color: "bg-butter", title: "Growth", body: "Entry roles today, leadership opportunities tomorrow." },
  ];

  return (
    <>
      {/* Hero */}
      <section className="container-page pt-6 md:pt-10">
        <div className="relative overflow-hidden rounded-3xl bg-card p-8 shadow-sm md:p-14">
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-lavender/40 blur-3xl" />
          <div className="absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-mint/40 blur-3xl" />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">About Worknesta</p>
            <h1 className="mt-4 text-balance text-5xl font-medium leading-[1.05] text-ink md:text-7xl">
              Who <span className="font-serif italic">we are.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-ink/65 md:text-lg">
              {copy.aboutHero}
            </p>
          </div>
        </div>
      </section>

      <Section>
        <div className="container-page grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">Our story</p>
            <h2 className="mt-3 text-4xl font-medium text-ink md:text-5xl">
              Precision data services,{" "}
              <span className="font-serif italic">delivered remotely.</span>
            </h2>
            <div className="mt-6 space-y-4 text-ink/70">
              <p>
                Worknesta was founded in 2019 to deliver precision data entry and transcription
                services for clients across industries — without the overhead of a traditional
                office.
              </p>
              <p>
                Today, we partner with clients across legal, healthcare, research, and e-commerce
                industries to deliver accurate, on-time data entry, transcription, and document{" "}
                {copy.aboutTeam}
              </p>
              <p>
                We don't believe in gatekeepers, hidden fees, or rigid schedules. We believe in
                fair pay, weekly payouts, and giving every applicant a real shot.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="container-page">
          <SectionHeader eyebrow="Our values" title="What we" italicWord="stand for." />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-3xl border border-ink/10 bg-card p-6">
                <div className={`flex h-11 w-11 items-center justify-center rounded-full ${v.color} text-ink`}>
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-medium text-ink">{v.title}</h3>
                <p className="mt-2 text-sm text-ink/60">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Where our team works from */}
      <Section>
        <div className="container-page">
          <SectionHeader
            eyebrow="Our reach"
            title="Where our team"
            italicWord="works from."
            description={copy.aboutReach}
          />
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-5">
            {copy.countries.map((c, i) => (
              <div
                key={c.name}
                className={`flex items-center gap-2 rounded-full border border-ink/10 px-4 py-3 text-sm font-medium text-ink ${swatches[i % swatches.length]}`}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span className="truncate">{c.name}</span>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-ink/60">
            {copy.aboutTimezone}
          </p>
        </div>
      </Section>

      <section className="container-page pb-16">
        <p className="mx-auto max-w-2xl text-center text-sm text-ink/55">
          Worknesta is a registered company in Wilmington, Delaware, USA. Our operations{" "}
          {copy.aboutLegal}
        </p>
      </section>
    </>
  );
}
