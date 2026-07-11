import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
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
  Timer,
  ShieldCheck,
} from "lucide-react";
import { OrgShell, OrgShellLoading } from "@/components/workspace/OrgShell";
import { getWorkspaceBySession, getTaskProgressBySession } from "@/lib/server/actions";
import { getSessionData } from "@/lib/client/supabase";

export const Route = createFileRoute("/workspace/tasks")({
  head: () => ({ meta: [{ title: "Tasks — Worknesta Workspace" }] }),
  component: TasksPage,
});

// ─── Constants ─────────────────────────────────────────────────────────────────
const RATE = 24.5;
function earn(min: number) {
  return parseFloat(((RATE * min) / 60).toFixed(2));
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type TaskCategory = "general" | "medical";
type TaskStatus = "locked" | "available" | "in_progress" | "submitted" | "reviewed";
type LocalProgress = Record<string, { status: TaskStatus; text?: string; submittedAt?: string }>;

interface TaskDef {
  id: string;
  num: number;
  module: 1 | 2 | 3 | 4;
  category: TaskCategory;
  durationMin: number;
  title: string;
  description: string;
  earningsUsd: number;
}

interface ModuleDef {
  num: 1 | 2 | 3 | 4;
  label: string;
  subtitle: string;
  deadlineHours: number;
}

interface ModuleMeta {
  deadlineIso: string;
  reservedAt?: string;
}

// ─── Module definitions ────────────────────────────────────────────────────────
const MODULES: ModuleDef[] = [
  { num: 1, label: "Module 1", subtitle: "Foundation Transcription",   deadlineHours: 72 },
  { num: 2, label: "Module 2", subtitle: "Intermediate Tasks",         deadlineHours: 48 },
  { num: 3, label: "Module 3", subtitle: "Advanced Transcription",     deadlineHours: 48 },
  { num: 4, label: "Module 4", subtitle: "Long-Form Mastery",          deadlineHours: 36 },
];

// ─── Task definitions ──────────────────────────────────────────────────────────
// Module 1: 10 tasks — first 7 general, last 3 medical
// Module 2: 7 tasks  — first 5 general, last 2 medical
// Module 3: 7 tasks  — first 4 general, last 3 medical
// Module 4: 6 tasks  — first 4 general, last 2 medical
const TASKS: TaskDef[] = [
  // ── Module 1: Foundation (7 general + 3 medical) ─────────────────────────────
  { id: "m1t01", num:  1, module: 1, category: "general", durationMin:  8, title: "Client Interview — Part 1",      description: "Transcribe a recorded client intake interview. Focus on speaker clarity and accurate terminology.",                        earningsUsd: earn(8)   },
  { id: "m1t02", num:  2, module: 1, category: "general", durationMin: 15, title: "Team Standup Recording",          description: "Brief meeting with multiple speakers. Label each as Speaker A, B, etc.",                                              earningsUsd: earn(15)  },
  { id: "m1t03", num:  3, module: 1, category: "general", durationMin: 22, title: "Product Feedback Session",        description: "User feedback recording with occasional background noise. Flag inaudible sections with [inaudible].",                  earningsUsd: earn(22)  },
  { id: "m1t04", num:  4, module: 1, category: "general", durationMin: 12, title: "Sales Call Excerpt",              description: "Single-speaker sales presentation. Accurate product name transcription is critical.",                                  earningsUsd: earn(12)  },
  { id: "m1t05", num:  5, module: 1, category: "general", durationMin: 25, title: "HR Policy Briefing",              description: "Formal HR audio briefing. Legal and policy terminology must be transcribed exactly as spoken.",                        earningsUsd: earn(25)  },
  { id: "m1t06", num:  6, module: 1, category: "general", durationMin: 16, title: "Customer Support Call",           description: "Customer support interaction. Transcribe both agent and customer, noting hold music as [on hold].",                    earningsUsd: earn(16)  },
  { id: "m1t07", num:  7, module: 1, category: "general", durationMin: 28, title: "Webinar Segment — Q&A Block",    description: "Live webinar Q&A with host and multiple audience questions. Each question speaker should be labeled.",                  earningsUsd: earn(28)  },
  { id: "m1t08", num:  8, module: 1, category: "medical", durationMin: 20, title: "Medical Consultation Notes",      description: "Medical consultation recording. Use standard medical terminology and flag unclear pronunciations.",                      earningsUsd: earn(20)  },
  { id: "m1t09", num:  9, module: 1, category: "medical", durationMin: 28, title: "Patient Intake Interview",        description: "Patient history intake with nurse and patient. Transcribe verbatim, noting patient discomfort pauses as [pause].",     earningsUsd: earn(28)  },
  { id: "m1t10", num: 10, module: 1, category: "medical", durationMin: 15, title: "Radiology Report Dictation",      description: "Radiologist dictating imaging findings. Accurate anatomical and radiological terminology required.",                     earningsUsd: earn(15)  },

  // ── Module 2: Intermediate (5 general + 2 medical) ────────────────────────────
  { id: "m2t01", num:  1, module: 2, category: "general", durationMin: 30, title: "Executive Panel Q&A",             description: "Multi-speaker panel with audience questions. Add timestamps every 2 minutes, label each panelist.",                     earningsUsd: earn(30)  },
  { id: "m2t02", num:  2, module: 2, category: "general", durationMin: 45, title: "Training Workshop Recording",     description: "Corporate training session with slides referenced by speaker. Include [slide change] markers where audible.",          earningsUsd: earn(45)  },
  { id: "m2t03", num:  3, module: 2, category: "general", durationMin: 35, title: "Investor Pitch Presentation",     description: "Startup pitch to investors. Accurate financial figures and product names are critical. No filler words.",               earningsUsd: earn(35)  },
  { id: "m2t04", num:  4, module: 2, category: "general", durationMin: 40, title: "Podcast Interview Segment",       description: "Conversational podcast with two hosts and a guest. Clean read transcription — omit filler words.",                     earningsUsd: earn(40)  },
  { id: "m2t05", num:  5, module: 2, category: "general", durationMin: 28, title: "Performance Review Meeting",      description: "Manager/employee review session. Confidential tone. Transcribe verbatim including all pauses and corrections.",        earningsUsd: earn(28)  },
  { id: "m2t06", num:  6, module: 2, category: "medical", durationMin: 35, title: "Clinical Case Discussion",        description: "Multidisciplinary team discussing a patient case. Label each clinician by role (Radiologist, Oncologist, etc.).",      earningsUsd: earn(35)  },
  { id: "m2t07", num:  7, module: 2, category: "medical", durationMin: 40, title: "Surgical Prep Briefing",          description: "Pre-operative team briefing. Transcribe surgeon instructions and safety checklist items exactly.",                      earningsUsd: earn(40)  },

  // ── Module 3: Advanced (4 general + 3 medical) ────────────────────────────────
  { id: "m3t01", num:  1, module: 3, category: "general", durationMin: 55, title: "Legal Deposition Excerpt",        description: "Long-form legal deposition. Strict verbatim accuracy including false starts, filler words, and corrections.",          earningsUsd: earn(55)  },
  { id: "m3t02", num:  2, module: 3, category: "general", durationMin: 60, title: "Academic Conference Talk",        description: "Research presentation with Q&A. Include applause notation [applause] and timestamps every 5 minutes.",               earningsUsd: earn(60)  },
  { id: "m3t03", num:  3, module: 3, category: "general", durationMin: 50, title: "Documentary Interview Segment",   description: "Filmed interview with cinematic pauses. Clean transcription style — omit filler words unless character-relevant.",    earningsUsd: earn(50)  },
  { id: "m3t04", num:  4, module: 3, category: "general", durationMin: 65, title: "Technical Seminar Recording",     description: "Engineering seminar with heavy jargon. Flag domain-specific acronyms you cannot verify with [?term].",              earningsUsd: earn(65)  },
  { id: "m3t05", num:  5, module: 3, category: "medical", durationMin: 50, title: "Psychiatric Evaluation Notes",    description: "Clinician-patient psychiatric session. Transcribe verbatim. Label speaker turns precisely.",                           earningsUsd: earn(50)  },
  { id: "m3t06", num:  6, module: 3, category: "medical", durationMin: 55, title: "Cardiology Consultation",         description: "Cardiologist reviewing test results with a patient. Accurate cardiac terminology and medication names required.",      earningsUsd: earn(55)  },
  { id: "m3t07", num:  7, module: 3, category: "medical", durationMin: 45, title: "ER Triage Documentation",         description: "Emergency room triage recordings across 3 cases. Label each case separately and flag critical time references.",        earningsUsd: earn(45)  },

  // ── Module 4: Long-Form Mastery (4 general + 2 medical) ──────────────────────
  { id: "m4t01", num:  1, module: 4, category: "general", durationMin: 130, title: "Full Conference Session A",      description: "2+ hour conference recording. Timestamps every 5 minutes required. Multiple speakers — label all.",                    earningsUsd: earn(130) },
  { id: "m4t02", num:  2, module: 4, category: "general", durationMin: 110, title: "Town Hall Meeting — Full",       description: "Company-wide town hall with exec Q&A. Separate each segment with a section heading and timestamp.",                  earningsUsd: earn(110) },
  { id: "m4t03", num:  3, module: 4, category: "general", durationMin: 150, title: "Full Conference Session B",      description: "Follow-on conference session, multiple breakout discussions. Timestamps and section labels every 5 minutes.",         earningsUsd: earn(150) },
  { id: "m4t04", num:  4, module: 4, category: "general", durationMin: 180, title: "Documentary Interview — Full",   description: "3-hour documentary subject interview. Clean transcription style, omit filler unless character-relevant.",             earningsUsd: earn(180) },
  { id: "m4t05", num:  5, module: 4, category: "medical", durationMin: 120, title: "Oncology Team Meeting",          description: "Full oncology multidisciplinary meeting. Label each specialist, flag all medication names and dosages exactly.",     earningsUsd: earn(120) },
  { id: "m4t06", num:  6, module: 4, category: "medical", durationMin: 140, title: "Neurology Grand Rounds",         description: "Full neurology grand rounds session. Complex terminology — use [?term] for uncertain words. Timestamps every 5 min.", earningsUsd: earn(140) },
];

// ─── Storage helpers ───────────────────────────────────────────────────────────
function progressKey(appId: string)    { return `wn_task_progress_${appId}`; }
function moduleMetaKey(appId: string)  { return `wn_module_meta_${appId}`; }

function loadProgress(appId: string): LocalProgress {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(progressKey(appId)) ?? "{}") as LocalProgress; }
  catch { return {}; }
}
function saveProgress(appId: string, p: LocalProgress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(progressKey(appId), JSON.stringify(p));
}
function loadModuleMeta(appId: string): Record<string, ModuleMeta> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(moduleMetaKey(appId)) ?? "{}") as Record<string, ModuleMeta>; }
  catch { return {}; }
}
function saveModuleMeta(appId: string, m: Record<string, ModuleMeta>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(moduleMetaKey(appId), JSON.stringify(m));
}

// ─── Status helpers ────────────────────────────────────────────────────────────
function isModuleAvailable(moduleNum: number, progress: LocalProgress, _contractSubmitted: boolean): boolean {
  if (moduleNum === 1) return true;
  const prevTasks = TASKS.filter((t) => t.module === (moduleNum - 1) as 1 | 2 | 3 | 4);
  return prevTasks.every((t) => {
    const s = progress[t.id]?.status;
    return s === "submitted" || s === "reviewed";
  });
}

function computeEffectiveStatus(task: TaskDef, progress: LocalProgress, contractSubmitted: boolean): TaskStatus {
  const stored = progress[task.id]?.status;
  if (stored === "submitted" || stored === "reviewed") return stored;
  if (!isModuleAvailable(task.module, progress, contractSubmitted)) return "locked";
  return stored ?? "available";
}

function fmtDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Countdown timer ───────────────────────────────────────────────────────────
function CountdownTimer({ deadline, className = "" }: { deadline: Date; className?: string }) {
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setMs(Math.max(0, deadline.getTime() - Date.now()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (ms === null) return null;

  if (ms === 0) {
    return <span className={`font-mono text-xs font-semibold text-red-400 ${className}`}>Deadline passed</span>;
  }

  const totalSecs = Math.floor(ms / 1000);
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;

  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  if (d === 0 && h === 0) parts.push(`${s}s`);

  const isUrgent = ms < 6 * 60 * 60 * 1000;
  const color = isUrgent ? "text-red-400" : ms < 24 * 60 * 60 * 1000 ? "text-amber-400" : "text-sky-300";

  return (
    <span className={`font-mono text-xs font-semibold ${color} ${className}`}>
      {parts.join(" ")}
    </span>
  );
}

// ─── Audio Player ──────────────────────────────────────────────────────────────
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function AudioPlayer({ durationMin }: { durationMin: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(2);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { void el.play().catch(() => {}); setPlaying(true); }
  }
  function restart() {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0; setCurrentTime(0); setProgress(0);
    if (!playing) { void el.play().catch(() => {}); setPlaying(true); }
  }
  function skipBack()    { const el = audioRef.current; if (el) el.currentTime = Math.max(0, el.currentTime - 10); }
  function skipForward() { const el = audioRef.current; if (el) el.currentTime = Math.min(el.duration || 0, el.currentTime + 10); }
  function cycleSpeed()  {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
  }
  function onTimeUpdate() {
    const el = audioRef.current;
    if (!el) return;
    setCurrentTime(el.currentTime);
    setProgress(el.duration > 0 ? (el.currentTime / el.duration) * 100 : 0);
  }
  function onLoadedMetadata() { const el = audioRef.current; if (el) setDuration(el.duration); }
  function onEnded()          { setPlaying(false); setProgress(100); }
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
      <audio ref={audioRef} onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoadedMetadata} onEnded={onEnded} />
      <div className="space-y-1">
        <input type="range" min={0} max={100} step={0.1} value={progress} onChange={seek}
          className="w-full accent-lime h-1.5 cursor-pointer rounded-full" />
        <div className="flex justify-between text-[11px] text-slate-500">
          <span>{fmt(currentTime)}</span>
          <span>{displayDuration}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button onClick={restart} title="Restart" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button onClick={skipBack} title="Back 10s" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition">
            <SkipBack className="h-4 w-4" />
          </button>
          <button onClick={toggle} className="flex h-10 w-10 items-center justify-center rounded-full bg-lime text-ink hover:opacity-90 transition" aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
          <button onClick={skipForward} title="Forward 10s" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition">
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
        <button onClick={cycleSpeed} title="Playback speed"
          className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-white/10 transition">
          {SPEEDS[speedIdx]}×
        </button>
      </div>
      <p className="text-[11px] text-slate-500 italic">Audio loads when your queue opens. Use ← 10 s / → 10 s to navigate.</p>
    </div>
  );
}

// ─── Category badge ────────────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: TaskCategory }) {
  if (category === "medical") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-400">
        <Activity className="h-2.5 w-2.5" /> Medical
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-400">
      <Headphones className="h-2.5 w-2.5" /> General
    </span>
  );
}

// ─── Task card ────────────────────────────────────────────────────────────────
function TaskCard({
  task, status, text, onSubmit,
}: {
  task: TaskDef; status: TaskStatus; text?: string;
  onSubmit: (id: string, text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(text ?? "");
  const [submitting, setSubmitting] = useState(false);

  const cardColors: Record<TaskStatus, string> = {
    locked:      "border-white/5 bg-white/[0.02]",
    available:   "border-white/10 bg-white/5",
    in_progress: "border-sky-500/20 bg-sky-500/5",
    submitted:   "border-emerald-500/20 bg-emerald-500/5",
    reviewed:    "border-lime/20 bg-lime/5",
  };
  const badgeColors: Record<TaskStatus, string> = {
    locked:      "text-slate-600 bg-white/5",
    available:   "text-sky-300 bg-sky-500/10",
    in_progress: "text-sky-300 bg-sky-500/10",
    submitted:   "text-emerald-300 bg-emerald-500/10",
    reviewed:    "text-lime bg-lime/10",
  };
  const badgeLabel: Record<TaskStatus, string> = {
    locked: "Locked", available: "Available", in_progress: "In progress",
    submitted: "Submitted", reviewed: "Reviewed",
  };

  async function handleSubmit() {
    if (!draft.trim() || submitting) return;
    setSubmitting(true);
    try { await onSubmit(task.id, draft.trim()); }
    finally { setSubmitting(false); setOpen(false); }
  }

  return (
    <div className={`rounded-2xl border p-4 transition ${cardColors[status]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-300">
            {task.num}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`text-sm font-medium ${status === "locked" ? "text-slate-600" : "text-white"}`}>
                {task.title}
              </p>
              {status !== "locked" && <CategoryBadge category={task.category} />}
            </div>
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
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtDuration(task.durationMin)}</span>
            <span className="flex items-center gap-1 text-lime"><DollarSign className="h-3 w-3" />${task.earningsUsd.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {status === "locked" && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
          <Lock className="h-3.5 w-3.5" />
          Complete the previous module to unlock
        </div>
      )}

      {(status === "available" || status === "in_progress") && (
        <div className="mt-3">
          <button onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-lime/10 px-3 py-1.5 text-xs font-medium text-lime hover:bg-lime/20 transition">
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
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Your transcription</label>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={8}
              placeholder="Type your transcription here. Use [inaudible] for unclear audio. Label speakers as Speaker A, B, etc."
              className="w-full rounded-xl border border-white/10 bg-[#0b1015] p-3 text-sm text-white placeholder-slate-600 focus:border-lime/50 focus:outline-none focus:ring-1 focus:ring-lime/30 resize-y" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">{draft.trim().length} characters · ${task.earningsUsd.toFixed(2)} earned on submit</p>
            <button onClick={() => void handleSubmit()} disabled={!draft.trim() || submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit transcription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Module header with timer ──────────────────────────────────────────────────
function ModuleHeader({
  mod, tasks, progress, contractSubmitted, meta, isOpen, onToggle, onReserve,
}: {
  mod: ModuleDef;
  tasks: TaskDef[];
  progress: LocalProgress;
  contractSubmitted: boolean;
  meta: ModuleMeta | undefined;
  isOpen: boolean;
  onToggle: () => void;
  onReserve: () => void;
}) {
  const available    = isModuleAvailable(mod.num, progress, contractSubmitted);
  const submittedCnt = tasks.filter((t) => { const s = progress[t.id]?.status; return s === "submitted" || s === "reviewed"; }).length;
  const isComplete   = submittedCnt === tasks.length;
  const isReserved   = !!meta?.reservedAt || tasks.some((t) => {
    const s = progress[t.id]?.status;
    return s === "in_progress" || s === "submitted" || s === "reviewed";
  });
  const deadline     = meta ? new Date(meta.deadlineIso) : null;
  const generalCnt   = tasks.filter((t) => t.category === "general").length;
  const medicalCnt   = tasks.filter((t) => t.category === "medical").length;

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${
      isComplete  ? "border-lime/20 bg-lime/5"
      : available ? "border-white/10 bg-white/5"
                  : "border-white/5 bg-white/[0.02]"
    }`}>
      <div
        className={`flex flex-wrap items-start justify-between gap-3 ${available ? "cursor-pointer select-none" : ""}`}
        onClick={available ? onToggle : undefined}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
            isComplete  ? "bg-lime text-ink"
            : available ? "bg-white/10 text-white"
                        : "bg-white/5 text-slate-600"
          }`}>
            {mod.num}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={`text-sm font-semibold ${available ? "text-white" : "text-slate-500"}`}>
                {mod.label} — {mod.subtitle}
              </h2>
              {isComplete && (
                <span className="inline-flex items-center gap-1 rounded-full bg-lime/10 px-2 py-0.5 text-[10px] font-semibold text-lime">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Complete
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {tasks.length} tasks · {generalCnt} general{medicalCnt > 0 ? ` + ${medicalCnt} medical` : ""}
              {" · "}${tasks.reduce((s, t) => s + t.earningsUsd, 0).toFixed(2)} total
            </p>
          </div>
        </div>

        {/* Right side: progress + timer + chevron */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {submittedCnt}/{tasks.length} submitted
            </span>
            {available && (
              isOpen
                ? <ChevronUp className="h-4 w-4 text-slate-400" />
                : <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </div>

          {available && !isComplete && deadline && (
            <div className="flex items-center gap-1.5">
              <Timer className="h-3 w-3 text-slate-500" />
              {isReserved ? (
                <span className="text-[11px] text-slate-500">
                  Complete by <CountdownTimer deadline={deadline} />
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">
                  Reserve by <CountdownTimer deadline={deadline} />
                </span>
              )}
            </div>
          )}

          {!available && (
            <span className="text-[11px] text-slate-600 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Complete prev. module
            </span>
          )}
        </div>
      </div>

      {/* Reserve button — shown when available, not yet reserved, not complete */}
      {available && !isComplete && !isReserved && deadline && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <button onClick={(e) => { e.stopPropagation(); onReserve(); }}
            className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition">
            <ShieldCheck className="h-3.5 w-3.5 text-lime" />
            Reserve this module slot
          </button>
          <p className="mt-1.5 text-[11px] text-slate-600">
            Reserving locks in your spot. Timer stops — work at your own pace.
          </p>
        </div>
      )}

      {available && !isComplete && isReserved && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-lime">
            <ShieldCheck className="h-3 w-3" /> Module reserved — tasks below are open
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

function TasksPage() {
  const [session, setSession]           = useState<SessionState>({ status: "loading" });
  const [progress, setProgress]         = useState<LocalProgress>({});
  const [moduleMeta, setModuleMeta]     = useState<Record<string, ModuleMeta>>({});
  const [openModules, setOpenModules]   = useState<Set<number>>(new Set([1, 2, 3, 4]));

  useEffect(() => {
    void (async () => {
      try {
        // Load session + DB task progress in parallel
        const { appId: sessionAppId, accessToken } = await getSessionData();
        const [s, dbResult] = await Promise.all([
          getWorkspaceBySession({ data: { clientAppId: sessionAppId, accessToken } }),
          getTaskProgressBySession({ data: { clientAppId: sessionAppId, accessToken } }).catch(() => ({ authenticated: false as const, tasks: [] })),
        ]);
        if (!s.authenticated) { setSession({ status: "unauthenticated" }); return; }
        const appId = s.applicationId; // validated string from server
        setSession({ status: "ready", candidateName: s.candidateName, roleTitle: s.roleTitle, contractSubmitted: s.contractSubmitted, applicationId: appId });

        // Start with localStorage, then overwrite with authoritative DB records
        const prog = loadProgress(appId);
        if (dbResult.authenticated && dbResult.tasks.length > 0) {
          for (const t of dbResult.tasks) {
            if (t.status === "submitted" || t.status === "reviewed") {
              prog[t.task_id] = {
                status: t.status as TaskStatus,
                text: t.transcription_text ?? undefined,
                submittedAt: t.submitted_at ?? undefined,
              };
            }
          }
          saveProgress(appId, prog); // keep localStorage in sync with DB
        }

        const meta = loadModuleMeta(appId);
        let changed = false;

        // Set deadline for newly-available modules
        for (const mod of MODULES) {
          const key = String(mod.num);
          if (!meta[key] && isModuleAvailable(mod.num, prog, s.contractSubmitted)) {
            const dl = new Date();
            dl.setHours(dl.getHours() + mod.deadlineHours);
            meta[key] = { deadlineIso: dl.toISOString() };
            changed = true;
          }
        }
        if (changed) saveModuleMeta(appId, meta);

        setProgress(prog);
        setModuleMeta(meta);
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

  function toggleModule(num: number) {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num); else next.add(num);
      return next;
    });
  }

  function handleReserve(moduleNum: number) {
    const key     = String(moduleNum);
    const updated = { ...moduleMeta, [key]: { ...moduleMeta[key], reservedAt: new Date().toISOString() } } as Record<string, ModuleMeta>;
    setModuleMeta(updated);
    saveModuleMeta(applicationId, updated);
  }

  async function handleSubmit(taskId: string, text: string) {
    const task = TASKS.find((t) => t.id === taskId);
    if (!task) return;
    const updated: LocalProgress = {
      ...progress,
      [taskId]: { status: "submitted" as TaskStatus, text, submittedAt: new Date().toISOString() },
    };
    setProgress(updated);
    saveProgress(applicationId, updated);

    // Check if the next module just unlocked — set its deadline
    const nextModNum  = task.module + 1;
    const nextMod     = MODULES.find((m) => m.num === nextModNum);
    const nextKey     = String(nextModNum);
    if (nextMod && !moduleMeta[nextKey] && isModuleAvailable(nextModNum, updated, contractSubmitted)) {
      const dl    = new Date();
      dl.setHours(dl.getHours() + nextMod.deadlineHours);
      const newMeta = { ...moduleMeta, [nextKey]: { deadlineIso: dl.toISOString() } } as Record<string, ModuleMeta>;
      setModuleMeta(newMeta);
      saveModuleMeta(applicationId, newMeta);
    }

    try {
      const { submitTranscriptionTask } = await import("@/lib/server/actions");
      const { getSessionData: sd } = await import("@/lib/client/supabase");
      const { appId: curAppId, accessToken: curToken } = await sd();
      await submitTranscriptionTask({ data: { taskId, transcriptionText: text, earningsUsd: task.earningsUsd, clientAppId: curAppId ?? applicationId, accessToken: curToken } });
    } catch { /* silent — localStorage already updated */ }
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
        {/* ── Page header ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Module 1–4 · Transcription Tasks</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Available tasks</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                {TASKS.length} transcription tasks across 4 modules. Each module unlocks after the previous is complete.
                General tasks are standard audio; medical tasks require clinical terminology accuracy.
                Reserve a module to lock your slot before the deadline.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="rounded-xl border border-lime/20 bg-lime/10 px-4 py-2 text-center">
                <p className="text-xs text-slate-400">Earned so far</p>
                <p className="text-lg font-semibold text-lime">${totalEarned.toFixed(2)}</p>
              </div>
              <p className="text-xs text-slate-500">{submittedCount}/{TASKS.length} submitted</p>
            </div>
          </div>
        </div>

        {/* ── Setup guide reference ───────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>New here?</span>
          <Link to="/onboarding/workspace-setup" className="inline-flex items-center gap-1 text-slate-400 underline underline-offset-2 hover:text-white transition">
            Read the workspace guide <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {/* ── Modules ─────────────────────────────────────────────────────────── */}
        {MODULES.map((mod) => {
          const modTasks = TASKS.filter((t) => t.module === mod.num);
          const meta     = moduleMeta[String(mod.num)];

          const isOpen = openModules.has(mod.num);
          return (
            <section key={mod.num} className="space-y-3">
              <ModuleHeader
                mod={mod}
                tasks={modTasks}
                progress={progress}
                contractSubmitted={contractSubmitted}
                meta={meta}
                isOpen={isOpen}
                onToggle={() => toggleModule(mod.num)}
                onReserve={() => handleReserve(mod.num)}
              />

              {/* Task list — shown when module is available AND expanded */}
              {isModuleAvailable(mod.num, progress, contractSubmitted) && isOpen && (
                <div className="space-y-2 pl-2">
                  {modTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      status={computeEffectiveStatus(task, progress, contractSubmitted)}
                      text={progress[task.id]?.text}
                      onSubmit={handleSubmit}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 text-xs text-slate-500">
          Task progress is saved in this browser. Payment is processed on the 1st and 15th of each month after your transcriptions are reviewed.
        </div>
      </div>
    </OrgShell>
  );
}
