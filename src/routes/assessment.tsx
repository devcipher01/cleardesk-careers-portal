import { createFileRoute } from "@tanstack/react-router";
import { create } from "zustand";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  Volume2,
} from "lucide-react";
import { submitAssessment, validateToken } from "@/lib/server/actions";

type Role = "transcription" | "data-entry" | "qa";

interface Search {
  token?: string;
}

export const Route = createFileRoute("/assessment")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Skill Assessment — Worknesta" },
      {
        name: "description",
        content: "Private skill assessment for shortlisted Worknesta candidates.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AssessmentPage,
});

const TRANSCRIPTION_SECONDS = 45 * 60;
const DATA_ENTRY_SECONDS = 30 * 60;
const ROW_COUNT = 10;

interface DataRow {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  date: string;
  notes: string;
}

interface AssessmentState {
  name: string;
  email: string;
  started: boolean;
  finished: boolean;
  startedAt: number | null;
  transcription: string;
  rows: DataRow[];
  setIdentity: (n: string, e: string) => void;
  start: () => void;
  setTranscription: (v: string) => void;
  setRow: (idx: number, patch: Partial<DataRow>) => void;
  finish: () => void;
}

const blankRow = (): DataRow => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  date: "",
  notes: "",
});

const useAssessment = create<AssessmentState>((set) => ({
  name: "",
  email: "",
  started: false,
  finished: false,
  startedAt: null,
  transcription: "",
  rows: Array.from({ length: ROW_COUNT }, blankRow),
  setIdentity: (name, email) => set({ name, email }),
  start: () => set({ started: true, startedAt: Date.now() }),
  setTranscription: (v) => set({ transcription: v }),
  setRow: (idx, patch) =>
    set((s) => {
      const rows = [...s.rows];
      rows[idx] = { ...rows[idx], ...patch };
      return { rows };
    }),
  finish: () => set({ finished: true }),
}));

function AssessmentPage() {
  const { token } = Route.useSearch();
  const { started, finished } = useAssessment();
  const [role, setRole] = useState<Role | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setValid(false);
      return;
    }
    (async () => {
      const res = await validateToken({ data: { token, type: "assessment" } });
      if (!res.valid) {
        setValid(false);
        return;
      }
      const slug = res.roleSlug.toLowerCase();
      const inferred: Role = slug.includes("quality-assurance")
        ? "qa"
        : slug.includes("transcription")
          ? "transcription"
          : "data-entry";
      setRole(inferred);
      setValid(true);
    })().catch(() => setValid(false));
  }, [token]);

  if (!token) return <InvalidLink />;
  if (valid === false) return <InvalidLink />;
  if (valid === null || role === null) return <Loading />;
  if (finished) return <Complete role={role} />;
  if (!started) return <Welcome role={role} />;
  return <Assessment role={role} token={token} />;
}

function InvalidLink() {
  return (
    <section className="container-page flex min-h-[80vh] items-center justify-center py-16">
      <div className="max-w-lg rounded-3xl border border-ink/10 bg-card p-10 text-center shadow-sm">
        <Logo />
        <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-rose/40 text-ink">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-3xl font-medium text-ink">
          This link is <span className="font-serif italic">invalid</span> or has expired.
        </h1>
        <p className="mt-4 text-ink/65">
          Please check your email for the correct assessment link or contact us at{" "}
          <a className="underline hover:text-ink" href="mailto:talent@worknesta.com">
            talent@worknesta.com
          </a>
          .
        </p>
      </div>
    </section>
  );
}

function Logo() {
  return (
    <div className="flex items-center justify-center gap-2 text-ink">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-serif text-lg italic text-ink-foreground">
        c
      </span>
      <span className="text-base font-medium">Worknesta</span>
    </div>
  );
}

function ProgressSteps({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-6 flex items-center gap-3 text-sm text-ink/60">
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
          step === 1 ? "bg-ink text-ink-foreground" : "bg-lime text-lime-foreground"
        }`}
      >
        1
      </span>
      <span className={step === 1 ? "text-ink" : ""}>Instructions</span>
      <span className="h-px flex-1 bg-ink/15" />
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
          step === 2 ? "bg-ink text-ink-foreground" : "bg-ink/10 text-ink/60"
        }`}
      >
        2
      </span>
      <span className={step === 2 ? "text-ink" : ""}>Assessment</span>
    </div>
  );
}

const TRANSCRIPTION_INSTRUCTIONS = [
  "Listen to the full audio clip before typing",
  "Type every word exactly as spoken",
  "Use [inaudible] for parts you cannot make out",
  "Include punctuation as best you can",
  "Do not use any AI tools or external help",
];

const DATA_ENTRY_INSTRUCTIONS = [
  "You will be shown a data table with errors",
  "Re-enter the data correctly in the form below",
  "Fix any formatting, spelling, or obvious errors",
  "Work carefully — accuracy is scored, not speed",
  "Do not use any AI tools or external help",
];

function Welcome({ role }: { role: Role }) {
  const { setIdentity, start } = useAssessment();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const isTranscription = role === "transcription";
  const headline = isTranscription
    ? "Transcription Skill Assessment"
    : "Data Entry Skill Assessment";
  const sub = isTranscription
    ? "This assessment takes approximately 30–45 minutes. Complete it in one sitting."
    : "This assessment takes approximately 20–30 minutes. Complete it in one sitting.";
  const instructions = isTranscription ? TRANSCRIPTION_INSTRUCTIONS : DATA_ENTRY_INSTRUCTIONS;

  const valid = name.trim().length > 0 && /^\S+@\S+\.\S+$/.test(email) && confirmed;

  const begin = () => {
    if (!name.trim()) return setError("Please enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email.");
    if (!confirmed) return setError("Please confirm you are ready to begin.");
    setIdentity(name.trim(), email.trim());
    start();
  };

  return (
    <section className="container-page max-w-3xl py-10 md:py-16">
      <div className="rounded-3xl border border-ink/10 bg-card p-6 shadow-sm md:p-10">
        <Logo />
        <div className="mt-6">
          <ProgressSteps step={1} />
        </div>
        <p className="font-script text-xl text-ink/55">skill assessment</p>
        <h1 className="mt-1 text-4xl font-medium text-ink md:text-5xl">
          {headline.split(" ").slice(0, -1).join(" ")}{" "}
          <span className="font-serif italic">{headline.split(" ").slice(-1)}.</span>
        </h1>
        <p className="mt-4 text-ink/65">{sub}</p>

        <div className="mt-8 rounded-2xl border border-ink/10 bg-cream p-5">
          <p className="mb-3 text-sm font-medium text-ink">Instructions</p>
          <ul className="space-y-2 text-sm text-ink/75">
            {instructions.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/50" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Full name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="ipt"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Email address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={150}
              className="ipt"
            />
          </label>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-butter bg-butter/40 p-4 text-sm text-ink">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            ⚠️ Once you begin the timer starts and cannot be paused. Ensure you are in a quiet
            space with stable internet.
          </p>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/10 bg-cream p-4 text-sm text-ink has-[:checked]:border-ink has-[:checked]:bg-lime/30">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5"
          />
          <span>I understand the instructions and am ready to begin.</span>
        </label>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <button
          onClick={begin}
          disabled={!valid}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime px-5 py-3 text-sm font-medium text-lime-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
        >
          Begin Assessment <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
      <SharedStyles />
    </section>
  );
}

function useCountdown(totalSeconds: number, onExpire: () => void) {
  const [seconds, setSeconds] = useState(totalSeconds);
  const expiredRef = useRef(false);
  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(id);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onExpire]);
  return seconds;
}

function TimerPill({ seconds }: { seconds: number }) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const tone =
    seconds <= 5 * 60
      ? "bg-rose/50 text-ink"
      : seconds <= 10 * 60
        ? "bg-butter text-ink"
        : "bg-lime/40 text-ink";
  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${tone}`}>
      <Clock className="h-4 w-4" />
      {mm}:{ss}
    </div>
  );
}

function Assessment({ role, token }: { role: Role; token: string }) {
  if (role === "transcription") return <TranscriptionAssessment token={token} />;
  if (role === "qa") return <QualityAssuranceAssessment token={token} />;
  return <DataEntryAssessment token={token} />;
}

function TranscriptionAssessment({ token }: { token: string }) {
  const { transcription, setTranscription, name, email, startedAt, finish, rows } = useAssessment();
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await submitAssessment({
        data: {
          token,
          name,
          email,
          timeTakenSeconds: startedAt ? Math.round((Date.now() - startedAt) / 1000) : null,
          kind: "transcription",
          payload: {
            audioUrl: "AUDIO_FILE_URL",
            transcription,
            wordCount: transcription.trim() ? transcription.trim().split(/\s+/).length : 0,
          },
        },
      });
      finish();
    } catch (e: any) {
      setError(e?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const seconds = useCountdown(TRANSCRIPTION_SECONDS, () => {
    void submit();
  });

  // touch rows so unused state from data-entry doesn't break tree-shaking concerns
  void rows;

  const wordCount = transcription.trim() ? transcription.trim().split(/\s+/).length : 0;
  const charCount = transcription.length;

  return (
    <section className="container-page max-w-5xl py-8 md:py-12">
      <div className="mb-4 flex items-center justify-between">
        <ProgressSteps step={2} />
        <TimerPill seconds={seconds} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-ink/10 bg-card p-5 shadow-sm">
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-ink/55">
              Audio sample
            </p>
            <AudioPlayer />
            <p className="mt-3 text-xs text-ink/55">
              You may replay the audio as many times as needed.
            </p>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="rounded-3xl border border-ink/10 bg-card p-5 shadow-sm">
            <label className="mb-2 block text-sm font-medium text-ink">Your Transcription</label>
            <textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              placeholder="Begin typing here as you listen..."
              className="min-h-[300px] w-full rounded-2xl border border-ink/10 bg-cream p-4 text-sm text-ink outline-none focus:border-ink focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--lime)_50%,transparent)]"
            />
            <div className="mt-3 flex items-center justify-between text-xs text-ink/60">
              <span>Words: {wordCount} · Characters: {charCount}</span>
              <span className="italic">Tip: Type [inaudible] for any unclear words</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setShowConfirm(true)}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-ink-foreground transition hover:bg-lime hover:text-lime-foreground disabled:opacity-60"
        >
          Submit Transcription <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <ConfirmModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          void submit();
        }}
        submitting={submitting}
      />
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      <SharedStyles />
    </section>
  );
}

function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  // AUDIO_SRC: replace with real audio URL
  const AUDIO_SRC = "";

  const fmt = (s: number) => {
    if (!Number.isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause();
    else void a.play().catch(() => {});
  };

  return (
    <div className="rounded-2xl bg-ink p-4 text-ink-foreground">
      <audio
        ref={audioRef}
        src={AUDIO_SRC || undefined}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent((e.target as HTMLAudioElement).currentTime)}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lime text-lime-foreground transition hover:scale-105"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
        </button>
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={current}
            step={0.1}
            onChange={(e) => {
              const a = audioRef.current;
              if (a) a.currentTime = Number(e.target.value);
            }}
            className="w-full accent-lime"
          />
          <div className="mt-1 flex justify-between text-[11px] text-ink-foreground/70">
            <span>{fmt(current)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-ink-foreground/70" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              if (audioRef.current) audioRef.current.volume = v;
            }}
            className="w-20 accent-lime"
          />
        </div>
      </div>
      {!AUDIO_SRC && (
        <p className="mt-3 text-[11px] text-ink-foreground/55">
          {/* AUDIO_SRC: replace with real audio URL */}
          Placeholder player — audio source not configured.
        </p>
      )}
    </div>
  );
}

function DataEntryAssessment({ token }: { token: string }) {
  const { rows, setRow, name, email, startedAt, finish, transcription } = useAssessment();
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await submitAssessment({
        data: {
          token,
          name,
          email,
          timeTakenSeconds: startedAt ? Math.round((Date.now() - startedAt) / 1000) : null,
          kind: "data-entry",
          payload: {
            dataImageUrl: "DATA_IMAGE_URL",
            rows,
          },
        },
      });
      finish();
    } catch (e: any) {
      setError(e?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const seconds = useCountdown(DATA_ENTRY_SECONDS, () => {
    void submit();
  });

  void transcription;

  return (
    <section className="container-page max-w-5xl py-8 md:py-12">
      <div className="mb-4 flex items-center justify-between">
        <ProgressSteps step={2} />
        <TimerPill seconds={seconds} />
      </div>

      <div className="rounded-3xl border border-ink/10 bg-card p-5 shadow-sm">
        <p className="mb-2 text-sm font-medium text-ink">Reference Data — Enter this below</p>
        <p className="mb-4 text-xs text-ink/55">Correct any errors you notice.</p>
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-cream">
          {/* DATA_TABLE_IMAGE: replace with real task image */}
          <div className="flex aspect-[16/7] items-center justify-center text-sm text-ink/40">
            Reference table image placeholder
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-ink/10 bg-card p-5 shadow-sm">
        <p className="mb-4 text-sm font-medium text-ink">Data Entry Form</p>
        <div className="max-h-[460px] overflow-y-auto pr-2">
          <div className="space-y-4">
            {rows.map((row, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-ink/10 bg-cream/50 p-4"
              >
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink/55">
                  Row {idx + 1}
                </p>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <input
                    placeholder="First name"
                    value={row.firstName}
                    onChange={(e) => setRow(idx, { firstName: e.target.value })}
                    className="ipt"
                  />
                  <input
                    placeholder="Last name"
                    value={row.lastName}
                    onChange={(e) => setRow(idx, { lastName: e.target.value })}
                    className="ipt"
                  />
                  <input
                    placeholder="Email"
                    type="email"
                    value={row.email}
                    onChange={(e) => setRow(idx, { email: e.target.value })}
                    className="ipt"
                  />
                  <input
                    placeholder="Phone"
                    value={row.phone}
                    onChange={(e) => setRow(idx, { phone: e.target.value })}
                    className="ipt"
                  />
                  <input
                    placeholder="Date (YYYY-MM-DD)"
                    value={row.date}
                    onChange={(e) => setRow(idx, { date: e.target.value })}
                    className="ipt"
                  />
                  <input
                    placeholder="Notes"
                    value={row.notes}
                    onChange={(e) => setRow(idx, { notes: e.target.value })}
                    className="ipt"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setShowConfirm(true)}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-ink-foreground transition hover:bg-lime hover:text-lime-foreground disabled:opacity-60"
        >
          Submit Data Entry <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <ConfirmModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          void submit();
        }}
        submitting={submitting}
      />
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      <SharedStyles />
    </section>
  );
}

function QualityAssuranceAssessment({ token }: { token: string }) {
  const { name, email, startedAt, finish } = useAssessment();
  const [text, setText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const seconds = useCountdown(DATA_ENTRY_SECONDS, () => {
    void submit();
  });

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await submitAssessment({
        data: {
          token,
          name,
          email,
          timeTakenSeconds: startedAt ? Math.round((Date.now() - startedAt) / 1000) : null,
          kind: "qa",
          payload: {
            prompt:
              "The transcription below contains deliberate errors. Identify and correct every error you find. Rewrite the corrected version.",
            corrected: text,
          },
        },
      });
      finish();
    } catch (e: any) {
      setError(e?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container-page max-w-5xl py-8 md:py-12">
      <div className="mb-4 flex items-center justify-between">
        <ProgressSteps step={2} />
        <TimerPill seconds={seconds} />
      </div>

      <div className="rounded-3xl border border-ink/10 bg-card p-6 shadow-sm md:p-8">
        <h2 className="text-2xl font-medium text-ink md:text-3xl">Quality Assurance Review</h2>
        <p className="mt-3 text-sm text-ink/65">
          The transcription below contains deliberate errors. Identify and correct every error you find. Rewrite the corrected version in the text area below.
        </p>
        <div className="mt-5 rounded-2xl border border-ink/10 bg-cream p-5 text-sm text-ink/75">
          <p className="font-medium text-ink">Text with errors (sample)</p>
          <p className="mt-2">
            Worknesta recieve applications every day. Our team review them carefully and respond within 2-3 buisness days.
          </p>
        </div>
        <label className="mt-5 block text-sm font-medium text-ink">Corrected version</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="mt-2 w-full rounded-2xl border border-ink/10 bg-cream p-4 text-sm text-ink outline-none focus:border-ink focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--lime)_50%,transparent)]"
          placeholder="Rewrite the corrected version here..."
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setShowConfirm(true)}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-ink-foreground transition hover:bg-lime hover:text-lime-foreground disabled:opacity-60"
        >
          Submit Review <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <ConfirmModal
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          void submit();
        }}
        submitting={submitting}
      />
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      <SharedStyles />
    </section>
  );
}

function Loading() {
  return (
    <section className="container-page flex min-h-[60vh] items-center justify-center py-16">
      <div className="text-sm text-ink/60">Loading…</div>
    </section>
  );
}

function ConfirmModal({
  open,
  onCancel,
  onConfirm,
  submitting,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-ink/10 bg-card p-6 shadow-xl"
          >
            <h3 className="text-xl font-medium text-ink">Submit your assessment?</h3>
            <p className="mt-2 text-sm text-ink/65">
              Are you sure you want to submit? You cannot make changes after submission.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onCancel}
                disabled={submitting}
                className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:bg-ink/5 disabled:opacity-50"
              >
                Keep Editing
              </button>
              <button
                onClick={onConfirm}
                disabled={submitting}
                className="rounded-full bg-lime px-4 py-2 text-sm font-medium text-lime-foreground hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Confirm & Submit"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Complete({ role }: { role: Role }) {
  const { name } = useAssessment();
  const display = name || "there";
  const headline =
    role === "transcription" ? "Transcription Submitted" : "Data Entry Submitted";
  return (
    <section className="container-page max-w-2xl py-16">
      <div className="rounded-3xl border border-ink/10 bg-card p-10 text-center shadow-xl">
        <Logo />
        <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-lime text-ink">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <p className="mt-5 font-script text-2xl text-ink/55">all done ✓</p>
        <h1 className="mt-1 text-4xl font-medium text-ink md:text-5xl">
          {headline} <span className="font-serif italic">— thank you!</span> ✅
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-ink/70">
          Thank you {display}. Our team will carefully review your submission and be in touch
          within 24–48 hours with your next steps.
        </p>
      </div>
    </section>
  );
}

function SharedStyles() {
  return (
    <style>{`
      .ipt { width:100%; border-radius:.875rem; border:1px solid var(--border); background:var(--cream); padding:.65rem .875rem; font-size:.875rem; color:var(--ink); outline:none; }
      .ipt:focus { border-color: var(--ink); box-shadow: 0 0 0 3px color-mix(in oklab, var(--lime) 50%, transparent); }
    `}</style>
  );
}
