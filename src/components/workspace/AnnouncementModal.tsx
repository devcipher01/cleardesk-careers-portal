import React, { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Megaphone, ShieldAlert } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { getTaskProgressBySession } from "@/lib/server/actions";
import { getSessionData } from "@/lib/client/supabase";
import {
  WORKSPACE_ANNOUNCEMENTS,
  announcementMatchesAudience,
  type WorkspaceAnnouncement,
} from "@/lib/workspaceAnnouncement";

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

function localProgressTasks(appId: string | undefined): { task_id: string; status: string }[] {
  if (!appId || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`wn_task_progress_${appId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, { status?: string }>;
    return Object.entries(parsed).map(([task_id, v]) => ({ task_id, status: v.status ?? "" }));
  } catch {
    return [];
  }
}

function mergeTaskStatuses(
  ...lists: { task_id: string; status: string }[][]
): { task_id: string; status: string }[] {
  const byId = new Map<string, string>();
  for (const list of lists) {
    for (const t of list) {
      const prev = byId.get(t.task_id);
      if (t.status === "reviewed" || prev === "reviewed") byId.set(t.task_id, "reviewed");
      else if (t.status === "submitted" || prev === "submitted") byId.set(t.task_id, "submitted");
      else if (!prev) byId.set(t.task_id, t.status);
    }
  }
  return Array.from(byId, ([task_id, status]) => ({ task_id, status }));
}

function nextVisibleAnnouncement(
  tasks: { task_id: string; status: string }[],
): WorkspaceAnnouncement | null {
  for (const notice of WORKSPACE_ANNOUNCEMENTS) {
    if (storageGet("local", notice.dismissKey)) continue;
    if (storageGet("session", notice.sessionKey)) continue;
    if (!announcementMatchesAudience(notice, tasks)) continue;
    return notice;
  }
  return null;
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
  const [notice, setNotice] = useState<WorkspaceAnnouncement | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [tasks, setTasks] = useState<{ task_id: string; status: string }[]>([]);
  const [progressReady, setProgressReady] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    void (async () => {
      const { appId, accessToken } = await getSessionData();
      let dbTasks: { task_id: string; status: string }[] = [];
      try {
        const result = await getTaskProgressBySession({ data: { clientAppId: appId, accessToken } });
        if (result.authenticated) dbTasks = result.tasks.map((t) => ({ task_id: t.task_id, status: t.status }));
      } catch {
        /* targeted notices stay hidden if progress cannot load */
      }
      if (cancelled) return;
      setTasks(mergeTaskStatuses(dbTasks, localProgressTasks(appId)));
      setProgressReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !progressReady) return;
    const first = nextVisibleAnnouncement(tasks);
    if (!first) {
      setNotice(null);
      return;
    }
    const timer = window.setTimeout(() => setNotice(first), 400);
    return () => window.clearTimeout(timer);
  }, [mounted, progressReady, tasks]);

  function dismiss() {
    if (!notice) return;
    storageSet("session", notice.sessionKey);
    if (dontShowAgain) storageSet("local", notice.dismissKey);
    setDontShowAgain(false);
    const following = nextVisibleAnnouncement(tasks);
    setNotice(following);
  }

  if (!mounted) return null;

  const Icon = notice?.icon === "megaphone" ? Megaphone : ShieldAlert;

  return createPortal(
    <AnimatePresence>
      {notice && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-[3px] sm:items-center"
          role="presentation"
        >
          <motion.div
            key={notice.id}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ scale: 0.96, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative flex max-h-[min(90vh,40rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-ink/10 bg-cream shadow-2xl"
          >
            <div className="h-1.5 w-full shrink-0 bg-lime" />

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 pt-6 sm:px-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime text-ink shadow-sm">
                <Icon className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-ink/45">
                Workspace notice
              </p>
              <h2 id={titleId} className="mt-1 pr-8 font-serif text-[1.65rem] font-medium leading-tight tracking-tight text-ink">
                {notice.title}
              </h2>

              {notice.paragraphs.map((p) => (
                <p key={p} className="mt-3 text-sm leading-relaxed text-ink/75">
                  {p}
                </p>
              ))}

              {notice.links && notice.links.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {notice.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-center text-sm font-semibold text-ink transition hover:bg-lime"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ))}
                </div>
              )}

              {notice.highlight && (
                <p className="mt-4 rounded-2xl border border-butter bg-butter/60 px-3.5 py-3 text-sm leading-relaxed text-ink/80">
                  {notice.highlight}
                </p>
              )}

              {notice.showSupportLink && (
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
              )}

              {notice.showSettingsLink && (
                <p className="mt-4 text-sm leading-relaxed text-ink/75">
                  <Link
                    to="/workspace/settings"
                    onClick={dismiss}
                    className="font-semibold text-ink underline decoration-lime decoration-2 underline-offset-2 hover:opacity-80"
                  >
                    Open settings
                  </Link>{" "}
                  to confirm your payment details.
                </p>
              )}
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
