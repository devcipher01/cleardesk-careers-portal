import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileSignature,
  Wallet,
} from "lucide-react";
import { OrgShell, OrgShellLoading } from "@/components/workspace/OrgShell";
import { Navbar } from "@/components/site/Navbar";
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

  if (session.status === "loading") return <OrgShellLoading activeNav="dashboard" />;

  if (session.status === "unauthenticated") {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Navbar />
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-white">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="mt-5 text-xl font-semibold text-gray-900">Workspace access required</h1>
            <p className="mt-2 text-sm text-gray-500">
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
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-5 py-3 text-sm text-gray-600 hover:border-gray-300 hover:text-gray-900 transition"
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

        {/* Welcome header */}
        <div>
          <p className="text-sm text-gray-500">Good to see you,</p>
          <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Your contractor workspace for{" "}
            <span className="font-medium text-gray-700">{roleTitle}</span>
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={CheckCircle2}
            label="Skills profile"
            value={scorePercent != null ? `${scorePercent}%` : "—"}
            tone="emerald"
          />
          <StatCard
            icon={Wallet}
            label="Workspace"
            value="Active"
            tone="sky"
          />
          <StatCard
            icon={Clock}
            label="Agreement"
            value={contractSubmitted ? "Complete" : ndaSigned ? "In progress" : "Pending"}
            tone={contractSubmitted ? "emerald" : "amber"}
          />
        </div>

        {/* Setup CTA — only when not complete */}
        {!contractSubmitted && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                  Action required
                </p>
                <h2 className="mt-2 text-xl font-medium text-gray-900">
                  Review your contractor agreement
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600">
                  Read through your contractor agreement and project terms before accessing your task modules.
                </p>
              </div>
              <Link
                to="/onboarding/workspace-setup"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-lime px-6 py-3 text-sm font-semibold text-ink hover:opacity-90 transition"
              >
                <FileSignature className="h-4 w-4" />
                View agreement
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {contractSubmitted && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-medium text-gray-900">Setup complete</h2>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Your contract is on file. Head to{" "}
              <Link to="/workspace/tasks" className="font-medium text-lime underline hover:opacity-80">
                Tasks available
              </Link>{" "}
              to start your first transcription module.
            </p>
          </div>
        )}

        {/* Info cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">Production queue</h3>
            <p className="mt-2 text-sm text-gray-500">
              Your task queue is open. Visit Tasks available to begin.
            </p>
            <Link
              to="/workspace/tasks"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-lime hover:underline"
            >
              Go to tasks <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">Payroll</h3>
            <p className="mt-2 text-sm text-gray-500">
              Earnings are released after module completion and review. Most modules are reviewed within 48 hours. Add your payment details in{" "}
              <Link to="/workspace/settings" className="underline hover:text-gray-700">
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
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    sky:     "border-sky-200     bg-sky-50     text-sky-700",
    amber:   "border-amber-200   bg-amber-50   text-amber-700",
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <Icon className="h-5 w-5 opacity-70" />
      <p className="mt-3 text-xs uppercase tracking-wide opacity-60">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
