import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  Headphones,
} from "lucide-react";
import { OrgShell, OrgShellLoading } from "@/components/workspace/OrgShell";
import { getWorkspaceBySession } from "@/lib/server/actions";
import { getSessionData } from "@/lib/client/supabase";

export const Route = createFileRoute("/workspace/earnings")({
  head: () => ({ meta: [{ title: "Earnings — Worknesta Workspace" }] }),
  component: EarningsPage,
});

const RATE = 24.5;
function earn(min: number) {
  return parseFloat(((RATE * min) / 60).toFixed(2));
}

// ─── All task metadata keyed by the actual task IDs used in localStorage ───────
const ALL_TASKS: Record<string, { title: string; earningsUsd: number; durationMin: number; module: 1|2|3|4 }> = {
  // Module 1
  m1t01: { title: "Client Interview — Part 1",     earningsUsd: earn(8),   durationMin: 8,   module: 1 },
  m1t02: { title: "Team Standup Recording",         earningsUsd: earn(15),  durationMin: 15,  module: 1 },
  m1t03: { title: "Product Feedback Session",       earningsUsd: earn(22),  durationMin: 22,  module: 1 },
  m1t04: { title: "Sales Call Excerpt",             earningsUsd: earn(12),  durationMin: 12,  module: 1 },
  m1t05: { title: "HR Policy Briefing",             earningsUsd: earn(25),  durationMin: 25,  module: 1 },
  m1t06: { title: "Customer Support Call",          earningsUsd: earn(16),  durationMin: 16,  module: 1 },
  m1t07: { title: "Webinar Segment — Q&A Block",   earningsUsd: earn(28),  durationMin: 28,  module: 1 },
  m1t08: { title: "Medical Consultation Notes",     earningsUsd: earn(20),  durationMin: 20,  module: 1 },
  m1t09: { title: "Patient Intake Interview",       earningsUsd: earn(28),  durationMin: 28,  module: 1 },
  m1t10: { title: "Radiology Report Dictation",     earningsUsd: earn(15),  durationMin: 15,  module: 1 },
  // Module 2
  m2t01: { title: "Executive Panel Q&A",            earningsUsd: earn(30),  durationMin: 30,  module: 2 },
  m2t02: { title: "Training Workshop Recording",    earningsUsd: earn(45),  durationMin: 45,  module: 2 },
  m2t03: { title: "Investor Pitch Presentation",    earningsUsd: earn(35),  durationMin: 35,  module: 2 },
  m2t04: { title: "Podcast Interview Segment",      earningsUsd: earn(40),  durationMin: 40,  module: 2 },
  m2t05: { title: "Performance Review Meeting",     earningsUsd: earn(28),  durationMin: 28,  module: 2 },
  m2t06: { title: "Clinical Case Discussion",       earningsUsd: earn(35),  durationMin: 35,  module: 2 },
  m2t07: { title: "Surgical Prep Briefing",         earningsUsd: earn(40),  durationMin: 40,  module: 2 },
  // Module 3
  m3t01: { title: "Legal Deposition Excerpt",       earningsUsd: earn(55),  durationMin: 55,  module: 3 },
  m3t02: { title: "Academic Conference Talk",        earningsUsd: earn(60),  durationMin: 60,  module: 3 },
  m3t03: { title: "Documentary Interview Segment",  earningsUsd: earn(50),  durationMin: 50,  module: 3 },
  m3t04: { title: "Technical Seminar Recording",    earningsUsd: earn(65),  durationMin: 65,  module: 3 },
  m3t05: { title: "Psychiatric Evaluation Notes",   earningsUsd: earn(50),  durationMin: 50,  module: 3 },
  m3t06: { title: "Cardiology Consultation",        earningsUsd: earn(55),  durationMin: 55,  module: 3 },
  m3t07: { title: "ER Triage Documentation",        earningsUsd: earn(45),  durationMin: 45,  module: 3 },
  // Module 4
  m4t01: { title: "Full Conference Session A",      earningsUsd: earn(130), durationMin: 130, module: 4 },
  m4t02: { title: "Town Hall Meeting — Full",       earningsUsd: earn(110), durationMin: 110, module: 4 },
  m4t03: { title: "Full Conference Session B",      earningsUsd: earn(150), durationMin: 150, module: 4 },
  m4t04: { title: "Documentary Interview — Full",   earningsUsd: earn(180), durationMin: 180, module: 4 },
  m4t05: { title: "Oncology Team Meeting",          earningsUsd: earn(120), durationMin: 120, module: 4 },
  m4t06: { title: "Neurology Grand Rounds",         earningsUsd: earn(140), durationMin: 140, module: 4 },
};

const MODULE_LABELS: Record<number, string> = {
  1: "Module 1 — Foundation Transcription",
  2: "Module 2 — Intermediate Tasks",
  3: "Module 3 — Advanced Transcription",
  4: "Module 4 — Long-Form Mastery",
};

const MODULE_TASK_COUNTS: Record<number, number> = { 1: 10, 2: 7, 3: 7, 4: 6 };

function storageKey(appId: string) { return `wn_task_progress_${appId}`; }
function loadProgress(appId: string): Record<string, { status: string; submittedAt?: string }> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(storageKey(appId)) ?? "{}"); }
  catch { return {}; }
}

/** Next payment date (1st or 15th) at or after a given date */
function nextPayoutAfter(d: Date): Date {
  const year = d.getFullYear(), month = d.getMonth(), day = d.getDate();
  if (day <= 1)  return new Date(year, month, 1);
  if (day <= 15) return new Date(year, month, 15);
  return new Date(year, month + 1, 1);
}

/** Next two scheduled payout dates from today */
function nextPaymentDates(): { date: string; label: string }[] {
  const today = new Date();
  const first = nextPayoutAfter(today);
  // If first is today exactly, pick the next one too
  const second = first.getDate() === 1
    ? new Date(first.getFullYear(), first.getMonth(), 15)
    : new Date(first.getFullYear(), first.getMonth() + 1, 1);
  return [
    { date: first.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), label: "Next payout" },
    { date: second.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), label: "Following payout" },
  ];
}

function fmtDuration(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

type SessionState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "ready"; candidateName: string; roleTitle: string; applicationId: string };

function EarningsPage() {
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const [progress, setProgress] = useState<Record<string, { status: string; submittedAt?: string }>>({});

  useEffect(() => {
    void (async () => {
      try {
        const { appId, accessToken } = await getSessionData();
        const s = await getWorkspaceBySession({ data: { clientAppId: appId, accessToken } });
        if (!s.authenticated) { setSession({ status: "unauthenticated" }); return; }
        setSession({ status: "ready", candidateName: s.candidateName, roleTitle: s.roleTitle, applicationId: s.applicationId });
        setProgress(loadProgress(s.applicationId));
      } catch {
        setSession({ status: "unauthenticated" });
      }
    })();
  }, []);

  if (session.status === "loading") return <OrgShellLoading activeNav="earnings" />;
  if (session.status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Session expired.</p>
          <Link to="/workspace/signin" className="inline-flex items-center gap-2 rounded-lg bg-lime px-4 py-2 text-sm font-medium text-ink">
            Sign in <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const { candidateName, roleTitle } = session;

  // Build enriched submitted-task list
  const submitted = Object.entries(progress)
    .filter(([, v]) => v.status === "submitted" || v.status === "reviewed")
    .map(([id, v]) => {
      const meta = ALL_TASKS[id] ?? { title: id, earningsUsd: 0, durationMin: 0, module: 1 as const };
      return { id, ...v, ...meta };
    });

  const reviewed     = submitted.filter((t) => t.status === "reviewed");
  const pendingReview = submitted.filter((t) => t.status === "submitted");

  const totalEarned   = submitted.reduce((s, t) => s + t.earningsUsd, 0);
  const reviewedEarned = reviewed.reduce((s, t) => s + t.earningsUsd, 0);
  const pendingEarned  = pendingReview.reduce((s, t) => s + t.earningsUsd, 0);

  const payDates = nextPaymentDates();

  // Group by module — only modules that have any submitted tasks
  const moduleNums = [1, 2, 3, 4] as const;
  const byModule = moduleNums
    .map((mod) => ({
      mod,
      tasks: submitted.filter((t) => t.module === mod),
    }))
    .filter((g) => g.tasks.length > 0);

  return (
    <OrgShell candidateName={candidateName} roleTitle={roleTitle} activeNav="earnings">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Earnings overview</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 md:text-3xl">Your earnings</h1>
          <p className="mt-1 text-sm text-gray-500">Earnings released after module completion and review · Most modules reviewed within 48 hours</p>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-lime/30 bg-lime/10 p-5">
            <DollarSign className="h-5 w-5 text-lime" />
            <p className="mt-3 text-xs uppercase tracking-wide text-gray-500">Total earned</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">${totalEarned.toFixed(2)}</p>
            <p className="mt-1 text-xs text-gray-400">{submitted.length} task{submitted.length !== 1 ? "s" : ""} submitted</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <p className="mt-3 text-xs uppercase tracking-wide text-gray-500">Reviewed &amp; approved</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">${reviewedEarned.toFixed(2)}</p>
            <p className="mt-1 text-xs text-gray-400">{reviewed.length} task{reviewed.length !== 1 ? "s" : ""} reviewed</p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
            <Clock className="h-5 w-5 text-sky-600" />
            <p className="mt-3 text-xs uppercase tracking-wide text-gray-500">Under review</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">${pendingEarned.toFixed(2)}</p>
            <p className="mt-1 text-xs text-gray-400">
              {pendingReview.length} task{pendingReview.length !== 1 ? "s" : ""} awaiting review
            </p>
          </div>
        </div>

        {/* Payment schedule */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-lime" />
            <h2 className="text-sm font-semibold text-gray-900">Payment schedule</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Earnings are released after module completion and review. Most modules are reviewed within 48 hours. Payments are sent via your chosen method — Wise, Payoneer, PayPal, or bank transfer.
          </p>
          <p className="text-xs text-gray-400">
            Make sure your payment info is up to date in{" "}
            <Link to="/workspace/settings" className="text-lime hover:underline font-medium">Settings</Link>.
          </p>
        </div>

        {/* Transcription history — grouped by module */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-4 w-4 text-lime" />
            <h2 className="text-sm font-semibold text-gray-900">Submission history</h2>
          </div>

          {submitted.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-500">No transcriptions submitted yet.</p>
              <Link
                to="/workspace/tasks"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-lime hover:underline"
              >
                Go to Tasks <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {byModule.map(({ mod, tasks }) => {
                const modReviewed     = tasks.filter((t) => t.status === "reviewed");
                const modPending      = tasks.filter((t) => t.status === "submitted");
                const modTotal        = tasks.reduce((s, t) => s + t.earningsUsd, 0);
                const modReviewedAmt  = modReviewed.reduce((s, t) => s + t.earningsUsd, 0);
                const allComplete     = tasks.length === MODULE_TASK_COUNTS[mod];
                const allReviewed     = modReviewed.length === tasks.length && tasks.length > 0;

                // Payout estimate: next payout date after the latest review date (if all reviewed)
                // or after today if not all reviewed
                let payoutStr = "Pending review";
                if (allReviewed && modReviewed.length > 0) {
                  const latestReview = modReviewed.reduce((latest, t) => {
                    const d = t.submittedAt ? new Date(t.submittedAt) : new Date(0);
                    return d > latest ? d : latest;
                  }, new Date(0));
                  payoutStr = nextPayoutAfter(latestReview).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                }

                return (
                  <div key={mod}>
                    {/* Module section header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-900 px-4 py-3 mb-3">
                      <div>
                        <p className="text-xs font-semibold text-white">{MODULE_LABELS[mod]}</p>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          {tasks.length}/{MODULE_TASK_COUNTS[mod]} submitted
                          {allComplete && " · All submitted"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-sm font-bold text-lime">${modTotal.toFixed(2)}</p>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <CalendarDays className="h-3 w-3 text-gray-400" />
                          <span className={allReviewed ? "text-emerald-400" : "text-gray-400"}>
                            {payoutStr}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Task rows */}
                    <div className="divide-y divide-gray-100">
                      {tasks.map((t) => (
                        <div key={t.id} className="flex items-center justify-between gap-4 py-3 px-1">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium text-gray-900">{t.title}</p>
                              {/* Medical / general badge */}
                              {t.id.includes("t08") || t.id.includes("t09") || t.id.includes("t10") || t.id.includes("t06") || t.id.includes("t07") ? null : null}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {fmtDuration(t.durationMin)}
                              {t.submittedAt && (
                                <span className="text-gray-300"> · Submitted {new Date(t.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                              t.status === "reviewed"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-sky-100 text-sky-700"
                            }`}>
                              {t.status === "reviewed" ? "Reviewed" : "Under review"}
                            </span>
                            <span className="text-sm font-semibold text-lime">${t.earningsUsd.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Module summary footer */}
                    {modPending.length > 0 && (
                      <div className="mt-2 rounded-lg bg-sky-50 border border-sky-100 px-3 py-2 flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                        <p className="text-xs text-sky-700">
                          <span className="font-semibold">{modPending.length} task{modPending.length !== 1 ? "s" : ""}</span> under review — ${modPending.reduce((s, t) => s + t.earningsUsd, 0).toFixed(2)} held pending approval
                        </p>
                      </div>
                    )}
                    {allReviewed && modReviewed.length > 0 && (
                      <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <p className="text-xs text-emerald-700">
                          All reviewed — <span className="font-semibold">${modReviewedAmt.toFixed(2)}</span> queued for payout on {payoutStr}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </OrgShell>
  );
}
