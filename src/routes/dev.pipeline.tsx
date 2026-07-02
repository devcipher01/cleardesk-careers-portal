import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, Mail, RefreshCw } from "lucide-react";
import { getDevPipelineInbox } from "@/lib/server/actions";

export const Route = createFileRoute("/dev/pipeline")({
  head: () => ({
    meta: [{ title: "Local pipeline test kit — Worknesta" }, { name: "robots", content: "noindex" }],
  }),
  component: DevPipelinePage,
});

function DevPipelinePage() {
  const [inbox, setInbox] = useState<Awaited<ReturnType<typeof getDevPipelineInbox>> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    void getDevPipelineInbox()
      .then(setInbox)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  const appId = inbox && inbox.enabled ? inbox.latestApplicationId : null;

  return (
    <section className="container-page py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-medium text-ink">Local pipeline test kit</h1>
        <p className="mt-2 text-sm text-ink/65">
          Active when Supabase env vars are missing or <code className="text-ink">LOCAL_DEV_MODE=true</code>.
          Emails log to the terminal running <code className="text-ink">npm run dev</code>.
        </p>

        <button
          type="button"
          onClick={load}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-medium hover:bg-ink/5"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh inbox
        </button>

        {inbox && !inbox.enabled && (
          <p className="mt-6 rounded-2xl border border-butter bg-butter/30 p-4 text-sm text-ink">
            Local dev mode is off (Supabase credentials detected). Remove them from{" "}
            <code>.env</code> or set <code>LOCAL_DEV_MODE=true</code> to use this page.
          </p>
        )}

        {inbox?.enabled && (
          <>
            <p className="mt-6 text-sm text-ink/70">
              Acceptance email delay: <strong>{inbox.acceptanceDelayMs}ms</strong>
              {inbox.acceptanceDelayMs === 0 ? " (instant)" : ""}
            </p>

            <div className="mt-8 space-y-3">
              <h2 className="text-lg font-medium text-ink">Quick links</h2>
              <Link
                to="/careers/apply"
                className="flex items-center justify-between rounded-2xl border border-ink/10 bg-card px-4 py-3 text-sm hover:bg-cream"
              >
                1. Submit Application <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                to="/careers/assessment"
                search={appId ? { applicationId: appId } : {}}
                className="flex items-center justify-between rounded-2xl border border-ink/10 bg-card px-4 py-3 text-sm hover:bg-cream"
              >
                2. Skills Profile Review {appId ? `(your session)` : "(after apply)"}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                to="/onboarding/workspace-setup"
                search={appId ? { applicationId: appId } : {}}
                className="flex items-center justify-between rounded-2xl border border-ink/10 bg-card px-4 py-3 text-sm hover:bg-cream"
              >
                4. Workspace setup (needs ≥60% quiz) <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10">
              <h2 className="flex items-center gap-2 text-lg font-medium text-ink">
                <Mail className="h-5 w-5" /> Simulated inbox
              </h2>
              {inbox.emails.length === 0 ? (
                <p className="mt-3 text-sm text-ink/55">No emails yet — submit an application to generate some.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {inbox.emails.map((e) => (
                    <li key={e.id} className="rounded-2xl border border-ink/10 bg-cream p-4 text-sm">
                      <p className="font-medium text-ink">{e.subject}</p>
                      <p className="mt-1 text-ink/60">To: {e.to}</p>
                      <p className="mt-1 text-xs text-ink/50">
                        {e.deliveredAt ? "Delivered" : "Scheduled"} · deliver at {e.deliverAt}
                      </p>
                      {e.text && <p className="mt-2 whitespace-pre-wrap text-xs text-ink/70">{e.text}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {appId && (
              <p className="mt-8 font-mono text-xs text-ink/50">
                Latest applicationId: {appId}
                <br />
                Assessment: {base}/careers/assessment?applicationId={appId}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
