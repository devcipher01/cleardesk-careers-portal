import React, { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  ANNOUNCEMENT_DISMISS_KEY,
  ANNOUNCEMENT_SESSION_KEY,
} from "@/lib/workspaceAnnouncement";

const PLATFORMS = ["Alison", "Coursera", "Udemy", "FutureLearn"] as const;

function storageGet(kind: "local" | "session", key: string): boolean {
  try {
    const store = kind === "local" ? window.localStorage : window.sessionStorage;
    return store.getItem(key) === "1";
  } catch {
    return false;
  }
}

function storageSet(kind: "local" | "session", key: string) {
  try {
    const store = kind === "local" ? window.localStorage : window.sessionStorage;
    store.setItem(key, "1");
  } catch {
    /* private mode / quota — ignore, same as cookie + cert helpers */
  }
}

class AnnouncementErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function AnnouncementModalInner() {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (storageGet("local", ANNOUNCEMENT_DISMISS_KEY)) return;
    if (storageGet("session", ANNOUNCEMENT_SESSION_KEY)) return;

    const timer = window.setTimeout(() => setOpen(true), 400);
    return () => window.clearTimeout(timer);
  }, [mounted]);

  function dismiss() {
    storageSet("session", ANNOUNCEMENT_SESSION_KEY);
    if (dontShowAgain) storageSet("local", ANNOUNCEMENT_DISMISS_KEY);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dontShowAgain]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-[3px] sm:items-center"
          onClick={dismiss}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[min(90vh,40rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-ink/10 bg-cream shadow-2xl"
          >
            <div className="h-1.5 w-full shrink-0 bg-lime" />

            <button
              type="button"
              onClick={dismiss}
              aria-label="Close"
              className="absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-ink/40 transition hover:bg-ink/5 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 pt-6 sm:px-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime text-ink shadow-sm">
                <ShieldAlert className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-ink/45">
                Workspace notice
              </p>
              <h2 id={titleId} className="mt-1 pr-8 font-serif text-[1.65rem] font-medium leading-tight tracking-tight text-ink">
                Certificate verification delays
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-ink/75">
                We're currently seeing delays with some MedTransCert verifications. This may
                affect how quickly certain modules are unlocked.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink/75">
                If your module requires certification, you can submit a certificate from any
                reputable platform with an online-verifiable certificate. Options include:
              </p>

              <ul className="mt-3 grid grid-cols-2 gap-2">
                {PLATFORMS.map((name) => (
                  <li
                    key={name}
                    className="rounded-xl border border-ink/10 bg-white/80 px-3 py-2 text-center text-sm font-medium text-ink"
                  >
                    {name}
                  </li>
                ))}
              </ul>

              <p className="mt-4 rounded-2xl border border-butter bg-butter/60 px-3.5 py-3 text-sm leading-relaxed text-ink/80">
                Certificates from CertifyPath may take longer to verify at this time.
              </p>

              <p className="mt-4 text-sm leading-relaxed text-ink/75">
                <Link
                  to="/workspace/support"
                  onClick={dismiss}
                  className="font-semibold text-ink underline decoration-lime decoration-2 underline-offset-2 hover:opacity-80"
                >
                  Contact support
                </Link>{" "}
                if you need help confirming your certificate.
              </p>
            </div>

            <div className="shrink-0 border-t border-ink/10 bg-cream px-6 py-4 sm:px-7">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3">
                <span className="text-sm font-medium text-ink">Don't show this again</span>
                <Switch
                  checked={dontShowAgain}
                  onCheckedChange={setDontShowAgain}
                  aria-label="Don't show this again"
                  className="data-[state=checked]:bg-ink"
                />
              </label>
              <button
                type="button"
                onClick={dismiss}
                className="mt-3 w-full rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-cream transition hover:opacity-90"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function AnnouncementModal() {
  return (
    <AnnouncementErrorBoundary>
      <AnnouncementModalInner />
    </AnnouncementErrorBoundary>
  );
}
