import { createFileRoute } from "@tanstack/react-router";
import { create } from "zustand";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ArrowUpRight, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { submitInterview, validateToken } from "@/lib/server/actions";

interface Search {
  token?: string;
}

export const Route = createFileRoute("/interview")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Screening Interview — Worknesta" },
      { name: "description", content: "Private screening interview for shortlisted Worknesta candidates." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InterviewPage,
});

const QUESTIONS = [
  "Tell us about yourself and your professional background.",
  "Why are you interested in a remote data entry or transcription role with Worknesta?",
  "Describe your current work setup — do you have a dedicated laptop or desktop, stable internet, and a quiet workspace?",
  "How do you stay focused and maintain accuracy when handling large volumes of repetitive work?",
  "What tools or software have you used before? (e.g. Microsoft Excel, Google Sheets, Express Scribe, oTranscribe, or any transcription/data tools)",
  "Walk us through how you check your own work for errors before submitting.",
  "What is your estimated typing speed, and what hours of the day are you most productive?",
  "What are your pay expectations per hour (in USD), and when are you available to start?",
];

const TOTAL_SECONDS = 20 * 60;
const MIN_CHARS = 80;

interface InterviewState {
  name: string;
  email: string;
  started: boolean;
  finished: boolean;
  current: number;
  answers: string[];
  startedAt: number | null;
  setIdentity: (n: string, e: string) => void;
  start: () => void;
  setAnswer: (idx: number, v: string) => void;
  next: () => void;
  finish: () => void;
}

const useInterview = create<InterviewState>((set) => ({
  name: "",
  email: "",
  started: false,
  finished: false,
  current: 0,
  answers: Array(QUESTIONS.length).fill(""),
  startedAt: null,
  setIdentity: (name, email) => set({ name, email }),
  start: () => set({ started: true, startedAt: Date.now() }),
  setAnswer: (idx, v) =>
    set((s) => {
      const a = [...s.answers];
      a[idx] = v;
      return { answers: a };
    }),
  next: () => set((s) => (s.current >= QUESTIONS.length - 1 ? { finished: true } : { current: s.current + 1 })),
  finish: () => set({ finished: true }),
}));

function InterviewPage() {
  const { token } = Route.useSearch();
  const { started, finished } = useInterview();
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setValid(false);
      return;
    }
    (async () => {
      const res = await validateToken({ data: { token, type: "interview" } });
      setValid(res.valid);
    })().catch(() => setValid(false));
  }, [token]);

  if (!token) return <InvalidLink />;
  if (valid === false) return <InvalidLink />;
  if (valid === null) return <LoadingScreen />;
  if (finished) return <Done />;
  if (!started) return <Welcome />;
  return <Quiz token={token} />;
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
        <p className="mt-4 text-ink/65">
          Please check your email for the correct interview link.
        </p>
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

function Welcome() {
  const { setIdentity, start } = useInterview();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const valid = name.trim().length > 0 && /^\S+@\S+\.\S+$/.test(email) && confirmed;

  const begin = () => {
    if (!name.trim() || name.length > 100) return setError("Please enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email.");
    if (!confirmed) return setError("Please confirm you are ready to focus.");
    setIdentity(name.trim(), email.trim());
    start();
  };

  return (
    <section className="container-page max-w-3xl py-12 md:py-16">
      <div className="rounded-3xl border border-ink/10 bg-card p-6 shadow-sm md:p-10">
        <div className="flex items-center gap-2 text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-ink-foreground font-serif text-lg italic">
            c
          </span>
          <span className="text-base font-medium">Worknesta</span>
        </div>
        <p className="mt-6 font-script text-xl text-ink/55">screening interview</p>
        <h1 className="mt-1 text-4xl font-medium text-ink md:text-5xl">
          Your Worknesta <span className="font-serif italic">screening interview.</span>
        </h1>
        <p className="mt-4 text-ink/65">
          This should take about 20 minutes. Read each question carefully before answering.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Full name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className="ipt" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Email address</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={150} className="ipt" />
          </label>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/10 bg-cream p-4 text-sm text-ink has-[:checked]:border-ink has-[:checked]:bg-lime/30">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5"
          />
          <span>I confirm I am in a quiet space, ready to focus for 20 minutes.</span>
        </label>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-butter bg-butter/40 p-4 text-sm text-ink">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            ⚠️ Once you begin, you cannot pause or go back. Each question must be answered before
            moving to the next. You have <strong>20 minutes</strong> total.
          </p>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <button
          onClick={begin}
          disabled={!valid}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime px-5 py-3 text-sm font-medium text-lime-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
        >
          Begin interview <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
      <style>{`
        .ipt { width:100%; border-radius:.875rem; border:1px solid var(--border); background:var(--cream); padding:.75rem .875rem; font-size:.875rem; color:var(--ink); outline:none; }
        .ipt:focus { border-color: var(--ink); box-shadow: 0 0 0 3px color-mix(in oklab, var(--lime) 50%, transparent); }
      `}</style>
    </section>
  );
}

function Quiz({ token }: { token: string }) {
  const { current, answers, setAnswer, next, finish, name, email, startedAt } = useInterview();
  const [seconds, setSeconds] = useState(TOTAL_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(id);
          void (async () => {
            try {
              setSubmitting(true);
              await submitInterview({
                data: {
                  token,
                  name,
                  email,
                  startedAt,
                  answers,
                  timeTakenSeconds: startedAt ? Math.round((Date.now() - startedAt) / 1000) : null,
                },
              });
              finish();
            } catch (e: any) {
              setSubmitError(e?.message || "Submission failed");
              finish();
            } finally {
              setSubmitting(false);
            }
          })();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [finish, name, email, token, answers, startedAt]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const lowTime = seconds <= 120;

  const value = answers[current];
  const charCount = value.length;
  const meetsMin = charCount >= MIN_CHARS;
  const isLast = current === QUESTIONS.length - 1;

  const handleNext = () => {
    if (isLast) {
      void (async () => {
        try {
          setSubmitting(true);
          await submitInterview({
            data: {
              token,
              name,
              email,
              startedAt,
              answers,
              timeTakenSeconds: startedAt ? Math.round((Date.now() - startedAt) / 1000) : null,
            },
          });
        } catch (e: any) {
          setSubmitError(e?.message || "Submission failed");
        } finally {
          setSubmitting(false);
        }
        next();
      })();
      return;
    }
    next();
  };

  return (
    <section className="container-page max-w-3xl py-12 md:py-16">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-script text-xl text-ink/55">
          Question {current + 1} of {QUESTIONS.length}
        </p>
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${lowTime ? "bg-rose/40 text-ink" : "bg-lime/40 text-ink"}`}>
          <Clock className="h-4 w-4" />
          {mm}:{ss}
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-card">
        <div className="h-full rounded-full bg-lime transition-all" style={{ width: `${((current + 1) / QUESTIONS.length) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
          className="mt-6 rounded-3xl border border-ink/10 bg-card p-6 shadow-sm md:p-8"
        >
          <h2 className="text-2xl font-medium text-ink md:text-3xl">{QUESTIONS[current]}</h2>
          <textarea
            value={value}
            onChange={(e) => setAnswer(current, e.target.value)}
            rows={8}
            maxLength={3000}
            placeholder="Type your answer here..."
            className="mt-5 w-full rounded-2xl border border-ink/10 bg-cream p-4 text-sm text-ink outline-none focus:border-ink focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--lime)_50%,transparent)]"
          />
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className={meetsMin ? "text-ink/50" : "text-destructive"}>
              {charCount} / {MIN_CHARS} minimum characters
            </span>
            {!meetsMin && (
              <span className="text-destructive">Please write at least {MIN_CHARS} characters.</span>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              disabled={!meetsMin || submitting}
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-ink-foreground transition hover:bg-lime hover:text-lime-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLast ? "Submit interview" : "Next question"}
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
          {submitError && <p className="mt-4 text-sm text-destructive">{submitError}</p>}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function Done() {
  const { name } = useInterview();
  const display = name || "there";
  return (
    <section className="container-page max-w-2xl py-16">
      <div className="rounded-3xl border border-ink/10 bg-card p-10 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime text-ink">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="mt-6 text-4xl font-medium text-ink md:text-5xl">
          Interview Complete — Thank you <span className="font-serif italic">{display}!</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-ink/65">
          We have received your responses. Our team will review your answers and reach out within 48 hours with your next step.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ink/55">
          Keep an eye on your inbox including your spam folder.
        </p>
      </div>
    </section>
  );
}

function LoadingScreen() {
  return (
    <section className="container-page flex min-h-[60vh] items-center justify-center py-16">
      <div className="text-sm text-ink/60">Loading…</div>
    </section>
  );
}
