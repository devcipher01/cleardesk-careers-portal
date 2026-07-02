import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ArrowUpRight, Loader2 } from "lucide-react";
import { onboardingComplete, onboardingGet, onboardingCompleteBySession, onboardingGetBySession } from "@/lib/server/actions";
import { OrgShell } from "@/components/workspace/OrgShell";
import { PIPELINE_SESSION_KEY } from "@/lib/careersPipeline";

interface Search {
  token?: string;
}

export const Route = createFileRoute("/onboarding")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Onboarding — Worknesta" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OnboardingPage,
});

type Step = 1 | 2 | 3 | 4;
type AuthMode = "token" | "session" | "none";

function OnboardingPage() {
  const { token } = Route.useSearch();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [name, setName] = useState("");
  const [roleSlug, setRoleSlug] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [doneTools, setDoneTools] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("none");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");

      // 1. Try token from URL first (original flow)
      if (token) {
        try {
          const res = await onboardingGet({ data: { token } });
          if (res.valid) {
            setValid(true);
            setCompleted(false);
            setApplicationId(res.applicationId ?? null);
            setName(res.name);
            setRoleSlug(res.roleSlug);
            setRoleTitle(res.roleTitle);
            setAuthMode("token");
            if (res.applicationId && typeof window !== "undefined") {
              window.sessionStorage.setItem(PIPELINE_SESSION_KEY, res.applicationId);
            }
            setLoading(false);
            return;
          }
        } catch {
          /* fall through to session */
        }
      }

      // 2. Try session cookie (new flow — verify endpoint sets this)
      try {
        const res = await onboardingGetBySession();
        if (res.valid) {
          setValid(true);
          setCompleted(false);
          setApplicationId(res.applicationId);
          setName(res.name);
          setRoleSlug(res.roleSlug);
          setRoleTitle(res.roleTitle);
          setAuthMode("session");
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(PIPELINE_SESSION_KEY, res.applicationId);
          }
          setLoading(false);
          return;
        }
      } catch {
        /* fall through */
      }

      // 3. Try sessionStorage fallback
      const storedId = typeof window !== "undefined" ? window.sessionStorage.getItem(PIPELINE_SESSION_KEY) : null;
      if (storedId) {
        try {
          const res = await onboardingGetBySession();
          if (res.valid) {
            setValid(true);
            setName(res.name);
            setRoleSlug(res.roleSlug);
            setRoleTitle(res.roleTitle);
            setApplicationId(res.applicationId);
            setAuthMode("session");
            setLoading(false);
            return;
          }
        } catch {
          /* fall through */
        }
      }

      setValid(false);
      setLoading(false);
    })();
  }, [token]);

  const isTranscription = useMemo(() => roleSlug.includes("transcription"), [roleSlug]);
  const isDataEntry = useMemo(
    () =>
      roleSlug.includes("data-entry") ||
      roleSlug.includes("document-processing") ||
      roleSlug.includes("virtual-data"),
    [roleSlug],
  );

  const tools = buildTools({ isTranscription, isDataEntry });
  const allDone = tools.every((t) => Boolean(doneTools[t.id]));

  const next = () => setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
  const prev = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const complete = async () => {
    if (!ready) return;
    setError("");
    try {
      if (authMode === "session") {
        await onboardingCompleteBySession({ data: { ready } });
      } else if (token) {
        await onboardingComplete({ data: { token, ready } });
        if (applicationId && typeof window !== "undefined") {
          window.sessionStorage.setItem(PIPELINE_SESSION_KEY, applicationId);
        }
      }
      setCompleted(true);
    } catch (e: any) {
      setError(e?.message || "Failed to complete onboarding");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1419]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!valid) return <InvalidLink />;

  if (completed) {
    const final = <FinalScreen name={name} />;
    return applicationId ? (
      <OrgShell candidateName={name} roleTitle={roleTitle} activeNav="setup">
        {final}
      </OrgShell>
    ) : (
      final
    );
  }

  const page = (
    <section className="container-page max-w-4xl py-10 md:py-14">
      <div className="rounded-3xl border border-ink/10 bg-card p-6 shadow-sm md:p-10">
        <div className="mb-6 flex items-center justify-between">
          <p className="font-script text-xl text-ink/55">onboarding</p>
          <p className="text-xs font-medium text-ink/50">Step {step} of 4</p>
        </div>

        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-cream">
          <div
            className="h-full rounded-full bg-lime transition-all"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {step === 1 && (
          <>
            <h1 className="text-3xl font-medium text-ink md:text-4xl">
              Welcome to Worknesta,{" "}
              <span className="font-serif italic">{firstName(name)}.</span>
            </h1>
            <p className="mt-4 text-ink/65">
              We are thrilled to have you. This page covers everything you need before your first
              task. It takes about 20 minutes.
            </p>
            <div className="mt-8 flex justify-end">
              <button
                onClick={next}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground"
              >
                Next <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-2xl font-medium text-ink md:text-3xl">
              Set up your <span className="font-serif italic">tools</span> before day one.
            </h2>
            <p className="mt-3 text-ink/65">
              Everything below is completely free. Worknesta will never ask you to purchase any
              software or subscriptions.
            </p>
            <div className="mt-6 grid gap-3">
              {tools.map((t) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/10 bg-cream p-4 text-sm text-ink has-[:checked]:border-ink has-[:checked]:bg-lime/30"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Boolean(doneTools[t.id])}
                    onChange={(e) =>
                      setDoneTools((s) => ({ ...s, [t.id]: e.target.checked }))
                    }
                  />
                  <div className="min-w-0">
                    <div className="font-medium">{t.name}</div>
                    <div className="mt-1 text-ink/60">
                      {t.desc}{" "}
                      {t.href && (
                        <a
                          className="underline hover:text-ink"
                          href={t.href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t.href}
                        </a>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={prev}
                className="rounded-full border border-ink/15 px-5 py-3 text-sm font-medium text-ink hover:bg-ink/5"
              >
                Back
              </button>
              <button
                onClick={next}
                disabled={!allDone}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-2xl font-medium text-ink md:text-3xl">
              How we work at <span className="font-serif italic">Worknesta</span>.
            </h2>
            <div className="mt-6 grid gap-4">
              <Card title="Accuracy">
                We expect 97% or higher accuracy on all submitted work. During your first 2 weeks
                your supervisor will review every submission personally and provide detailed
                feedback.
              </Card>
              <Card title="Turnaround">
                Complete assigned tasks within the deadline given. If you need more time, message
                your supervisor at least 2 hours before the deadline — never after.
              </Card>
              <Card title="Communication">
                Respond to messages within 4 hours during your agreed working hours. If you will be
                unavailable notify your supervisor in advance.
              </Card>
              <Card title="Submitting Work">
                All completed work is submitted directly through the Worknesta platform. Never send
                work via personal email or external file sharing services.
              </Card>
              {isTranscription && (
                <Card title="Quality Checks — Transcription">
                  After typing your transcription, replay the audio from the beginning and read
                  along with your text. Correct any mistakes before submitting. This single habit
                  will keep your accuracy above 97%.
                </Card>
              )}
              {!isTranscription && (
                <Card title="Quality Checks — Data Entry">
                  Re-read every row before submitting. Check for typos, wrong formats, and missing
                  entries. A second pass takes 2 minutes and prevents most errors.
                </Card>
              )}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={prev}
                className="rounded-full border border-ink/15 px-5 py-3 text-sm font-medium text-ink hover:bg-ink/5"
              >
                Back
              </button>
              <button
                onClick={next}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground"
              >
                Next <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-2xl font-medium text-ink md:text-3xl">
              You are all set! <span className="font-serif italic">✅</span>
            </h2>
            <p className="mt-4 text-ink/65">
              Your first task will arrive in your inbox within 24 hours of completing this
              onboarding. It will come from{" "}
              <strong>talent@worknesta.com</strong> — add this address to your contacts now so it
              does not go to spam.
            </p>
            <div className="mt-6 rounded-2xl border border-ink/10 bg-cream p-5 text-sm text-ink/75">
              <div className="font-medium text-ink">Supervisor</div>
              <div className="mt-1 text-ink/60">
                Your supervisor is <strong>[SUPERVISOR_NAME]</strong>. You will be introduced via
                email on your start date.
              </div>
            </div>
            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/10 bg-cream p-4 text-sm text-ink has-[:checked]:border-ink has-[:checked]:bg-lime/30">
              <input
                type="checkbox"
                checked={ready}
                onChange={(e) => setReady(e.target.checked)}
                className="mt-1"
              />
              <span>
                I have completed all onboarding steps and I am ready to receive my first task.
              </span>
            </label>
            {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={prev}
                className="rounded-full border border-ink/15 px-5 py-3 text-sm font-medium text-ink hover:bg-ink/5"
              >
                Back
              </button>
              <button
                onClick={() => void complete()}
                disabled={!ready}
                className="inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-medium text-lime-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Complete Onboarding <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mt-10 text-center text-xs text-ink/45">
        Role: {roleTitle || "—"}
      </div>
    </section>
  );

  return applicationId ? (
    <OrgShell candidateName={name} roleTitle={roleTitle} activeNav="setup">
      {page}
    </OrgShell>
  ) : (
    page
  );
}

function InvalidLink() {
  return (
    <section className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="max-w-lg rounded-3xl border border-ink/10 bg-card p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose/40 text-ink">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-3xl font-medium text-ink">
          This link is <span className="font-serif italic">invalid</span> or has expired.
        </h1>
        <p className="mt-4 text-ink/65">Please check your email for the correct link.</p>
        <p className="mt-3 text-sm text-ink/55">
          Questions? Contact{" "}
          <a className="underline hover:text-ink" href="mailto:talent@worknesta.com">
            talent@worknesta.com
          </a>
        </p>
      </div>
    </section>
  );
}

function FinalScreen({ name }: { name: string }) {
  return (
    <section className="container-page max-w-2xl py-16">
      <div className="rounded-3xl border border-ink/10 bg-card p-10 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime text-ink">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="mt-6 text-4xl font-medium text-ink md:text-5xl">
          Onboarding <span className="font-serif italic">Complete</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-ink/65">
          Welcome to the team {firstName(name)}. Your first task is on its way. We are glad to
          have you at Worknesta.
        </p>
      </div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-cream p-5">
      <div className="text-sm font-medium text-ink">{title}</div>
      <div className="mt-2 text-sm text-ink/70">{children}</div>
    </div>
  );
}

function firstName(full: string) {
  return full.trim().split(/\s+/)[0] || "there";
}

function buildTools({
  isTranscription,
  isDataEntry,
}: {
  isTranscription: boolean;
  isDataEntry: boolean;
}) {
  const base = [
    {
      id: "chrome",
      name: "Google Chrome",
      desc: "Download and install the latest version.",
      href: "https://www.google.com/chrome/",
    },
    {
      id: "zoom",
      name: "Zoom",
      desc: "Download here:",
      href: "https://zoom.us/download",
    },
    {
      id: "speed",
      name: "Internet speed test",
      desc: "You need minimum 10 Mbps download speed. Test here:",
      href: "https://fast.com",
    },
    {
      id: "email",
      name: "Gmail or professional email",
      desc: "Ensure you can reliably access your inbox daily.",
    },
  ];
  const transcription = [
    {
      id: "otranscribe",
      name: "oTranscribe",
      desc: "Free browser-based transcription tool. Primary work tool — no install needed:",
      href: "https://otranscribe.com",
    },
    {
      id: "scribe",
      name: "Express Scribe (Free)",
      desc: "Optional but recommended for longer audio files:",
      href: "https://www.nch.com.au/scribe/",
    },
    {
      id: "headphones",
      name: "Headphones",
      desc: "Any over-ear headphones improve accuracy significantly. Budget options work perfectly.",
    },
    {
      id: "stipend",
      name: "Equipment stipend note",
      desc: "After completing your first 30 days you will receive a $25 USD equipment stipend via Wise or Payoneer.",
    },
  ];
  const dataEntry = [
    {
      id: "sheets",
      name: "Google Sheets",
      desc: "Make sure you can access Sheets:",
      href: "https://sheets.google.com",
    },
    {
      id: "grammarly",
      name: "Grammarly (free) Chrome extension",
      desc: "Install the free extension:",
      href: "https://www.grammarly.com",
    },
  ];
  return [
    ...base,
    ...(isTranscription ? transcription : []),
    ...(isDataEntry ? dataEntry : []),
  ];
}
