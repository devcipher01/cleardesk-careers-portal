import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, HelpCircle, Loader2, Mail, MessageSquare, Send } from "lucide-react";
import { OrgShell, OrgShellLoading } from "@/components/workspace/OrgShell";
import { getWorkspaceBySession, sendSupportMessageBySession } from "@/lib/server/actions";
import { getSessionData } from "@/lib/client/supabase";

export const Route = createFileRoute("/workspace/support")({
  head: () => ({ meta: [{ title: "Help Center — Worknesta Workspace" }] }),
  component: SupportPage,
});

type SessionState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "ready"; candidateName: string; roleTitle: string };

function SupportPage() {
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const { appId, accessToken } = await getSessionData();
        const s = await getWorkspaceBySession({ data: { clientAppId: appId, accessToken } });
        if (!s.authenticated) { setSession({ status: "unauthenticated" }); return; }
        setSession({ status: "ready", candidateName: s.candidateName, roleTitle: s.roleTitle });
      } catch {
        setSession({ status: "unauthenticated" });
      }
    })();
  }, []);

  if (session.status === "loading") return <OrgShellLoading activeNav="help" />;
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 5) {
      setError("Please enter a message (at least 5 characters).");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { appId: currentAppId, accessToken: currentToken } = await getSessionData();
      await sendSupportMessageBySession({ data: { message: message.trim(), clientAppId: currentAppId, accessToken: currentToken } });
      setSent(true);
    } catch (e: any) {
      setError(e?.message || "Failed to send. Please email talent@worknesta.com directly.");
    } finally {
      setSubmitting(false);
    }
  }

  const FAQ = [
    {
      q: "When do I get paid?",
      a: "Payments are processed on the 1st and 15th of each month. You must have reviewed transcriptions to receive a payout.",
    },
    {
      q: "What is the accuracy standard?",
      a: "We expect 97%+ accuracy on all submitted work. Your supervisor will review your first submissions personally.",
    },
    {
      q: "What if I can't hear part of the audio?",
      a: "Use [inaudible] to flag unclear sections. Never guess at words you can't hear clearly.",
    },
    {
      q: "How do I add my payment details?",
      a: "Go to Settings and fill in your Wise or Payoneer account information.",
    },
    {
      q: "I need more time on a task. What do I do?",
      a: "Message your supervisor at least 2 hours before the deadline — never after. Use the contact form below.",
    },
  ];

  return (
    <OrgShell candidateName={candidateName} roleTitle={roleTitle} activeNav="help">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Support</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">Help center</h1>
        </div>

        {/* FAQ */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-5">
            <HelpCircle className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">{item.q}</p>
                <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Contact the talent team</h2>
          </div>
          <p className="mb-4 text-sm text-gray-500">
            Send a message and we'll reply within one business day via email.
          </p>

          {sent ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <Send className="h-4 w-4 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-700">Message sent — we'll reply by email shortly.</p>
            </div>
          ) : (
            <form onSubmit={(e) => void submit(e)} className="space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Describe your issue or question…"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-lime/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/20 resize-y"
              />
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Mail className="h-3.5 w-3.5" />
                  Or email{" "}
                  <a href="mailto:talent@worknesta.com" className="text-gray-600 hover:underline">
                    talent@worknesta.com
                  </a>
                </div>
                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-lime px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50 hover:opacity-90 transition"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send message
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </OrgShell>
  );
}
