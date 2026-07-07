import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Loader2,
  Save,
  ShieldCheck,
} from "lucide-react";
import { OrgShell, OrgShellLoading } from "@/components/workspace/OrgShell";
import {
  getWorkspaceBySession,
  getPaymentInfoBySession,
  savePaymentInfoBySession,
} from "@/lib/server/actions";
import { getSessionData } from "@/lib/client/supabase";

export const Route = createFileRoute("/workspace/settings")({
  head: () => ({ meta: [{ title: "Settings — Worknesta Workspace" }] }),
  component: SettingsPage,
});

type SessionState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | {
      status: "ready";
      candidateName: string;
      roleTitle: string;
      email: string;
    };

function SettingsPage() {
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  // Notification prefs (local only)
  const [notifications, setNotifications] = useState(true);
  const [quietHours, setQuietHours] = useState(false);
  const [timezone, setTimezone] = useState("UTC");

  // Payment info
  const [paymentMethod, setPaymentMethod] = useState<"wise" | "payoneer">("wise");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountName, setAccountName] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);
  const [paymentError, setPaymentError] = useState("");

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
          email: s.email,
        });
        // Load saved payment info
        try {
          const pi = await getPaymentInfoBySession({ data: { clientAppId: appId, accessToken } });
          if (pi) {
            if (pi.payment_method === "wise" || pi.payment_method === "payoneer") {
              setPaymentMethod(pi.payment_method);
            }
            setAccountEmail(pi.account_email ?? "");
            setAccountName(pi.account_name ?? "");
          }
        } catch {
          /* table may not exist yet */
        }
      } catch {
        setSession({ status: "unauthenticated" });
      }
    })();
  }, []);

  if (session.status === "loading") return <OrgShellLoading activeNav="settings" />;
  if (session.status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1419]">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Session expired.</p>
          <Link
            to="/workspace/signin"
            className="inline-flex items-center gap-2 rounded-lg bg-lime px-4 py-2 text-sm font-medium text-ink"
          >
            Sign in <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const { candidateName, roleTitle, email } = session;

  async function handleSavePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!accountEmail.trim() || !accountName.trim()) {
      setPaymentError("All payment fields are required.");
      return;
    }
    setPaymentSaving(true);
    setPaymentError("");
    setPaymentSaved(false);
    try {
      const { appId: currentAppId, accessToken: currentToken } = await getSessionData();
      await savePaymentInfoBySession({
        data: { paymentMethod, accountEmail: accountEmail.trim(), accountName: accountName.trim(), clientAppId: currentAppId, accessToken: currentToken },
      });
      setPaymentSaved(true);
    } catch (err: any) {
      setPaymentError(err?.message ?? "Failed to save payment info. Run the DB migration first.");
    } finally {
      setPaymentSaving(false);
    }
  }

  const PAYMENT_DATES = ["1st of each month", "15th of each month"];

  return (
    <OrgShell candidateName={candidateName} roleTitle={roleTitle} activeNav="settings">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace settings
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Preferences & payment</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Left column */}
          <div className="space-y-6">
            {/* Account info */}
            <div className="rounded-2xl border border-white/10 bg-[#09111a] p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Account</h2>
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400">Name</p>
                  <p className="mt-0.5 text-sm text-white">{candidateName}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="mt-0.5 text-sm text-white">{email}</p>
                </div>
              </div>
            </div>

            {/* Payment info */}
            <div className="rounded-2xl border border-white/10 bg-[#09111a] p-5">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-4 w-4 text-lime" />
                <h2 className="text-sm font-semibold text-white">Payment info</h2>
              </div>
              <p className="mb-4 text-xs text-slate-400">
                Payments are processed on the{" "}
                <span className="text-white font-medium">1st and 15th</span> of each month via
                your chosen method.
              </p>
              <form onSubmit={(e) => void handleSavePayment(e)} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Payment method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["wise", "payoneer"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                          paymentMethod === m
                            ? "border-lime bg-lime/10 text-lime"
                            : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                        }`}
                      >
                        {m === "wise" ? "Wise" : "Payoneer"}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="text-xs font-medium text-slate-300">
                    {paymentMethod === "wise" ? "Wise" : "Payoneer"} account email
                  </span>
                  <input
                    type="email"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1015] px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-lime/50 focus:outline-none focus:ring-1 focus:ring-lime/30"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-300">
                    Account holder name (as shown on your {paymentMethod === "wise" ? "Wise" : "Payoneer"} account)
                  </span>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Full legal name"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1015] px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-lime/50 focus:outline-none focus:ring-1 focus:ring-lime/30"
                  />
                </label>

                {paymentError && (
                  <p className="text-xs text-rose-400">{paymentError}</p>
                )}
                {paymentSaved && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Payment info saved
                  </div>
                )}

                <button
                  type="submit"
                  disabled={paymentSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-50 hover:opacity-90 transition"
                >
                  {paymentSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save payment info
                </button>
              </form>
            </div>

            {/* Notifications */}
            <div className="rounded-2xl border border-white/10 bg-[#09111a] p-5">
              <div className="flex items-center gap-2 mb-4">
                <BellRing className="h-4 w-4 text-lime" />
                <h2 className="text-sm font-semibold text-white">Notifications</h2>
              </div>
              <div className="space-y-3">
                <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  <span>Email reminders</span>
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className="h-4 w-4 rounded accent-lime"
                  />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  <span>Quiet hours (no emails 10pm–7am)</span>
                  <input
                    type="checkbox"
                    checked={quietHours}
                    onChange={(e) => setQuietHours(e.target.checked)}
                    className="h-4 w-4 rounded accent-lime"
                  />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  <span>Timezone</span>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#0f1722] px-3 py-1.5 text-sm text-white"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="America/Chicago">America/Chicago</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Europe/Berlin">Europe/Berlin</option>
                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                    <option value="Australia/Sydney">Australia/Sydney</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Payment schedule */}
            <div className="rounded-2xl border border-white/10 bg-[#09111a] p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="h-4 w-4 text-lime" />
                <h2 className="text-sm font-semibold text-white">Pay schedule</h2>
              </div>
              <div className="space-y-2">
                {PAYMENT_DATES.map((d) => (
                  <div
                    key={d}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-300"
                  >
                    <CalendarDays className="h-3.5 w-3.5 text-lime shrink-0" />
                    {d}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Reviewed transcriptions are included in the next scheduled payout.
              </p>
            </div>

            {/* Security */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300 shrink-0" />
                <div>
                  <h2 className="text-sm font-semibold text-white">Security</h2>
                  <p className="mt-2 text-xs leading-5 text-emerald-100/80">
                    Your workspace is protected by a secure session cookie. Sign out when using a shared device.
                  </p>
                  <a
                    href="/api/auth/signout"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-300 hover:underline"
                  >
                    Sign out of all sessions
                  </a>
                </div>
              </div>
            </div>

            {/* Earnings link */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-sm font-semibold text-white mb-2">Earnings</h2>
              <p className="text-xs text-slate-400 mb-3">
                View your transcription history and payout status.
              </p>
              <Link
                to="/workspace/earnings"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 transition"
              >
                View earnings <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </OrgShell>
  );
}
