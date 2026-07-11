import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, DollarSign, Clock, CheckCircle2, Headphones, ShieldCheck } from "lucide-react";
import { OrgShell, OrgShellLoading } from "@/components/workspace/OrgShell";
import { getWorkspaceBySession } from "@/lib/server/actions";
import { getSessionData } from "@/lib/client/supabase";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/onboarding/workspace-setup")({
  head: () => ({
    meta: [{ title: "Workspace Guide — Worknesta" }],
  }),
  component: WorkspaceSetupPage,
});

type SessionState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "ready"; candidateName: string; roleTitle: string };

function WorkspaceSetupPage() {
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    void (async () => {
      try {
        const { appId, accessToken } = await getSessionData();
        if (!appId) { setSession({ status: "guest" }); return; }
        const s = await getWorkspaceBySession({ data: { clientAppId: appId, accessToken } });
        if (s.authenticated) {
          setSession({ status: "ready", candidateName: s.candidateName, roleTitle: s.roleTitle });
        } else {
          setSession({ status: "guest" });
        }
      } catch {
        setSession({ status: "guest" });
      }
    })();
  }, []);

  if (session.status === "loading") return <OrgShellLoading activeNav="setup" />;

  const candidateName = session.status === "ready" ? session.candidateName : "";
  const roleTitle = session.status === "ready" ? session.roleTitle : "Transcription Specialist";

  return (
    <OrgShell candidateName={candidateName} roleTitle={roleTitle} activeNav="setup">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Workspace guide</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 md:text-3xl">Getting started</h1>
          <p className="mt-2 text-sm text-gray-500">
            Everything you need to know before working on your first task.
          </p>
        </div>

        {/* Compensation card */}
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-sky-600" />
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-600">Compensation</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            $24.50 <span className="text-base font-normal text-gray-500">USD / hour</span>
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Paid twice monthly — 1st and 15th — via Wise or Payoneer. You work as an independent contractor.
          </p>
        </div>

        {/* How it works */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">How it works</h2>
          </div>
          <div className="space-y-5">
            {[
              {
                icon: <Headphones className="h-5 w-5 text-lime" />,
                title: "Listen & transcribe",
                body: "Each task is an audio recording — an interview, meeting, medical consultation, or lecture. Your job is to type out exactly what is said.",
              },
              {
                icon: <Clock className="h-5 w-5 text-lime" />,
                title: "Work at your own pace",
                body: "Tasks are organised into 4 modules. Complete Module 1 first, then each subsequent module unlocks. You choose when to work within the deadline window.",
              },
              {
                icon: <CheckCircle2 className="h-5 w-5 text-lime" />,
                title: "Submit & get paid",
                body: "Once you submit a transcription it goes to review. Approved submissions count toward your pay cycle on the 1st and 15th.",
              },
              {
                icon: <ShieldCheck className="h-5 w-5 text-lime" />,
                title: "Accuracy standard",
                body: "We expect 97% or higher accuracy. Use [inaudible] for unclear audio and label multiple speakers as Speaker A, Speaker B, etc.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="mt-0.5 shrink-0">{item.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="mt-1 text-sm text-gray-500 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick tips */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Quick tips</h2>
          <ul className="space-y-3 text-sm text-gray-600">
            {[
              "Use headphones — they significantly improve accuracy on difficult audio.",
              "After finishing, replay the audio from the start and read along to catch errors before submitting.",
              "Filler words (um, uh) should be included unless the task description says otherwise.",
              "For medical tasks, flag any uncertain medical term with [?term] rather than guessing.",
              "Respond to reviewer feedback within 24 hours if revisions are requested.",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lime" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between rounded-2xl border border-lime/30 bg-lime/10 p-5">
          <div>
            <p className="text-sm font-semibold text-gray-900">Ready to start?</p>
            <p className="mt-1 text-xs text-gray-500">Your tasks are waiting — Module 1 is open now.</p>
          </div>
          <Link
            to="/workspace/tasks"
            className="inline-flex items-center gap-2 rounded-xl bg-lime px-5 py-2.5 text-sm font-semibold text-ink hover:opacity-90 transition"
          >
            Go to tasks <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </OrgShell>
  );
}
