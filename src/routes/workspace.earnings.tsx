import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import { OrgShell, OrgShellLoading } from "@/components/workspace/OrgShell";
import { getTaskProgressBySession, getWorkspaceBySession } from "@/lib/server/actions";
import { getSessionData } from "@/lib/client/supabase";
import { formatNaira, nairaFromUsd, TASK_PRICES_NAIRA, PRICE_FACTOR } from "@/lib/taskPricing";
import { MODULE_PAYOUT_MIN_ACCURACY } from "@/lib/taskAccuracy";
import { evaluateModulePayout, MODULE_TASK_COUNTS } from "@/lib/modulePayout";

export const Route = createFileRoute("/workspace/earnings")({
  head: () => ({ meta: [{ title: "Earnings — Worknesta Workspace" }] }),
  component: EarningsPage,
});

type ProgressEntry = {
  status: string;
  submittedAt?: string;
  text?: string;
  dbAccuracyScore?: number;
};

// ─── All task metadata keyed by the actual task IDs used in localStorage ───────
const ALL_TASKS: Record<string, { title: string; earningsNaira: number; durationMin: number; module: 1 | 2 | 3 | 4 }> = {
  m1t01: { title: "Client Interview — Part 1",     earningsNaira: TASK_PRICES_NAIRA.m1t01, durationMin: 186 / 60,   module: 1 },
  m1t02: { title: "Team Standup Recording",         earningsNaira: TASK_PRICES_NAIRA.m1t02, durationMin: 193 / 60,  module: 1 },
  m1t03: { title: "Product Feedback Session",       earningsNaira: TASK_PRICES_NAIRA.m1t03, durationMin: 185 / 60,  module: 1 },
  m1t04: { title: "Sales Call Excerpt",             earningsNaira: TASK_PRICES_NAIRA.m1t04, durationMin: 187 / 60,  module: 1 },
  m1t05: { title: "HR Policy Briefing",             earningsNaira: TASK_PRICES_NAIRA.m1t05, durationMin: 25,  module: 1 },
  m1t06: { title: "Customer Support Call",          earningsNaira: TASK_PRICES_NAIRA.m1t06, durationMin: 16,  module: 1 },
  m2t01: { title: "Executive Panel Q&A",            earningsNaira: nairaFromUsd(30 * PRICE_FACTOR),  durationMin: 30,  module: 2 },
  m2t02: { title: "Training Workshop Recording",    earningsNaira: nairaFromUsd(45 * PRICE_FACTOR),  durationMin: 45,  module: 2 },
  m2t03: { title: "Investor Pitch Presentation",    earningsNaira: nairaFromUsd(35 * PRICE_FACTOR),  durationMin: 35,  module: 2 },
  m2t04: { title: "Podcast Interview Segment",      earningsNaira: nairaFromUsd(40 * PRICE_FACTOR),  durationMin: 40,  module: 2 },
  m2t05: { title: "Performance Review Meeting",     earningsNaira: nairaFromUsd(28 * PRICE_FACTOR),  durationMin: 28,  module: 2 },
  m2t06: { title: "Clinical Case Discussion",       earningsNaira: nairaFromUsd(35 * PRICE_FACTOR),  durationMin: 35,  module: 2 },
  m2t07: { title: "Surgical Prep Briefing",         earningsNaira: nairaFromUsd(40 * PRICE_FACTOR),  durationMin: 40,  module: 2 },
  m3t01: { title: "Legal Deposition Excerpt",       earningsNaira: nairaFromUsd(55 * PRICE_FACTOR),  durationMin: 55,  module: 3 },
  m3t02: { title: "Academic Conference Talk",        earningsNaira: nairaFromUsd(60 * PRICE_FACTOR),  durationMin: 60,  module: 3 },
  m3t03: { title: "Documentary Interview Segment",  earningsNaira: nairaFromUsd(50 * PRICE_FACTOR),  durationMin: 50,  module: 3 },
  m3t04: { title: "Technical Seminar Recording",    earningsNaira: nairaFromUsd(65 * PRICE_FACTOR),  durationMin: 65,  module: 3 },
  m3t05: { title: "Psychiatric Evaluation Notes",   earningsNaira: nairaFromUsd(50 * PRICE_FACTOR),  durationMin: 50,  module: 3 },
  m3t06: { title: "Cardiology Consultation",        earningsNaira: nairaFromUsd(55 * PRICE_FACTOR),  durationMin: 55,  module: 3 },
  m3t07: { title: "ER Triage Documentation",        earningsNaira: nairaFromUsd(45 * PRICE_FACTOR),  durationMin: 45,  module: 3 },
  m4t01: { title: "Full Conference Session A",      earningsNaira: nairaFromUsd(130 * PRICE_FACTOR), durationMin: 130, module: 4 },
  m4t02: { title: "Town Hall Meeting — Full",       earningsNaira: nairaFromUsd(110 * PRICE_FACTOR), durationMin: 110, module: 4 },
  m4t03: { title: "Full Conference Session B",      earningsNaira: nairaFromUsd(150 * PRICE_FACTOR), durationMin: 150, module: 4 },
  m4t04: { title: "Documentary Interview — Full",   earningsNaira: nairaFromUsd(180 * PRICE_FACTOR), durationMin: 180, module: 4 },
  m4t05: { title: "Oncology Team Meeting",          earningsNaira: nairaFromUsd(120 * PRICE_FACTOR), durationMin: 120, module: 4 },
  m4t06: { title: "Neurology Grand Rounds",         earningsNaira: nairaFromUsd(140 * PRICE_FACTOR), durationMin: 140, module: 4 },
};

const MODULE_LABELS: Record<number, string> = {
  1: "Module 1 — Foundation Transcription",
  2: "Module 2 — Intermediate Tasks",
  3: "Module 3 — Advanced Transcription",
  4: "Module 4 — Long-Form Mastery",
};

function storageKey(appId: string) { return `wn_task_progress_${appId}`; }
function loadProgress(appId: string): Record<string, ProgressEntry> {
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

function nextPaymentDates(): { date: string; label: string }[] {
  const today = new Date();
  const first = nextPayoutAfter(today);
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
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({});

  useEffect(() => {
    void (async () => {
      try {
        const { appId, accessToken } = await getSessionData();
        const [s, dbResult] = await Promise.all([
          getWorkspaceBySession({ data: { clientAppId: appId, accessToken } }),
          getTaskProgressBySession({ data: { clientAppId: appId, accessToken } }).catch(() => ({ authenticated: false as const, tasks: [] })),
        ]);
        if (!s.authenticated) { setSession({ status: "unauthenticated" }); return; }
        setSession({ status: "ready", candidateName: s.candidateName, roleTitle: s.roleTitle, applicationId: s.applicationId });

        const prog = loadProgress(s.applicationId);
        if (dbResult.authenticated && dbResult.tasks.length > 0) {
          for (const t of dbResult.tasks) {
            if (t.status === "submitted" || t.status === "reviewed") {
              prog[t.task_id] = {
                status: t.status,
                text: t.transcription_text ?? prog[t.task_id]?.text,
                submittedAt: t.submitted_at ?? prog[t.task_id]?.submittedAt,
                dbAccuracyScore: t.accuracy_score ?? prog[t.task_id]?.dbAccuracyScore,
              };
            }
          }
        }
        setProgress(prog);
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

  const submitted = Object.entries(progress)
    .filter(([, v]) => v.status === "submitted" || v.status === "reviewed")
    .map(([id, v]) => {
      const meta = ALL_TASKS[id] ?? { title: id, earningsNaira: 0, durationMin: 0, module: 1 as const };
      return { id, ...v, ...meta };
    });

  const reviewed = submitted.filter((t) => t.status === "reviewed");
  const pendingReview = submitted.filter((t) => t.status === "submitted");

  const moduleNums = [1, 2, 3, 4] as const;
  const byModule = moduleNums
    .map((mod) => {
      const tasks = submitted.filter((t) => t.module === mod);
      const payout = evaluateModulePayout(MODULE_TASK_COUNTS[mod], tasks);
      return { mod, tasks, payout };
    })
    .filter((g) => g.tasks.length > 0);

  const totalEarned = byModule.reduce((s, g) => s + g.payout.payableNaira, 0);
  const reviewedEarned = totalEarned;
  const pendingEarned = byModule.reduce((s, g) => s + g.payout.pendingNaira, 0);
  const reviewedTaskCount = reviewed.length;
  const pendingTaskCount = pendingReview.length;

  const payDates = nextPaymentDates();

  return (
    <OrgShell candidateName={candidateName} roleTitle={roleTitle} activeNav="earnings">
      <div className="mx-auto max-w-4xl space-y-6">

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Earnings overview</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 md:text-3xl">Your earnings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Payable after a module is fully completed, reviewed, and averages {MODULE_PAYOUT_MIN_ACCURACY}%+ accuracy. Expired or incomplete modules are not paid.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-lime/30 bg-lime/10 p-5">
            <p className="mt-3 text-xs uppercase tracking-wide text-gray-500">Total earned</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{formatNaira(totalEarned)}</p>
            <p className="mt-1 text-xs text-gray-400">Eligible for payout</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <p className="mt-3 text-xs uppercase tracking-wide text-gray-500">Reviewed</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{formatNaira(reviewedEarned)}</p>
            <p className="mt-1 text-xs text-gray-400">
              {reviewedTaskCount} task{reviewedTaskCount !== 1 ? "s" : ""} reviewed
              {reviewedEarned === 0 && reviewedTaskCount > 0 ? " · not eligible" : ""}
            </p>
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
            <Clock className="h-5 w-5 text-sky-600" />
            <p className="mt-3 text-xs uppercase tracking-wide text-gray-500">Under review</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{formatNaira(pendingEarned)}</p>
            <p className="mt-1 text-xs text-gray-400">
              {pendingTaskCount} task{pendingTaskCount !== 1 ? "s" : ""} awaiting review
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-lime" />
            <h2 className="text-sm font-semibold text-gray-900">Payment schedule</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Eligible module payouts are sent via your chosen method on the 1st and 15th. Most tasks are reviewed within 48 hours.
          </p>
          {totalEarned > 0 && (
            <ul className="mb-4 space-y-1 text-sm text-gray-600">
              {payDates.map((p) => (
                <li key={p.label}>{p.label}: {p.date}</li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-400">
            Make sure your payment info is up to date in{" "}
            <Link to="/workspace/settings" className="text-lime hover:underline font-medium">Settings</Link>.
          </p>
        </div>

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
              {byModule.map(({ mod, tasks, payout }) => {
                const allComplete = tasks.length === MODULE_TASK_COUNTS[mod];

                let payoutStr = "Pending review";
                if (payout.kind === "payable") {
                  const latestReview = tasks.reduce((latest, t) => {
                    const d = t.submittedAt ? new Date(t.submittedAt) : new Date(0);
                    return d > latest ? d : latest;
                  }, new Date(0));
                  payoutStr = nextPayoutAfter(latestReview).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                } else if (payout.kind === "below_accuracy" || payout.kind === "incomplete") {
                  payoutStr = "Not eligible";
                }

                return (
                  <div key={mod}>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-900 px-4 py-3 mb-3">
                      <div>
                        <p className="text-xs font-semibold text-white">{MODULE_LABELS[mod]}</p>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          {tasks.length}/{MODULE_TASK_COUNTS[mod]} submitted
                          {allComplete && " · All submitted"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-sm font-bold text-lime">{formatNaira(payout.payableNaira)}</p>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <CalendarDays className="h-3 w-3 text-gray-400" />
                          <span className={payout.kind === "payable" ? "text-emerald-400" : "text-gray-400"}>
                            {payoutStr}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {tasks.map((t) => (
                          <div key={t.id} className="flex items-center justify-between gap-4 py-3 px-1">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-900">{t.title}</p>
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
                              <span className="text-sm font-semibold text-gray-500">{formatNaira(t.earningsNaira)}</span>
                            </div>
                          </div>
                      ))}
                    </div>

                    {payout.kind === "pending_review" && (
                      <div className="mt-2 rounded-lg bg-sky-50 border border-sky-100 px-3 py-2 flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                        <p className="text-xs text-sky-700">
                          <span className="font-semibold">{payout.pendingCount} task{payout.pendingCount !== 1 ? "s" : ""}</span> under review — {formatNaira(payout.pendingNaira)} held pending review. Not counted as earned until the module qualifies.
                        </p>
                      </div>
                    )}
                    {payout.kind === "payable" && (
                      <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <p className="text-xs text-emerald-700">
                          Module complete — <span className="font-semibold">{formatNaira(payout.payableNaira)}</span> queued for payout on {payoutStr}
                        </p>
                      </div>
                    )}
                    {payout.kind === "below_accuracy" && (
                      <div className="mt-2 rounded-lg bg-rose-50 border border-rose-100 px-3 py-2">
                        <p className="text-xs text-rose-800">
                          Below the {MODULE_PAYOUT_MIN_ACCURACY}% accuracy standard — this module is not eligible for payout. Tasks stay in history.
                        </p>
                      </div>
                    )}
                    {payout.kind === "incomplete" && (
                      <div className="mt-2 rounded-lg bg-rose-50 border border-rose-100 px-3 py-2">
                        <p className="text-xs text-rose-800">
                          Module was not fully completed before the deadline — not eligible for payout. Submitted tasks stay in history.
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
