import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  adminListApplications,
  adminMarkActive,
  adminReject,
  adminSendAssessmentLink,
  adminSendInterviewLink,
  adminSendOffer,
} from "@/lib/server/actions";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Search, Send, XCircle, CheckCircle2, Eye, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Worknesta" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Filter =
  | "all"
  | "pending"
  | "interview_sent"
  | "interview_complete"
  | "assessment_sent"
  | "assessment_complete"
  | "offer_sent"
  | "offer_accepted"
  | "active"
  | "rejected";

function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [details, setDetails] = useState<any | null>(null);
  const [offerForm, setOfferForm] = useState<{ appId: string; payRate: string; startDate: string; duration: string } | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("wn_admin_password");
      if (stored) {
        setPassword(stored);
        setAuthed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const load = async (pwd = password, f = filter) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminListApplications({ data: { password: pwd, status: f } });
      setRows(res.rows);
    } catch (e: any) {
      setError(e?.message || "Failed to load applications");
      setRows([]);
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authed || !password) return;
    void load(password, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, filter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = `${r.full_name} ${r.email} ${r.role_title} ${r.status}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  const login = async () => {
    setAuthed(true);
    try {
      sessionStorage.setItem("wn_admin_password", password);
    } catch {
      /* ignore */
    }
    await load(password, filter);
  };

  const action = async (fn: () => Promise<any>) => {
    setLoading(true);
    setError("");
    try {
      await fn();
      await load(password, filter);
    } catch (e: any) {
      setError(e?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  if (!authed) {
    return (
      <section className="container-page flex min-h-[75vh] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-3xl border border-ink/10 bg-card p-8 shadow-sm">
          <div className="flex items-center gap-2 text-ink">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-ink-foreground">
              <Lock className="h-5 w-5" />
            </span>
            <span className="text-base font-medium">Admin access</span>
          </div>
          <h1 className="mt-6 text-3xl font-medium text-ink">Enter password</h1>
          <p className="mt-3 text-sm text-ink/60">
            This page is private. Use the admin password stored in <code className="font-mono">ADMIN_PASSWORD</code>.
          </p>
          <div className="mt-6">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ipt"
                placeholder="••••••••"
              />
            </label>
          </div>
          <button
            onClick={() => void login()}
            disabled={!password.trim()}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-ink-foreground transition hover:bg-lime hover:text-lime-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            Unlock <ArrowUpRight className="h-4 w-4" />
          </button>
          <style>{`
            .ipt { width:100%; border-radius:.875rem; border:1px solid var(--border); background:var(--cream); padding:.75rem .875rem; font-size:.875rem; color:var(--ink); outline:none; }
            .ipt:focus { border-color: var(--ink); box-shadow: 0 0 0 3px color-mix(in oklab, var(--lime) 50%, transparent); }
          `}</style>
        </div>
      </section>
    );
  }

  return (
    <section className="container-page py-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-script text-xl text-ink/55">admin</p>
            <h1 className="text-4xl font-medium text-ink md:text-5xl">
              Applications <span className="font-serif italic">dashboard.</span>
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="ipt pl-9"
                placeholder="Search name, email, role..."
              />
            </div>
            <button
              onClick={() => void load(password, filter)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-ink-foreground transition hover:bg-lime hover:text-lime-foreground disabled:opacity-50"
            >
              Refresh <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {([
            ["all", "All"],
            ["pending", "Pending"],
            ["interview_sent", "Interview"],
            ["assessment_sent", "Assessment"],
            ["offer_sent", "Offer"],
            ["active", "Active"],
            ["rejected", "Rejected"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === id ? "bg-lime text-lime-foreground" : "border border-ink/15 bg-card text-ink hover:bg-ink/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose/40 bg-rose/20 p-4 text-sm text-ink">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-3xl border border-ink/10 bg-card">
          <div className="grid grid-cols-[1.4fr_1.4fr_1fr_.9fr_.9fr_1.4fr] gap-3 border-b border-ink/10 bg-cream px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink/60">
            <div>Name</div>
            <div>Email</div>
            <div>Role</div>
            <div>Status</div>
            <div>Applied</div>
            <div>Actions</div>
          </div>
          <div className="divide-y divide-ink/10">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-[1.4fr_1.4fr_1fr_.9fr_.9fr_1.4fr] gap-3 px-5 py-4 text-sm"
              >
                <div className="font-medium text-ink">{r.full_name}</div>
                <div className="text-ink/70">{r.email}</div>
                <div className="text-ink/70">{r.role_title}</div>
                <div className="text-ink/70">{r.status}</div>
                <div className="text-ink/55">{new Date(r.created_at).toLocaleDateString()}</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setDetails(r)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-ink/5"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Details
                  </button>

                  {r.status === "pending" && (
                    <button
                      onClick={() =>
                        void action(() =>
                          adminSendInterviewLink({ data: { password, applicationId: r.id } }),
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground"
                    >
                      <Send className="h-3.5 w-3.5" /> Send Interview Link
                    </button>
                  )}
                  {r.status === "interview_complete" && (
                    <button
                      onClick={() =>
                        void action(() =>
                          adminSendAssessmentLink({ data: { password, applicationId: r.id } }),
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground"
                    >
                      <Send className="h-3.5 w-3.5" /> Send Assessment Link
                    </button>
                  )}
                  {r.status === "assessment_complete" && (
                    <button
                      onClick={() =>
                        setOfferForm({ appId: r.id, payRate: "", startDate: "", duration: "" })
                      }
                      className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Send Offer
                    </button>
                  )}
                  {r.status === "offer_accepted" && (
                    <button
                      onClick={() => void action(() => adminMarkActive({ data: { password, applicationId: r.id } }))}
                      className="inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1.5 text-xs font-medium text-lime-foreground hover:opacity-90"
                    >
                      Mark Active
                    </button>
                  )}

                  <button
                    onClick={() => void action(() => adminReject({ data: { password, applicationId: r.id } }))}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose/40 bg-rose/20 px-3 py-1.5 text-xs font-medium text-ink hover:bg-rose/30"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
            {!loading && filtered.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-ink/60">
                No applications found.
              </div>
            )}
          </div>
        </div>

        <DetailsModal row={details} onClose={() => setDetails(null)} />
        <OfferModal
          state={offerForm}
          onClose={() => setOfferForm(null)}
          onSend={(s) =>
            action(() =>
              adminSendOffer({
                data: {
                  password,
                  applicationId: s.appId,
                  payRate: s.payRate,
                  startDate: s.startDate,
                  contractDuration: s.duration,
                },
              }),
            ).then(() => setOfferForm(null))
          }
          sending={loading}
        />
      </div>

      <style>{`
        .ipt { width:100%; border-radius:.875rem; border:1px solid var(--border); background:var(--cream); padding:.75rem .875rem; font-size:.875rem; color:var(--ink); outline:none; }
        .ipt:focus { border-color: var(--ink); box-shadow: 0 0 0 3px color-mix(in oklab, var(--lime) 50%, transparent); }
      `}</style>
    </section>
  );
}

function DetailsModal({ row, onClose }: { row: any | null; onClose: () => void }) {
  const open = Boolean(row);
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl rounded-3xl border border-ink/10 bg-card p-6 shadow-xl md:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-medium text-ink">Application details</h3>
                <p className="mt-1 text-sm text-ink/60">
                  {row.full_name} · {row.email} · {row.role_title}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:bg-ink/5"
              >
                Close
              </button>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Detail label="Status" value={row.status} />
              <Detail label="Applied" value={new Date(row.created_at).toLocaleString()} />
              <Detail label="Phone" value={row.phone} />
              <Detail label="Country" value={row.country} />
              <Detail label="Timezone" value={row.timezone} />
              <Detail label="Has computer" value={row.has_computer ? "Yes" : "No"} />
              <Detail label="Internet" value={row.internet} />
              <Detail label="Typing speed" value={row.typing_speed} />
              <Detail label="Availability" value={row.availability} />
              <Detail label="Hours / week" value={String(row.hours_per_week)} />
              <Detail label="Source" value={row.source} />
              <Detail label="Resume" value={row.resume_filename ? `${row.resume_filename} (${row.resume_size_bytes ?? ""} bytes)` : "—"} />
            </div>
            <div className="mt-6 grid gap-5">
              <LongDetail label="Why remote" value={row.why_remote} />
              <LongDetail label="Experience" value={row.experience} />
              <LongDetail
                label="Remote work history"
                value={row.worked_remote ? `Yes — ${row.remote_description || ""}` : "No"}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OfferModal({
  state,
  onClose,
  onSend,
  sending,
}: {
  state: { appId: string; payRate: string; startDate: string; duration: string } | null;
  onClose: () => void;
  onSend: (s: { appId: string; payRate: string; startDate: string; duration: string }) => void;
  sending: boolean;
}) {
  const open = Boolean(state);
  const [local, setLocal] = useState(state);

  useEffect(() => {
    setLocal(state);
  }, [state]);

  return (
    <AnimatePresence initial={false}>
      {open && local && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl border border-ink/10 bg-card p-6 shadow-xl md:p-8"
          >
            <h3 className="text-2xl font-medium text-ink">Send offer</h3>
            <p className="mt-1 text-sm text-ink/60">Fill these fields and send the offer link.</p>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Pay rate (USD/hr)</span>
                <input
                  value={local.payRate}
                  onChange={(e) => setLocal((s) => (s ? { ...s, payRate: e.target.value } : s))}
                  className="ipt"
                  placeholder="e.g. 18"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Start date</span>
                <input
                  value={local.startDate}
                  onChange={(e) => setLocal((s) => (s ? { ...s, startDate: e.target.value } : s))}
                  className="ipt"
                  placeholder="e.g. May 1, 2026"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Contract duration</span>
                <input
                  value={local.duration}
                  onChange={(e) => setLocal((s) => (s ? { ...s, duration: e.target.value } : s))}
                  className="ipt"
                  placeholder="e.g. 3 months"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={sending}
                className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:bg-ink/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => local && onSend(local)}
                disabled={
                  sending ||
                  !local.payRate.trim() ||
                  !local.startDate.trim() ||
                  !local.duration.trim()
                }
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground disabled:opacity-50"
              >
                Send offer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-cream p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-ink/55">{label}</div>
      <div className="mt-1 text-sm font-medium text-ink">{value || "—"}</div>
    </div>
  );
}

function LongDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-cream p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-ink/55">{label}</div>
      <div className="mt-2 whitespace-pre-wrap text-sm text-ink/75">{value || "—"}</div>
    </div>
  );
}

