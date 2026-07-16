import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  FileText,
  MessageSquare,
  ClipboardCheck,
  Mail,
  Rocket,
  Wallet,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { Section, SectionHeader } from "@/components/site/Section";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Contractor Onboarding | Worknesta" },
      {
        name: "description",
        content:
          "From application to first earnings: our 6-step contractor onboarding process at Worknesta. Apply, complete your workspace setup, get paid weekly.",
      },
      { property: "og:title", content: "How Onboarding Works at Worknesta" },
      {
        property: "og:description",
        content:
          "Apply → Skills Screening → Skill Assessment → Project Agreement → Workspace Setup → First Earnings. Most contractors complete the process in under a week.",
      },
    ],
  }),
  component: HowItWorksPage,
});

const steps = [
  { icon: FileText, color: "bg-lime", title: "Apply online", body: "Fill out our short application form — about 5 minutes." },
  { icon: MessageSquare, color: "bg-peach", title: "Skills screening", body: "Answer a few profile questions right on screen to confirm fit." },
  { icon: ClipboardCheck, color: "bg-lavender", title: "Skill assessment", body: "Complete a short 30-minute transcription task to demonstrate your accuracy." },
  { icon: Mail, color: "bg-mint", title: "Project agreement", body: "Receive your official contractor agreement via email." },
  { icon: Rocket, color: "bg-butter", title: "Workspace setup", body: "Get access to your workspace, project modules, and onboarding materials." },
  { icon: Wallet, color: "bg-rose", title: "First earnings", body: "Get paid weekly via Wise, Payoneer, or bank transfer." },
];

const faqs = [
  {
    q: "Is this really fully remote?",
    a: "Yes — 100%. Worknesta has no physical office requirement. All transcription projects are completed online from wherever you are.",
  },
  {
    q: "What equipment do I need?",
    a: "You will need a laptop or desktop computer, a stable internet connection, and a quiet workspace. A good pair of headphones is strongly recommended for transcription projects. We recommend free tools like oTranscribe or Express Scribe — we'll guide you during workspace setup.",
  },
  {
    q: "What countries do you accept contractors from?",
    a: "We currently work with contractors from North America and Western Europe. Ideal candidates are based in the US, Canada, UK, or Western European countries with availability in EST, GMT, or CET timezones.",
  },
  {
    q: "How and when do I receive my earnings?",
    a: "All contractors are paid weekly every Friday via Wise, Payoneer, or direct bank transfer depending on your country. Earnings rates are listed on each project card.",
  },
  {
    q: "Is there any application or registration fee?",
    a: "Absolutely not. Worknesta will never charge you to apply, register, or onboard. Any website or person claiming to charge fees on our behalf is fraudulent. Our onboarding is always 100% free.",
  },
  {
    q: "How long does the full onboarding process take?",
    a: "From application to workspace access typically takes 5–10 business days depending on volume. The steps are: application review (2–3 days), skills screening (on your time), skill task (24–48 hours), then project agreement.",
  },
  {
    q: "Is prior experience required?",
    a: "Not for entry-level projects like our Remote Transcription Specialist module. We look for attention to detail, reliable internet, and a good typing speed. Specialist projects like Medical Transcriptionist do require relevant experience.",
  },
  {
    q: "What hours will I work?",
    a: "It depends on the project and your agreement. Most projects offer flexible scheduling within an agreed weekly module commitment. Some client accounts have preferred timezone windows which will be communicated during workspace setup.",
  },
];

function HowItWorksPage() {
  return (
    <>
      <section className="container-page pt-6 md:pt-10">
        <div className="relative overflow-hidden rounded-3xl bg-card p-8 shadow-sm md:p-14">
          <div className="absolute -top-16 right-10 h-56 w-56 rounded-full bg-butter/50 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-mint/40 blur-3xl" />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">Our onboarding process</p>
            <h1 className="mt-4 text-balance text-4xl font-medium leading-[1.05] text-ink md:text-6xl">
              From application to your{" "}
              <span className="font-serif italic">first earnings.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-ink/65 md:text-lg">
              A clear, fast, fair process — built for independent contractors across North America and
              Western Europe.
            </p>
          </div>
        </div>
      </section>

      <Section>
        <div className="container-page">
          <div className="mx-auto max-w-2xl">
            <ol className="relative space-y-6 border-l-2 border-dashed border-ink/15 pl-8">
              {steps.map((s, i) => (
                <motion.li
                  key={s.title}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.05 }}
                  className="relative"
                >
                  <span className={`absolute -left-[2.4rem] top-1 flex h-10 w-10 items-center justify-center rounded-full ${s.color} text-ink ring-4 ring-cream`}>
                    <s.icon className="h-4 w-4" />
                  </span>
                  <div className="rounded-3xl border border-ink/10 bg-card p-5 md:p-6">
                    <p className="font-script text-lg text-ink/55">step {i + 1}</p>
                    <h3 className="mt-1 text-xl font-medium text-ink">{s.title}</h3>
                    <p className="mt-1 text-sm text-ink/60">{s.body}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      <Section>
        <div className="container-page">
          <SectionHeader
            eyebrow="FAQ"
            title="Frequently asked"
            italicWord="questions."
            description="Everything you need to know before applying."
          />
          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {faqs.map((f) => (
              <FaqItem key={f.q} {...f} />
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-ink md:text-base">{q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-ink/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-ink/10 px-5 py-4 text-sm text-ink/70">{a}</div>
      )}
    </div>
  );
}
