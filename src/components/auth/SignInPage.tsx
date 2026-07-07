import React from "react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Mail, ArrowUpRight } from "lucide-react";
import { resendWorkspaceLink } from "@/lib/server/actions";

export function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setMessage(null);
    if (!email.trim()) return setError("Please enter your email");
    if (!email.includes("@")) return setError("Please enter a valid email address");
    setLoading(true);
    try {
      await resendWorkspaceLink({ data: { email } });
      setMessage(
        "Check your email for the workspace link. If you do not see it, make sure the email is connected to a qualified application.",
      );
      setEmail("");
    } catch (err: any) {
      const msg = err?.message ?? "Failed to send";
      if (msg.includes("No application found")) {
        setError(
          "We could not find an application for that email. Please apply first and complete the Skills Review.",
        );
      } else if (msg.includes("not eligible")) {
        setError(
          "This email is not eligible for a workspace sign-in link yet. Apply and complete the Skills Review first.",
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f1419] to-[#1a1f26] px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-lime/20">
            <Lock className="h-6 w-6 text-lime" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Workspace Sign In</h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter the email from your application to receive your workspace sign-in link. If you are
            not qualified yet, you will be guided to apply and complete the review.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Email address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 transition focus:border-lime focus:outline-none focus:ring-1 focus:ring-lime/50"
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
              <p className="text-sm text-rose-300">{error}</p>
            </div>
          )}
          {message && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <p className="text-sm text-emerald-300">{message}</p>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center">
              <Link
                to="/careers/apply"
                className="inline-flex items-center gap-1 text-sm font-medium text-lime hover:underline"
              >
                Go to application page <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime py-2.5 text-sm font-semibold text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            {loading ? "Sending…" : "Send me the link"}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-6 flex flex-col items-center gap-3 text-center text-sm">
          <p className="text-slate-400">
            Haven't applied yet?{" "}
            <Link
              to="/careers/apply"
              className="inline-flex items-center gap-1 font-medium text-lime hover:underline"
            >
              Start application <ArrowUpRight className="h-3 w-3" />
            </Link>
          </p>
          <Link to="/" className="text-slate-500 transition hover:text-slate-400">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
