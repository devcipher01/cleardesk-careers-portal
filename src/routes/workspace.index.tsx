import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileSignature,
  Loader2,
  Wallet,
} from "lucide-react";
import { OrgShell } from "@/components/workspace/OrgShell";
import { Navbar } from "@/components/site/Navbar";
import { VideoEmbed } from "@/components/site/VideoEmbed";
import { getWorkspaceBySession } from "@/lib/server/actions";
import { getSessionData } from "@/lib/client/supabase";

export const Route = createFileRoute("/workspace/")({
  head: () => ({
    meta: [
      { title: "Contractor Workspace — Worknesta" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WorkspaceDashboard,
});

type SessionState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | {
      status: "ready";
      candidateName: string;
      roleTitle: string;
      scorePercent: number | null;
      contractSubmitted: boolean;
      ndaSigned: boolean;
      applicationId: string;
    };

function WorkspaceDashboard() {
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    void (async () => {
      try {
        const { appId, accessToken } = await getSessionData();
        const s = await getWorkspaceBySession({ data: { clientAppId: appId, accessToken } });
        if (!s.authenticated) {
          setSession({ status: "unauthenticated" });
          return;
        }
        setSession({
          status: "ready",
          candidateName: s.candidateName,
          roleTitle: s.roleTitle,
          scorePercent: s.scorePercent ?? null,
          contractSubmitted: s.contractSubmitted,
          ndaSigned: s.ndaSigned,
          applicationId: s.applicationId,
        });
      } catch {
        setSession({ status: "unauthenticated" });
      }
    })();
  }, []);

  if (session.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1419]">
        <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
      </div>
    );
  }

  if (session.status === "unauthenticated") {
    return (
      <div className="flex min-h-screen flex-col bg-[#0f1419]">
        {/* Site header so users can navigate elsewhere */}
        <div className="[&_header]:bg-[#0b1015] [&_header]:border-b [&_header]:border-white/10">
          <Navbar />
        </div>

        <div className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="mt-5 text-xl font-semibold text-white">Workspace access required</h1>
            <p className="mt-2 text-sm text-slate-400">
              Enter your application email to receive a sign-in link.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/workspace/signin"
                className="inline-flex items-center justify-center rounded-xl bg-lime px-6 py-3 text-sm font-semibold text-ink hover:opacity-90 transition"
              >
                Sign in to workspace
              </Link>
              <Link
                to="/careers/apply"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 px-5 py-3 text-sm text-slate-300 hover:border-white/30 hover:text-white transition"
              >
                View careers <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { candidateName, roleTitle, scorePercent, contractSubmitted, ndaSigned } = session;
  const firstName = candidateName.split(" ")[0] ?? "there";

  return (
    <OrgShell candidateName={candidateName} roleTitle={roleTitle} activeNav="dashboard">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm text-slate-400">Good to see you,</p>
          <h1 className="text-2xl font-semibold text-white md:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Your contractor workspace for{" "}
            <span className="text-slate-200">{roleTitle}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Step 1 — Watch before you begin
          </p>
          <VideoEmbed
            label="ONBOARDING — Welcome to your workspace"
            caption="A short welcome from our onboarding team — please watch before starting setup"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={CheckCircle2}
            label="Skills profile"
            value={scorePercent != null ? `${scorePercent}%` : "—"}
            tone="emerald"
          />
          <StatCard icon={Wallet} label="Offered rate" value="$24.50/hr" tone="sky" />
          <StatCard
            icon={Clock}
            label="Onboarding"
            value={
              contractSubmitted ? "Complete" : ndaSigned ? "In progress" : "Action needed"
            }
            tone={contractSubmitted ? "emerald" : "amber"}
          />
        </div>

        {!contractSubmitted && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Action required
                </p>
                <h2 className="mt-2 text-xl font-medium text-white">
                  Complete workspace setup
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-amber-100/80">
                  Review your contractor agreement, confirm payment terms ($24.50/hr USD,
                  twice-monthly disbursement), and sign required documents before accessing
                  production tools.
                </p>
              </div>
              <Link
                to="/onboarding/workspace-setup"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-lime px-6 py-3 text-sm font-semibold text-ink hover:opacity-90"
              >
                <FileSignature className="h-4 w-4" />
                Start setup
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {contractSubmitted && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-medium text-white">Setup complete</h2>
            </div>
            <p className="mt-2 text-sm text-emerald-100/80">
              Your contract is on file. Head to{" "}
              <Link to="/workspace/tasks" className="underline hover:text-white">
                Tasks available
              </Link>{" "}
              to start your first transcription module.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-medium text-white">Production queue</h3>
            <p className="mt-2 text-sm text-slate-400">
              {contractSubmitted
                ? "Your task queue is open. Visit Tasks available to begin."
                : "Unlocks after workspace setup and contract verification."}
            </p>
            {contractSubmitted && (
              <Link
                to="/workspace/tasks"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-lime hover:underline"
              >
                Go to tasks <ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-medium text-white">Payroll</h3>
            <p className="mt-2 text-sm text-slate-400">
              Paid twice monthly (1st and 15th) via Wise or Payoneer. Add your payment details
              in{" "}
              <Link to="/workspace/settings" className="underline hover:text-slate-200">
                Settings
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </OrgShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
  tone: "emerald" | "sky" | "amber";
}) {
  const tones = {
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    sky: "border-sky-500/20 bg-sky-500/10 text-sky-300",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <Icon className="h-5 w-5 opacity-80" />
      <p className="mt-3 text-xs uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
