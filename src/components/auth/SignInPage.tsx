import React from "react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Mail, ArrowUpRight, Copy, Check } from "lucide-react";
import { generateSignInLink } from "@/lib/server/actions";

export function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signInLink, setSignInLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  useEffect(() => {
    if (!cooldownUntil) return;

    const interval = window.setInterval(() => {
      const nextLeft = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownLeft(nextLeft);

      if (nextLeft <= 0) {
        setCooldownUntil(null);
        window.clearInterval(interval);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  function copyToClipboard() {
    if (signInLink) {
      navigator.clipboard.writeText(signInLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setMessage(null);
    setSignInLink(null);
    if (cooldownUntil && Date.now() < cooldownUntil) {
      return setError(`Please wait ${Math.ceil((cooldownUntil - Date.now()) / 1000)}s before requesting another link.`);
    }
    if (!email.trim()) return setError("Please enter your email");
    if (!email.includes("@")) return setError("Please enter a valid email address");
    if (!agreed) return setError("Please agree to the Terms and Conditions.");
    setLoading(true);
    try {
      const result = await generateSignInLink({ data: { email } });
      setCooldownUntil(Date.now() + 90_000);
      setSignInLink(result.link);
      setMessage(
        "Here is your sign-in link. Click it to access your workspace.",
      );
      setEmail("");
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("No account found")) {
        setError("We could not find an account for that email.");
      } else {
        setError("Something went wrong. Please try again in a moment.");
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
          {message && signInLink && (
            <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <p className="text-sm text-emerald-300">{message}</p>
              <div className="flex gap-2">
                <a
                  href={signInLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-lime py-2 px-3 text-xs font-semibold text-ink transition hover:opacity-90"
                >
                  <Mail className="h-3 w-3" />
                  Click here to sign in
                </a>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-500/50 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/10"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
          )}
          {message && !signInLink && (
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

          <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-3">
            <input
              id="agree-terms"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={loading}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-white/10 accent-lime"
            />
            <p className="text-sm leading-5 text-slate-300">
              <label htmlFor="agree-terms" className="cursor-pointer">
                I agree to the{" "}
              </label>
              <Link
                to="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-lime underline underline-offset-2 hover:opacity-90"
              >
                Terms and Conditions
              </Link>
              .
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || cooldownLeft > 0 || !agreed}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime py-2.5 text-sm font-semibold text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            {cooldownLeft > 0 ? `Resend in ${cooldownLeft}s` : loading ? "Sending…" : "Send me the link"}
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
