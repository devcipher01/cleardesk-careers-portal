import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { OrgShell, OrgShellLoading } from "@/components/workspace/OrgShell";
import { getWorkspaceBySession } from "@/lib/server/actions";
import { getStoredAppId, saveAppId } from "@/lib/client/session";

export const Route = createFileRoute("/workspace/earnings")({
  head: () => ({ meta: [{ title: "Earnings — Worknesta Workspace" }] }),
  component: EarningsPage,
});

const RATE = 24.5;
function earn(min: number) {
  return parseFloat(((RATE * min) / 60).toFixed(2));
}

const TASK_EARNINGS: Record<string, { title: string; earningsUsd: number; durationMin: number }> = {
  t01: { title: "Client Interview — Part 1", earningsUsd: earn(8),   durationMin: 8   },
  t02: { title: "Team Standup Recording",     earningsUsd: earn(15),  durationMin: 15  },
  t03: { title: "Product Feedback Session",   earningsUsd: earn(22),  durationMin: 22  },
  t04: { title: "Sales Call Excerpt",         earningsUsd: earn(12),  durationMin: 12  },
  t05: { title: "HR Policy Briefing",         earningsUsd: earn(25),  durationMin: 25  },
  t06: { title: "Medical Consultation Notes", earningsUsd: earn(18),  durationMin: 18  },
  t07: { title: "Executive Panel Q&A",        earningsUsd: earn(30),  durationMin: 30  },
  t08: { title: "Full Conference Session A",  earningsUsd: earn(130), durationMin: 130 },
  t09: { title: "Legal Deposition Recording", earningsUsd: earn(150), durationMin: 150 },
  t10: { title: "Documentary Interview",      earningsUsd: earn(180), durationMin: 180 },
};

function storageKey(appId: string) { return `wn_task_progress_${appId}`; }
function loadProgress(appId: string): Record<string, { status: string; submittedAt?: string }> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(storageKey(appId)) ?? "{}");
  } catch { return {}; }
}

/** Next two payment dates (1st and 15th of month) */
function nextPaymentDates(): { date: string; label: string }[] {
  const today = new Date();
  const results: { date: string; label: string }[] = [];
  let d = new Date(today);
  while (results.length < 2) {
    const day = d.getDate();
    if (day < 1 || (day < 15 && results.length === 0)) {
      d.setDate(1);
      if (d > today || results.length > 0) {
        results.push({
          date: d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          label: results.length === 0 ? "Next payout" : "Following payout",
        });
      }
    }
    if (d.getDate() < 15 && results.length < 2) {
      const d15 = new Date(d.getFullYear(), d.getMonth(), 15);
      if (d15 > today) {
        results.push({
          date: d15.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          label: results.length === 0 ? "Next payout" : "Following payout",
        });
      }
    }
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    if (results.length === 0 && d.getMonth() - today.getMonth() > 2) break;
  }
  return results;
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
        const storedId = getStoredAppId();
        const s = await getWorkspaceBySession({ data: { clientAppId: storedId } });
        if (!s.authenticated) { setSession({ status: "unauthenticated" }); return; }
        saveAppId(s.applicationId);
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
      <div className="flex min-h-screen items-center justify-center bg-[#0f1419]">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Session expired.</p>
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
    .map(([id, v]) => ({ id, ...v, ...(TASK_EARNINGS[id] ?? { title: id, earningsUsd: 0, durationMin: 0 }) }));

  const reviewed = submitted.filter((t) => t.status === "reviewed");
  const pendingReview = submitted.filter((t) => t.status === "submitted");

  const totalEarned = submitted.reduce((s, t) => s + t.earningsUsd, 0);
  const reviewedEarned = reviewed.reduce((s, t) => s + t.earningsUsd, 0);
  const pendingEarned = pendingReview.reduce((s, t) => s + t.earningsUsd, 0);

  const payDates = nextPaymentDates();

  function fmtDuration(min: number) {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60), m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  return (
    <OrgShell candidateName={candidateName} roleTitle={roleTitle} activeNav="earnings">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <p className="text-sm text-slate-400">Earnings overview</p>
          <h1 className="text-2xl font-semibold text-white md:text-3xl">Your earnings</h1>
          <p className="mt-1 text-sm text-slate-400">Rate: $24.50/hr · Paid 1st and 15th of each month</p>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-lime/20 bg-lime/10 p-5">
            <DollarSign className="h-5 w-5 text-lime" />
            <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">Total earned</p>
            <p className="mt-1 text-2xl font-bold text-white">${totalEarned.toFixed(2)}</p>
            <p className="mt-1 text-xs text-slate-500">{submitted.length} task{submitted.length !== 1 ? "s" : ""} submitted</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">Reviewed & approved</p>
            <p className="mt-1 text-2xl font-bold text-white">${reviewedEarned.toFixed(2)}</p>
            <p className="mt-1 text-xs text-slate-500">{reviewed.length} task{reviewed.length !== 1 ? "s" : ""} reviewed</p>
          </div>
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5">
            <Clock className="h-5 w-5 text-sky-400" />
            <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">Pending review</p>
            <p className="mt-1 text-2xl font-bold text-white">${pendingEarned.toFixed(2)}</p>
            <p className="mt-1 text-xs text-slate-500">{pendingReview.length} task{pendingReview.length !== 1 ? "s" : ""} awaiting</p>
          </div>
        </div>

        {/* Payment schedule */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-lime" />
            <h2 className="text-sm font-semibold text-white">Payment schedule</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            All reviewed transcriptions are paid out twice monthly — on the 1st and 15th. Payments are sent via your chosen method (Wise or Payoneer).
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {payDates.map((pd) => (
              <div key={pd.date} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b1015] px-4 py-3">
                <CalendarDays className="h-4 w-4 shrink-0 text-lime" />
                <div>
                  <p className="text-xs text-slate-400">{pd.label}</p>
                  <p className="text-sm font-medium text-white">{pd.date}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Make sure your payment info is up to date in{" "}
            <Link to="/workspace/settings" className="text-lime hover:underline">Settings</Link>.
          </p>
        </div>

        {/* Transcription history */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-lime" />
            <h2 className="text-sm font-semibold text-white">Transcription history</h2>
          </div>

          {submitted.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400">No transcriptions submitted yet.</p>
              <Link
                to="/workspace/tasks"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-lime hover:underline"
              >
                Go to Tasks <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {submitted.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{t.title}</p>
                    <p className="text-xs text-slate-500">
                      {fmtDuration(t.durationMin)}
                      {t.submittedAt && ` · Submitted ${new Date(t.submittedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      t.status === "reviewed"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-sky-500/10 text-sky-300"
                    }`}>
                      {t.status === "reviewed" ? "Reviewed" : "Pending review"}
                    </span>
                    <span className="text-sm font-semibold text-lime">${t.earningsUsd.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </OrgShell>
  );
}
