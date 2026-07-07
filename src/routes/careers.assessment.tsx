import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Loader2 } from "lucide-react";
import {
  getSkillsQuizForRole,
  PIPELINE_SESSION_KEY,
  shuffleQuizOptions,
  type SkillsQuizQuestion,
} from "@/lib/careersPipeline";
import { getSkillsProfileState, submitSkillsProfile } from "@/lib/server/actions";

interface Search {
  applicationId?: string;
}

export const Route = createFileRoute("/careers/assessment")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    applicationId: typeof search.applicationId === "string" ? search.applicationId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Skills Profile Review — Worknesta" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CareersAssessmentPage,
});

function CareersAssessmentPage() {
  const { applicationId: searchId } = Route.useSearch();
  const [applicationId, setApplicationId] = useState<string | undefined>(searchId);
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [roleSlug, setRoleSlug] = useState("");
  const [questions, setQuestions] = useState<SkillsQuizQuestion[]>([]);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [scorePercent, setScorePercent] = useState<number | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id =
      searchId ||
      (typeof window !== "undefined" ? sessionStorage.getItem(PIPELINE_SESSION_KEY) : null) ||
      undefined;
    setApplicationId(id ?? undefined);
    if (!id) {
      setLoading(false);
      setValid(false);
      return;
    }
    void (async () => {
      try {
        const state = await getSkillsProfileState({ data: { applicationId: id } });
        if (!state.valid) {
          setValid(false);
          return;
        }
        const slug = state.roleSlug || "ai-content-transcription-validator";
        setValid(true);
        setCandidateName(state.candidateName);
        setCandidateEmail(state.email);
        setRoleTitle(state.roleTitle);
        setRoleSlug(slug);
        setQuestions(shuffleQuizOptions(getSkillsQuizForRole(slug)));
        setAlreadySubmitted(state.alreadySubmitted);
        setScorePercent(state.scorePercent);
        if (state.alreadySubmitted) setDone(true);
      } catch {
        setValid(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [searchId]);

  const allAnswered = useMemo(
    () => questions.length > 0 && questions.every((q) => Boolean(answers[q.id])),
    [answers, questions],
  );

  const handleSubmit = () => {
    if (!applicationId || !allAnswered) return;
    void (async () => {
      setSubmitting(true);
      setError("");
      try {
        const result = await submitSkillsProfile({ data: { applicationId, answers } });
        setProcessing(true);
        await new Promise((r) => setTimeout(r, 1800));
        setScorePercent(result.scorePercent);
        setDone(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Submission failed");
      } finally {
        setSubmitting(false);
        setProcessing(false);
      }
    })();
  };

  if (loading) {
    return (
      <section className="container-page flex min-h-[50vh] items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-ink/40" />
      </section>
    );
  }

  if (!applicationId || !valid) {
    return (
      <section className="container-page max-w-2xl py-16 text-center">
        <h1 className="text-2xl font-medium text-ink">Skills Profile Review unavailable</h1>
        <p className="mt-3 text-sm text-ink/60">
          Complete your application first to access this step.
        </p>
        <Link
          to="/careers/apply"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-ink-foreground"
        >
          Submit application <ArrowUpRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  if (processing) {
    return (
      <section className="container-page max-w-2xl py-16">
        <div className="rounded-3xl border border-ink/10 bg-card p-10 text-center shadow-sm">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-lime" />
          <p className="mt-6 text-lg font-medium text-ink">Processing your Skills Profile Review…</p>
          <p className="mt-2 text-sm text-ink/60">
            You will receive an email with your score and next steps shortly.
          </p>
        </div>
      </section>
    );
  }

  if (done) {
    return (
      <section className="container-page max-w-2xl py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-ink/10 bg-card p-8 text-center shadow-sm md:p-12"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lime text-ink">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-medium text-ink">
            {alreadySubmitted && !scorePercent ? "Profile already submitted" : "Submission received"}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink/65">
            Thank you{candidateName ? `, ${candidateName.split(" ")[0]}` : ""}. Your Skills Profile
            Review for <span className="font-medium text-ink">{roleTitle}</span> has been recorded.
          </p>
          {candidateEmail ? (
            <p className="mx-auto mt-4 max-w-lg rounded-2xl border border-ink/10 bg-cream px-4 py-3 text-sm text-ink/70">
              If you are selected to move forward, your contractor onboarding email will be sent to{" "}
              <span className="font-medium text-ink">{candidateEmail}</span> within 18–24 hours.
              That email includes your link to complete workspace setup. Please check your inbox and
              spam folder.
            </p>
          ) : (
            <p className="mx-auto mt-4 max-w-lg text-sm text-ink/65">
              If you are selected to move forward, your contractor onboarding email will arrive within
              18–24 hours. Please check your inbox and spam folder.
            </p>
          )}
        </motion.div>
      </section>
    );
  }

  return (
    <section className="container-page py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">Step 2 of 4</p>
        <h1 className="mt-2 text-3xl font-medium text-ink md:text-4xl">
          Skills Profile <span className="font-serif italic">Review</span>
        </h1>
        <p className="mt-3 text-sm text-ink/65">
          Role-specific questions for{" "}
          <span className="font-medium text-ink">{roleTitle}</span>. Answer each carefully — upon
          submission you will receive an email with your score and next steps.
        </p>

        <div className="mt-8 space-y-6">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-3xl border border-ink/10 bg-card p-6">
              <p className="text-sm font-medium text-ink">
                {i + 1}. {q.question}
              </p>
              <div className="mt-4 space-y-2">
                {q.options.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/10 bg-cream p-3 text-sm has-[:checked]:border-ink has-[:checked]:bg-lime/25"
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt.id}
                      checked={answers[q.id] === opt.id}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                      className="mt-0.5"
                    />
                    <span className="text-ink/80">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!allAnswered || submitting}
          onClick={handleSubmit}
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {submitting ? "Submitting…" : "Submit Skills Profile Review"}
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
