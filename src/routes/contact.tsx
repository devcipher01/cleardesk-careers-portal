import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Mail, ShieldCheck, CheckCircle2, ArrowUpRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/site/Section";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Worknesta" },
      {
        name: "description",
        content:
          "Get in touch with Worknesta. We respond to all inquiries within 1–2 business days. Email talent@worknesta.com.",
      },
      { property: "og:title", content: "Contact Worknesta" },
      {
        property: "og:description",
        content: "Reach our talent team. We do not charge any application or processing fees.",
      },
    ],
  }),
  component: ContactPage,
});

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function ContactPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactForm>();
  const [sent, setSent] = useState(false);

  const onSubmit = async (_data: ContactForm) => {
    await new Promise((r) => setTimeout(r, 700));
    setSent(true);
    reset();
  };

  return (
    <Section>
      <div className="container-page">
        <SectionHeader
          eyebrow="Contact"
          title="Get in"
          italicWord="touch."
          description="Questions about a role, your application, or our company? Send us a note."
        />
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-5">
          <div className="md:col-span-2 space-y-5">
            <div className="rounded-3xl border border-ink/10 bg-card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lime text-ink">
                <Mail className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-medium text-ink/60">Email us at</p>
              <a
                href="mailto:talent@worknesta.com"
                className="mt-1 inline-flex items-center gap-1.5 font-serif text-2xl italic text-ink hover:underline"
              >
                talent@worknesta.com
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
            <div className="rounded-3xl bg-ink p-6 text-ink-foreground">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lime text-ink">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <p className="mt-4 text-base font-medium">No fees, ever.</p>
              <p className="mt-1 text-sm text-ink-foreground/70">
                We do not charge any application or processing fees. All roles are legitimate
                and remote.
              </p>
            </div>
          </div>

          <div className="md:col-span-3">
            {sent ? (
              <div className="rounded-3xl border border-ink/10 bg-card p-8 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-lime" />
                <h3 className="mt-3 text-2xl font-medium text-ink">
                  Message <span className="font-serif italic">sent.</span>
                </h3>
                <p className="mt-1 text-sm text-ink/60">We'll respond within 1–2 business days.</p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-5 rounded-full border border-ink/15 px-4 py-2 text-sm font-medium hover:bg-ink/5"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 rounded-3xl border border-ink/10 bg-card p-6 md:p-7"
                noValidate
              >
                <Field label="Full name" error={errors.name?.message}>
                  <input
                    {...register("name", { required: "Name is required", maxLength: { value: 100, message: "Max 100 characters" } })}
                    className="ipt"
                    placeholder="Jane Doe"
                  />
                </Field>
                <Field label="Email address" error={errors.email?.message}>
                  <input
                    type="email"
                    {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" } })}
                    className="ipt"
                    placeholder="you@example.com"
                  />
                </Field>
                <Field label="Subject" error={errors.subject?.message}>
                  <input
                    {...register("subject", { required: "Subject is required", maxLength: { value: 150, message: "Max 150 characters" } })}
                    className="ipt"
                    placeholder="How can we help?"
                  />
                </Field>
                <Field label="Message" error={errors.message?.message}>
                  <textarea
                    rows={5}
                    {...register("message", { required: "Message is required", maxLength: { value: 2000, message: "Max 2000 characters" } })}
                    className="ipt"
                    placeholder="Tell us a bit about your inquiry..."
                  />
                </Field>
                <button
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime px-5 py-3 text-sm font-medium text-lime-foreground transition hover:opacity-90 disabled:opacity-60"
                >
                  {isSubmitting ? "Sending..." : "Send message"}
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        <style>{`
          .ipt {
            width: 100%;
            border-radius: 0.875rem;
            border: 1px solid var(--border);
            background: var(--cream);
            padding: 0.75rem 0.875rem;
            font-size: 0.875rem;
            color: var(--ink);
            outline: none;
            transition: border-color .15s, box-shadow .15s;
          }
          .ipt:focus {
            border-color: var(--ink);
            box-shadow: 0 0 0 3px color-mix(in oklab, var(--lime) 50%, transparent);
          }
        `}</style>
      </div>
    </Section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
