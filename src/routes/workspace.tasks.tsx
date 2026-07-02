import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Headphones,
  Lock,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Send,
  ArrowUpRight,
} from "lucide-react";
import { OrgShell, OrgShellLoading } from "@/components/workspace/OrgShell";
import { getWorkspaceBySession } from "@/lib/server/actions";

export const Route = createFileRoute("/workspace/tasks")({
  head: () => ({ meta: [{ title: "Tasks — Worknesta Workspace" }] }),
  component: TasksPage,
});

// ─── Task definitions ──────────────────────────────────────────────────────────
const RATE = 24.5;
function earn(min: number) {
  return parseFloat(((RATE * min) / 60).toFixed(2));
}

interface TaskDef {
  id: string;
  num: number;
  durationMin: number;
  group: 1 | 2 | 3 | 4;
  type: "short" | "long";
  title: string;
  description: string;
  earningsUsd: number;
}

const TASKS: TaskDef[] = [
  { id: "t01", num: 1,  durationMin: 8,   group: 1, type: "short", title: "Client Interview — Part 1",        description: "Transcribe a recorded client intake interview. Focus on speaker clarity and accurate terminology.", earningsUsd: earn(8)   },
  { id: "t02", num: 2,  durationMin: 15,  group: 1, type: "short", title: "Team Standup Recording",           description: "Brief meeting with multiple speakers. Label each as Speaker A, B, etc.", earningsUsd: earn(15)  },
  { id: "t03", num: 3,  durationMin: 22,  group: 1, type: "short", title: "Product Feedback Session",         description: "User feedback recording with occasional background noise. Flag inaudible sections with [inaudible].", earningsUsd: earn(22)  },
  { id: "t04", num: 4,  durationMin: 12,  group: 2, type: "short", title: "Sales Call Excerpt",               description: "Single-speaker sales presentation. Accurate product name transcription is critical.", earningsUsd: earn(12)  },
  { id: "t05", num: 5,  durationMin: 25,  group: 2, type: "short", title: "HR Policy Briefing",               description: "Formal HR audio briefing. Legal and policy terminology must be transcribed exactly as spoken.", earningsUsd: earn(25)  },
  { id: "t06", num: 6,  durationMin: 18,  group: 2, type: "short", title: "Medical Consultation Notes",       description: "Medical consultation recording. Use standard medical terminology and flag unclear pronunciations.", earningsUsd: earn(18)  },
  { id: "t07", num: 7,  durationMin: 30,  group: 3, type: "short", title: "Executive Panel Q&A",              description: "Multi-speaker panel discussion with audience questions. Label each speaker and add timestamps every 2 minutes.", earningsUsd: earn(30)  },
  { id: "t08", num: 8,  durationMin: 130, group: 3, type: "long",  title: "Full Conference Session A",        description: "2+ hour conference recording. Timestamps every 5 minutes required. Multiple speakers.", earningsUsd: earn(130) },
  { id: "t09", num: 9,  durationMin: 150, group: 3, type: "long",  title: "Legal Deposition Recording",       description: "Long-form legal deposition. Strict verbatim accuracy including false starts and filler words.", earningsUsd: earn(150) },
  { id: "t10", num: 10, durationMin: 180, group: 4, type: "long",  title: "Documentary Interview — Full",     description: "3-hour documentary subject interview. Clean transcription style, omit filler words unless character-relevant.", earningsUsd: earn(180) },
];

function fmtDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Local progress store (localStorage) ──────────────────────────────────────
type TaskStatus = "locked" | "available" | "in_progress" | "submitted" | "reviewed";
type LocalProgress = Record<string, { status: TaskStatus; text?: string; submittedAt?: string }>;

function storageKey(appId: string) {
  return `wn_task_progress_${appId}`;
}
function loadProgress(appId: string): LocalProgress {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(storageKey(appId)) ?? "{}") as LocalProgress;
  } catch {
    return {};
  }
}
function saveProgress(appId: string, p: LocalProgress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(appId), JSON.stringify(p));
}

function computeEffectiveStatus(
  task: TaskDef,
  raw: LocalProgress,
  contractSubmitted: boolean,
): TaskStatus {
  // Hard lock everything if onboarding contract is not yet complete
  if (!contractSubmitted) return "locked";

  const stored = raw[task.id]?.status;
  if (stored === "submitted" || stored === "reviewed") return stored;

  // Compute lock based on group progression
  if (task.group === 1) return stored ?? "available";
  const prevGroup = (task.group - 1) as 1 | 2 | 3;
  const prevGroupTasks = TASKS.filter((t) => t.group === prevGroup);
  const allPrevDone = prevGroupTasks.every(
    (t) => raw[t.id]?.status === "submitted" || raw[t.id]?.status === "reviewed",
  );
  if (!allPrevDone) return "locked";
  return stored ?? "available";
}

// ─── Audio Player component ────────────────────────────────────────────────────
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function AudioPlayer({ durationMin }: { durationMin: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(2); // default 1×

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { void el.play().catch(() => {}); setPlaying(true); }
  }

  function restart() {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    setCurrentTime(0);
    setProgress(0);
    if (!playing) { void el.play().catch(() => {}); setPlaying(true); }
  }

  function skipBack() {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, el.currentTime - 10);
  }

  function skipForward() {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.min(el.duration || 0, el.currentTime + 10);
  }

  function cycleSpeed() {
    const el = audioRef.current;
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (el) el.playbackRate = SPEEDS[next];
  }

  function onTimeUpdate() {
    const el = audioRef.current;
    if (!el) return;
    setCurrentTime(el.currentTime);
    setProgress(el.duration > 0 ? (el.currentTime / el.duration) * 100 : 0);
  }

  function onLoadedMetadata() {
    const el = audioRef.current;
    if (el) setDuration(el.duration);
  }

  function onEnded() {
    setPlaying(false);
    setProgress(100);
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    const pct = Number(e.target.value);
    el.currentTime = (pct / 100) * el.duration;
    setProgress(pct);
  }

  function fmt(s: number) {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  const displayDuration = duration > 0 ? fmt(duration) : fmtDuration(durationMin);

  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1015] p-4 space-y-3">
      <audio
        ref={audioRef}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
      />

      {/* Progress bar */}
      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={progress}
          onChange={seek}
          className="w-full accent-lime h-1.5 cursor-pointer rounded-full"
        />
        <div className="flex justify-between text-[11px] text-slate-500">
          <span>{fmt(currentTime)}</span>
          <span>{displayDuration}</span>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Replay from start */}
          <button
            onClick={restart}
            title="Restart from beginning"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* Skip back 10s */}
          <button
            onClick={skipBack}
            title="Back 10 seconds"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={toggle}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-lime text-ink hover:opacity-90 transition"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>

          {/* Skip forward 10s */}
          <button
            onClick={skipForward}
            title="Forward 10 seconds"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        {/* Playback speed */}
        <button
          onClick={cycleSpeed}
          title="Change playback speed"
          className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-white/10 transition"
        >
          {SPEEDS[speedIdx]}×
        </button>
      </div>

      <p className="text-[11px] text-slate-500 italic">
        Audio loads when your queue opens. Use ← 10 s / → 10 s to navigate.
      </p>
    </div>
  );
}

// ─── Task card ────────────────────────────────────────────────────────────────
function TaskCard({
  task,
  status,
  text,
  onSubmit,
}: {
  task: TaskDef;
  status: TaskStatus;
  text?: string;
  onSubmit: (id: string, text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(text ?? "");
  const [submitting, setSubmitting] = useState(false);

  const statusColors: Record<TaskStatus, string> = {
    locked: "border-white/5 bg-white/3",
    available: "border-white/10 bg-white/5",
    in_progress: "border-sky-500/20 bg-sky-500/5",
    submitted: "border-emerald-500/20 bg-emerald-500/5",
    reviewed: "border-lime/20 bg-lime/5",
  };
  const badgeColors: Record<TaskStatus, string> = {
    locked: "text-slate-600 bg-white/5",
    available: "text-sky-300 bg-sky-500/10",
    in_progress: "text-sky-300 bg-sky-500/10",
    submitted: "text-emerald-300 bg-emerald-500/10",
    reviewed: "text-lime bg-lime/10",
  };
  const badgeLabel: Record<TaskStatus, string> = {
    locked: "Locked",
    available: "Available",
    in_progress: "In progress",
    submitted: "Submitted",
    reviewed: "Reviewed",
  };

  async function handleSubmit() {
    if (!draft.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(task.id, draft.trim());
    } finally {
      setSubmitting(false);
      setOpen(false);
    }
  }

  return (
    <div className={`rounded-2xl border p-4 transition ${statusColors[status]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-300">
            {task.num}
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-medium ${status === "locked" ? "text-slate-600" : "text-white"}`}>
              {task.title}
            </p>
            {status !== "locked" && (
              <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{task.description}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeColors[status]}`}>
            {badgeLabel[status]}
          </span>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {fmtDuration(task.durationMin)}
            </span>
            <span className="flex items-center gap-1 text-lime">
              <DollarSign className="h-3 w-3" />
              ${task.earningsUsd.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {status === "locked" && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
          <Lock className="h-3.5 w-3.5" />
          Complete the previous group to unlock
        </div>
      )}

      {(status === "available" || status === "in_progress") && (
        <div className="mt-3">
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-lime/10 px-3 py-1.5 text-xs font-medium text-lime hover:bg-lime/20 transition"
          >
            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {open ? "Collapse" : "Start task"}
          </button>
        </div>
      )}

      {(status === "submitted" || status === "reviewed") && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {status === "reviewed" ? "Reviewed — payment processed" : "Submitted — awaiting review"}
        </div>
      )}

      {open && (status === "available" || status === "in_progress") && (
        <div className="mt-4 space-y-4">
          <AudioPlayer durationMin={task.durationMin} />
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Your transcription
            </label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={8}
              placeholder="Type your transcription here. Use [inaudible] for unclear audio. Label speakers as Speaker A, B, etc."
              className="w-full rounded-xl border border-white/10 bg-[#0b1015] p-3 text-sm text-white placeholder-slate-600 focus:border-lime/50 focus:outline-none focus:ring-1 focus:ring-lime/30 resize-y"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {draft.trim().length} characters · ${task.earningsUsd.toFixed(2)} earned on submit
            </p>
            <button
              onClick={() => void handleSubmit()}
              disabled={!draft.trim() || submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit transcription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
type SessionState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "ready"; candidateName: string; roleTitle: string; contractSubmitted: boolean; applicationId: string };

const GROUPS: { group: 1 | 2 | 3 | 4; label: string }[] = [
  { group: 1, label: "Group 1 — Getting started" },
  { group: 2, label: "Group 2 — Intermediate tasks" },
  { group: 3, label: "Group 3 — Advanced transcription" },
  { group: 4, label: "Group 4 — Long-form mastery" },
];

function TasksPage() {
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const [progress, setProgress] = useState<LocalProgress>({});

  useEffect(() => {
    void (async () => {
      try {
        const s = await getWorkspaceBySession();
        if (!s.authenticated) {
          setSession({ status: "unauthenticated" });
          return;
        }
        setSession({
          status: "ready",
          candidateName: s.candidateName,
          roleTitle: s.roleTitle,
          contractSubmitted: s.contractSubmitted,
          applicationId: s.applicationId,
        });
        setProgress(loadProgress(s.applicationId));
      } catch {
        setSession({ status: "unauthenticated" });
      }
    })();
  }, []);

  if (session.status === "loading") return <OrgShellLoading activeNav="tasks" />;
  if (session.status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1419]">
        <div className="text-center">
          <p className="text-slate-400">Session expired.</p>
          <Link to="/workspace/signin" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-lime px-4 py-2 text-sm font-medium text-ink">
            Sign in <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const { candidateName, roleTitle, contractSubmitted, applicationId } = session;

  async function handleSubmit(taskId: string, text: string) {
    const task = TASKS.find((t) => t.id === taskId);
    if (!task) return;
    const updated = {
      ...progress,
      [taskId]: { status: "submitted" as TaskStatus, text, submittedAt: new Date().toISOString() },
    };
    setProgress(updated);
    saveProgress(applicationId, updated);

    // Best-effort DB sync
    try {
      const { submitTranscriptionTask } = await import("@/lib/server/actions");
      await submitTranscriptionTask({
        data: { taskId, transcriptionText: text, earningsUsd: task.earningsUsd },
      });
    } catch {
      // Silently continue — localStorage already updated
    }
  }

  const totalEarned = TASKS.reduce((sum, t) => {
    const s = computeEffectiveStatus(t, progress, contractSubmitted);
    return s === "submitted" || s === "reviewed" ? sum + t.earningsUsd : sum;
  }, 0);
  const submittedCount = TASKS.filter((t) => {
    const s = computeEffectiveStatus(t, progress, contractSubmitted);
    return s === "submitted" || s === "reviewed";
  }).length;

  return (
    <OrgShell candidateName={candidateName} roleTitle={roleTitle} activeNav="tasks">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Module 1 · Transcription tasks
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Tasks available</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                10 transcription tasks split into 4 groups. Complete each group of 3 to unlock
                the next. Tasks 8–10 are long-form (2–3 hrs) — save them for a focused session.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="rounded-xl border border-lime/20 bg-lime/10 px-4 py-2 text-center">
                <p className="text-xs text-slate-400">Earned so far</p>
                <p className="text-lg font-semibold text-lime">${totalEarned.toFixed(2)}</p>
              </div>
              <p className="text-xs text-slate-500">{submittedCount}/10 submitted</p>
            </div>
          </div>
        </div>

        {!contractSubmitted && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <p className="text-sm text-amber-200">
              Complete your{" "}
              <Link to="/onboarding/workspace-setup" className="underline">
                workspace setup
              </Link>{" "}
              to unlock tasks.
            </p>
          </div>
        )}

        {/* Groups */}
        {GROUPS.map(({ group, label }) => {
          const groupTasks = TASKS.filter((t) => t.group === group);
          const firstTask = groupTasks[0];
          const groupStatus = computeEffectiveStatus(firstTask, progress, contractSubmitted);
          const isGroupLocked = groupStatus === "locked";

          return (
            <section key={group}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                  {isGroupLocked && <Lock className="h-3.5 w-3.5 text-slate-500" />}
                  {!isGroupLocked && <Headphones className="h-3.5 w-3.5 text-lime" />}
                  {label}
                </h2>
                <span className="text-xs text-slate-500">
                  {groupTasks.filter((t) => {
                    const s = computeEffectiveStatus(t, progress, contractSubmitted);
                    return s === "submitted" || s === "reviewed";
                  }).length}
                  /{groupTasks.length} done
                </span>
              </div>
              <div className="space-y-3">
                {groupTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    status={computeEffectiveStatus(task, progress, contractSubmitted)}
                    text={progress[task.id]?.text}
                    onSubmit={handleSubmit}
                  />
                ))}
              </div>
            </section>
          );
        })}

        <div className="rounded-2xl border border-white/5 bg-white/3 px-5 py-4 text-xs text-slate-500">
          Task progress is saved in this browser. Payment is processed on the 1st and 15th of each month after your transcriptions are reviewed.
        </div>
      </div>
    </OrgShell>
  );
}
