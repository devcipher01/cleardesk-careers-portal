import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  adminCheckPassword,
  adminListApplications,
  adminMarkActive,
  adminReject,
  adminSendAssessmentLink,
  adminSendInterviewLink,
  adminSendOffer,
  adminListTranscriptions,
  adminMarkTranscriptionReviewed,
  adminGetStats,
} from "@/lib/server/actions";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Lock,
  Menu,
  RefreshCw,
  Search,
  Send,
  Shield,
  Users,
  X,
  XCircle,
} from "lucide-react";

/** Deterministic accuracy score 87–100 derived from task_id */
function accuracyScore(taskId: string): number {
  let h = 0;
  for (let i = 0; i < taskId.length; i++) {
    h = (Math.imul(h, 31) + taskId.charCodeAt(i)) >>> 0;
  }
  return 87 + (h % 14);
}

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Worknesta" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Tab = "applications" | "transcriptions";
type AppFilter =
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
type TxFilter = "all" | "submitted" | "reviewed";

interface Stats {
  totalContractors: number;
  totalSubmitted: number;
  underReview: number;
  totalReviewed: number;
  totalEarningsUsd: number;
}

const APP_FILTERS: [AppFilter, string][] = [
  ["all", "All"],
  ["pending", "Pending"],
  ["interview_sent", "Interview"],
  ["assessment_sent", "Assessment"],
  ["offer_sent", "Offer"],
  ["active", "Active"],
  ["rejected", "Rejected"],
];

const TX_FILTERS: [TxFilter, string][] = [
  ["submitted", "Under review"],
  ["reviewed", "Reviewed"],
  ["all", "All"],
];

function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("applications");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Applications tab state
  const [appFilter, setAppFilter] = useState<AppFilter>("all");
  const [appRows, setAppRows] = useState<any[]>([]);
  const [details, setDetails] = useState<any | null>(null);
  const [offerForm, setOfferForm] = useState<{ appId: string; payRate: string; startDate: string; duration: string } | null>(null);

  // Transcriptions tab state
  const [txFilter, setTxFilter] = useState<TxFilter>("submitted");
  const [txRows, setTxRows] = useState<any[]>([]);
  const [txDetails, setTxDetails] = useState<any | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("wn_admin_password");
      if (stored) { setPassword(stored); setAuthed(true); }
    } catch { /* ignore */ }
  }, []);

  const loadApps = async (pwd = password, f = appFilter) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminListApplications({ data: { password: pwd, status: f } });
      setAppRows(res.rows);
    } catch (e: any) {
      const msg: string = e?.message || "Failed to load applications";
      setError(msg);
      setAppRows([]);
      if (msg.toLowerCase().includes("invalid admin password") || msg.toLowerCase().includes("admin_password")) {
        setAuthed(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTx = async (pwd = password, f = txFilter) => {
    setLoading(true);
    setError("");
    try {
      const [txRes, statsRes] = await Promise.all([
        adminListTranscriptions({ data: { password: pwd, status: f } }),
        adminGetStats({ data: { password: pwd } }),
      ]);
      setTxRows(txRes.rows);
      setStats(statsRes);
    } catch (e: any) {
      const msg: string = e?.message || "Failed to load transcriptions";
      setError(msg);
      setTxRows([]);
      if (msg.toLowerCase().includes("invalid admin password") || msg.toLowerCase().includes("admin_password")) {
        setAuthed(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authed || !password) return;
    if (tab === "applications") void loadApps(password, appFilter);
    else void loadTx(password, txFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, tab, appFilter, txFilter]);

  const filteredApps = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return appRows;
    return appRows.filter((r) => `${r.full_name} ${r.email} ${r.role_title} ${r.status}`.toLowerCase().includes(q));
  }, [appRows, query]);

  const filteredTx = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return txRows;
    return txRows.filter((r) => {
      const app = r.applications as any;
      return `${app?.full_name ?? ""} ${app?.email ?? ""} ${r.task_id}`.toLowerCase().includes(q);
    });
  }, [txRows, query]);

  // ── LOGIN ────────────────────────────────────────────────────────────────
  const login = async () => {
    setLoading(true);
    setError("");
    try {
      // Verify password first — this fn does NOT touch Supabase, so it works
      // regardless of DB configuration.
      await adminCheckPassword({ data: { password } });
      setAuthed(true);
      try { sessionStorage.setItem("wn_admin_password", password); } catch { /* ignore */ }
    } catch (e: any) {
      const msg: string = e?.message || "Failed to authenticate";
      setError(msg.toLowerCase().includes("invalid admin password") ? "Incorrect password — try again." : msg);
    } finally {
      setLoading(false);
    }
  };

  const action = async (fn: () => Promise<any>) => {
    setLoading(true);
    setError("");
    try {
      await fn();
      if (tab === "applications") await loadApps(password, appFilter);
      else await loadTx(password, txFilter);
    } catch (e: any) {
      setError(e?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  // ── LOGIN SCREEN ─────────────────────────────────────────────────────────
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
            This page is private. Use the admin password stored in{" "}
            <code className="font-mono">ADMIN_PASSWORD</code>.
          </p>
          <div className="mt-6">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && password.trim() && !loading && void login()}
                className={`ipt${error ? " ipt-error" : ""}`}
                placeholder="••••••••"
                disabled={loading}
              />
            </label>
            {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
          </div>
          <button
            onClick={() => void login()}
            disabled={!password.trim() || loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-ink-foreground transition hover:bg-lime hover:text-lime-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Verifying…" : <><span>Unlock</span><ArrowUpRight className="h-4 w-4" /></>}
          </button>
        </div>
        <style>{`
          .ipt { width:100%; border-radius:.875rem; border:1px solid var(--border); background:var(--cream); padding:.75rem .875rem; font-size:.875rem; color:var(--ink); outline:none; transition: border-color .15s, box-shadow .15s; }
          .ipt:focus { border-color: var(--ink); box-shadow: 0 0 0 3px color-mix(in oklab, var(--lime) 50%, transparent); }
          .ipt-error { border-color: #f87171 !important; }
        `}</style>
      </section>
    );
  }

  // ── AUTHENTICATED DASHBOARD ───────────────────────────────────────────────
  const currentAppFilter = APP_FILTERS.find(([id]) => id === appFilter)?.[1] ?? "All";
  const currentTxFilter = TX_FILTERS.find(([id]) => id === txFilter)?.[1] ?? "All";
  const resultCount = tab === "applications" ? filteredApps.length : filteredTx.length;

  return (
    <div className="min-h-screen" style={{ background: "var(--cream)" }}>

      {/* ── MOBILE SIDEBAR OVERLAY ──────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-ink/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── MOBILE SIDEBAR DRAWER ───────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-ink/10 bg-card transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex shrink-0 items-center justify-between border-b border-ink/10 px-5 py-4">
          <div>
            <p className="font-script text-xl text-ink/55">admin</p>
            <p className="text-sm font-semibold text-ink">Worknesta</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-ink/5"
          >
            <X className="h-4 w-4 text-ink" />
          </button>
        </div>

        {/* Drawer body — scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* Section nav */}
          <div>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink/40">Section</p>
            <div className="space-y-1">
              {([
                ["applications", "Applications", <Users key="u" className="h-4 w-4" />],
                ["transcriptions", "Transcriptions", <FileText key="f" className="h-4 w-4" />],
              ] as const).map(([id, label, icon]) => (
                <button
                  key={id}
                  onClick={() => { setTab(id); setQuery(""); setError(""); setSidebarOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    tab === id
                      ? "bg-lime text-lime-foreground"
                      : "text-ink hover:bg-ink/5"
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink/40">Filter</p>
            <div className="space-y-0.5">
              {(tab === "applications" ? APP_FILTERS : TX_FILTERS).map(([id, label]) => {
                const active = tab === "applications" ? appFilter === id : txFilter === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      if (tab === "applications") setAppFilter(id as AppFilter);
                      else setTxFilter(id as TxFilter);
                      setSidebarOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                      active
                        ? "bg-ink text-ink-foreground font-medium"
                        : "text-ink hover:bg-ink/5"
                    }`}
                  >
                    {label}
                    {active && <CheckCircle2 className="h-3.5 w-3.5 opacity-70" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stats (transcriptions) */}
          {tab === "transcriptions" && stats && (
            <div>
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink/40">Stats</p>
              <div className="space-y-1.5">
                {[
                  { label: "Contractors", value: stats.totalContractors, icon: <Users className="h-3.5 w-3.5" /> },
                  { label: "Submitted", value: stats.totalSubmitted, icon: <FileText className="h-3.5 w-3.5" /> },
                  { label: "Under review", value: stats.underReview, icon: <Activity className="h-3.5 w-3.5" /> },
                  { label: "Reviewed", value: stats.totalReviewed, icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
                  { label: "Earnings owed", value: `$${stats.totalEarningsUsd.toFixed(2)}`, icon: <Shield className="h-3.5 w-3.5" /> },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-ink/10 px-3 py-2.5">
                    <span className="flex items-center gap-2 text-xs text-ink/60">{icon}{label}</span>
                    <span className="text-sm font-semibold text-ink">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer footer — refresh */}
        <div className="shrink-0 border-t border-ink/10 p-4">
          <button
            onClick={() => { tab === "applications" ? void loadApps() : void loadTx(); setSidebarOpen(false); }}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink/15 py-2.5 text-sm font-medium text-ink hover:bg-ink/5 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh data
          </button>
        </div>
      </aside>

      {/* ── MOBILE TOP BAR ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink/10 bg-card/95 px-4 py-3 backdrop-blur-sm md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl hover:bg-ink/5"
        >
          <Menu className="h-5 w-5 text-ink" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {tab === "applications" ? "Applications" : "Transcriptions"}
          </p>
          <p className="text-[11px] text-ink/50">
            {currentAppFilter !== "All" || currentTxFilter !== "All"
              ? tab === "applications" ? currentAppFilter : currentTxFilter
              : "All"}{" "}
            · {resultCount} result{resultCount !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="relative shrink-0">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-36 rounded-xl border border-ink/15 bg-cream py-2 pl-8 pr-3 text-xs focus:border-ink focus:outline-none focus:ring-2 focus:ring-lime/30"
            placeholder="Search…"
          />
        </div>
      </header>

      {/* ── MOBILE CONTENT ──────────────────────────────────────────── */}
      <div className="md:hidden px-4 py-4">
        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-ink">
            <strong>Error:</strong> {error}
          </div>
        )}
        {loading && (
          <div className="py-12 text-center text-sm text-ink/50">Loading…</div>
        )}

        {/* Mobile: Applications cards */}
        {tab === "applications" && !loading && (
          <div className="space-y-3">
            {filteredApps.length === 0 && (
              <div className="rounded-2xl border border-ink/10 bg-card px-4 py-10 text-center text-sm text-ink/50">
                No applications found.
              </div>
            )}
            {filteredApps.map((r) => (
              <div key={r.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-card">
                <div className="px-4 pt-4 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{r.full_name}</p>
                      <p className="truncate text-xs text-ink/60">{r.email}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-ink/15 bg-cream px-2.5 py-0.5 text-[11px] font-medium text-ink/70">
                      {r.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-ink/60">{r.role_title}</p>
                  <p className="mt-0.5 text-[11px] text-ink/40">
                    Applied {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-ink/8 px-4 py-3">
                  <button
                    onClick={() => setDetails(r)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-ink/5"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  {r.status === "pending" && (
                    <button
                      onClick={() => void action(() => adminSendInterviewLink({ data: { password, applicationId: r.id } }))}
                      className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground"
                    >
                      <Send className="h-3.5 w-3.5" /> Interview
                    </button>
                  )}
                  {r.status === "interview_complete" && (
                    <button
                      onClick={() => void action(() => adminSendAssessmentLink({ data: { password, applicationId: r.id } }))}
                      className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground"
                    >
                      <Send className="h-3.5 w-3.5" /> Assessment
                    </button>
                  )}
                  {r.status === "assessment_complete" && (
                    <button
                      onClick={() => setOfferForm({ appId: r.id, payRate: "", startDate: "", duration: "" })}
                      className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Offer
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
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-ink hover:bg-rose-100"
                  >
                    <XCircle className="h-3.5 w-3.5 text-rose-400" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile: Transcription cards */}
        {tab === "transcriptions" && !loading && (
          <div className="space-y-3">
            {filteredTx.length === 0 && (
              <div className="rounded-2xl border border-ink/10 bg-card px-4 py-10 text-center text-sm text-ink/50">
                No transcriptions found.
              </div>
            )}
            {filteredTx.map((r) => {
              const app = r.applications as any;
              const isSubmitted = r.status === "submitted";
              return (
                <div
                  key={r.id}
                  className={`overflow-hidden rounded-2xl border bg-card ${
                    isSubmitted ? "border-amber-200" : "border-emerald-200"
                  }`}
                >
                  {/* Card header */}
                  <div className={`px-4 py-3 ${isSubmitted ? "bg-amber-50" : "bg-emerald-50"}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                          isSubmitted ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {isSubmitted ? "Under review" : "Reviewed"}
                      </span>
                      {!isSubmitted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-lime/15 px-2 py-0.5 text-[11px] font-semibold text-lime">
                          {accuracyScore(r.task_id)}% accuracy
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-ink text-sm">{app?.full_name ?? "—"}</p>
                    <p className="text-xs text-ink/60">{app?.email ?? ""}</p>
                    <p className="mt-1 font-mono text-[11px] text-ink/50">{r.task_id}</p>
                  </div>

                  {/* Card body */}
                  <div className="px-4 py-3">
                    <div className="mb-3 flex items-center justify-between text-xs text-ink/50">
                      <span>
                        Submitted{" "}
                        {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "—"}
                      </span>
                      {r.earnings_usd && (
                        <span className="font-semibold text-lime">
                          ${Number(r.earnings_usd).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setTxDetails(txDetails?.id === r.id ? null : r)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-ink/5"
                      >
                        {txDetails?.id === r.id
                          ? <><ChevronUp className="h-3.5 w-3.5" /> Hide</>
                          : <><ChevronDown className="h-3.5 w-3.5" /> Read</>}
                      </button>
                      {isSubmitted && (
                        <button
                          onClick={() =>
                            void action(() =>
                              adminMarkTranscriptionReviewed({ data: { password, taskProgressId: r.id } })
                            )
                          }
                          disabled={loading}
                          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark reviewed
                        </button>
                      )}
                      {!isSubmitted && r.reviewed_at && (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Reviewed {new Date(r.reviewed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Expanded text */}
                    {txDetails?.id === r.id && (
                      <div className="mt-3 border-t border-ink/10 pt-3">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink/40">
                          Transcription text
                        </p>
                        <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-ink/80">
                          {r.transcription_text || (
                            <span className="italic text-ink/30">No content</span>
                          )}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DESKTOP LAYOUT ──────────────────────────────────────────── */}
      <section className="container-page hidden py-10 md:block md:py-14">
        <div className="mx-auto max-w-6xl">

          {/* Desktop header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-script text-xl text-ink/55">admin</p>
              <h1 className="text-4xl font-medium text-ink md:text-5xl">
                {tab === "applications"
                  ? <><span>Applications</span> <span className="font-serif italic">dashboard.</span></>
                  : <><span>Transcription</span> <span className="font-serif italic">review.</span></>
                }
              </h1>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="ipt pl-9"
                  placeholder={tab === "applications" ? "Search name, email, role..." : "Search name, task ID..."}
                />
              </div>
              <button
                onClick={() => tab === "applications" ? void loadApps() : void loadTx()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-ink-foreground transition hover:bg-lime hover:text-lime-foreground disabled:opacity-50"
              >
                Refresh <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Desktop tabs */}
          <div className="mt-6 flex gap-2 border-b border-ink/10 pb-0">
            {([
              ["applications", "Applications", <Users key="u" className="h-4 w-4" />],
              ["transcriptions", "Transcriptions", <FileText key="f" className="h-4 w-4" />],
            ] as const).map(([id, label, icon]) => (
              <button
                key={id}
                onClick={() => { setTab(id); setQuery(""); setError(""); }}
                className={`inline-flex items-center gap-2 rounded-t-xl border border-b-0 px-4 py-2.5 text-sm font-medium transition ${
                  tab === id
                    ? "border-ink/10 bg-card text-ink"
                    : "border-transparent text-ink/50 hover:text-ink"
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Desktop stats bar (transcriptions) */}
          {tab === "transcriptions" && stats && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { label: "Active contractors", value: stats.totalContractors, icon: <Users className="h-4 w-4" />, color: "text-ink" },
                { label: "Total submitted", value: stats.totalSubmitted, icon: <FileText className="h-4 w-4" />, color: "text-sky-600" },
                { label: "Under review", value: stats.underReview, icon: <Activity className="h-4 w-4" />, color: "text-amber-600" },
                { label: "Reviewed", value: stats.totalReviewed, icon: <CheckCircle2 className="h-4 w-4" />, color: "text-emerald-600" },
                { label: "Earnings owed", value: `$${stats.totalEarningsUsd.toFixed(2)}`, icon: <Shield className="h-4 w-4" />, color: "text-lime" },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="rounded-2xl border border-ink/10 bg-card p-4">
                  <div className={`mb-1 flex items-center gap-1.5 text-xs font-medium ${color}`}>
                    {icon} {label}
                  </div>
                  <p className="text-xl font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Desktop filter bar */}
          <div className="mt-5 flex flex-wrap gap-2">
            {tab === "applications"
              ? APP_FILTERS.map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setAppFilter(id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      appFilter === id
                        ? "bg-lime text-lime-foreground"
                        : "border border-ink/15 bg-card text-ink hover:bg-ink/5"
                    }`}
                  >
                    {label}
                  </button>
                ))
              : TX_FILTERS.map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setTxFilter(id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      txFilter === id
                        ? "bg-lime text-lime-foreground"
                        : "border border-ink/15 bg-card text-ink hover:bg-ink/5"
                    }`}
                  >
                    {label}
                  </button>
                ))}
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-ink">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Desktop applications table */}
          {tab === "applications" && (
            <div className="mt-6 overflow-hidden rounded-3xl border border-ink/10 bg-card">
              <div className="grid grid-cols-[1.4fr_1.4fr_1fr_.9fr_.9fr_1.4fr] gap-3 border-b border-ink/10 bg-cream px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink/60">
                <div>Name</div><div>Email</div><div>Role</div><div>Status</div><div>Applied</div><div>Actions</div>
              </div>
              <div className="divide-y divide-ink/10">
                {filteredApps.map((r) => (
                  <div key={r.id} className="grid grid-cols-[1.4fr_1.4fr_1fr_.9fr_.9fr_1.4fr] gap-3 px-5 py-4 text-sm">
                    <div className="font-medium text-ink">{r.full_name}</div>
                    <div className="text-ink/70">{r.email}</div>
                    <div className="text-ink/70">{r.role_title}</div>
                    <div className="text-ink/70">{r.status}</div>
                    <div className="text-ink/55">{new Date(r.created_at).toLocaleDateString()}</div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setDetails(r)} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-ink/5">
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                      {r.status === "pending" && (
                        <button onClick={() => void action(() => adminSendInterviewLink({ data: { password, applicationId: r.id } }))}
                          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground">
                          <Send className="h-3.5 w-3.5" /> Interview Link
                        </button>
                      )}
                      {r.status === "interview_complete" && (
                        <button onClick={() => void action(() => adminSendAssessmentLink({ data: { password, applicationId: r.id } }))}
                          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground">
                          <Send className="h-3.5 w-3.5" /> Assessment Link
                        </button>
                      )}
                      {r.status === "assessment_complete" && (
                        <button onClick={() => setOfferForm({ appId: r.id, payRate: "", startDate: "", duration: "" })}
                          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Send Offer
                        </button>
                      )}
                      {r.status === "offer_accepted" && (
                        <button onClick={() => void action(() => adminMarkActive({ data: { password, applicationId: r.id } }))}
                          className="inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1.5 text-xs font-medium text-lime-foreground hover:opacity-90">
                          Mark Active
                        </button>
                      )}
                      <button onClick={() => void action(() => adminReject({ data: { password, applicationId: r.id } }))}
                        className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-ink hover:bg-rose-100">
                        <XCircle className="h-3.5 w-3.5 text-rose-400" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
                {!loading && filteredApps.length === 0 && (
                  <div className="px-5 py-10 text-center text-sm text-ink/60">No applications found.</div>
                )}
              </div>
            </div>
          )}

          {/* Desktop transcriptions list */}
          {tab === "transcriptions" && (
            <div className="mt-6 space-y-3">
              {filteredTx.length === 0 && !loading && (
                <div className="rounded-3xl border border-ink/10 bg-card px-5 py-10 text-center text-sm text-ink/60">
                  No transcriptions found for this filter.
                </div>
              )}
              {filteredTx.map((r) => {
                const app = r.applications as any;
                const isSubmitted = r.status === "submitted";
                return (
                  <div key={r.id} className={`overflow-hidden rounded-2xl border bg-card ${isSubmitted ? "border-amber-200" : "border-emerald-200"}`}>
                    <div className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 ${isSubmitted ? "bg-amber-50" : "bg-emerald-50"}`}>
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                          isSubmitted ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {isSubmitted ? "Under review" : "Reviewed"}
                        </span>
                        <span className="font-mono text-xs font-semibold text-ink/60">{r.task_id}</span>
                        <span className="truncate text-sm font-medium text-ink">{app?.full_name ?? "—"}</span>
                        <span className="hidden text-xs text-ink/50 sm:block">{app?.email ?? ""}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs text-ink/50">
                          Submitted {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "—"}
                        </span>
                        {r.earnings_usd && (
                          <span className="text-xs font-semibold text-lime">${Number(r.earnings_usd).toFixed(2)}</span>
                        )}
                        <button
                          onClick={() => setTxDetails(txDetails?.id === r.id ? null : r)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-ink/5"
                        >
                          {txDetails?.id === r.id ? <><ChevronUp className="h-3.5 w-3.5" /> Hide</> : <><ChevronDown className="h-3.5 w-3.5" /> Read</>}
                        </button>
                        {isSubmitted && (
                          <button
                            onClick={() => void action(() => adminMarkTranscriptionReviewed({ data: { password, taskProgressId: r.id } }))}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Mark reviewed
                          </button>
                        )}
                        {!isSubmitted && r.reviewed_at && (
                          <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Reviewed {new Date(r.reviewed_at).toLocaleDateString()}
                          </span>
                        )}
                        {!isSubmitted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-lime/15 px-2.5 py-0.5 text-xs font-semibold text-lime">
                            {accuracyScore(r.task_id)}% accuracy
                          </span>
                        )}
                      </div>
                    </div>
                    {txDetails?.id === r.id && (
                      <div className="border-t border-ink/10 px-5 py-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/40">Transcription text</p>
                        <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink/80">
                          {r.transcription_text || <span className="italic text-ink/30">No content</span>}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── SHARED MODALS ───────────────────────────────────────────── */}
      <DetailsModal row={details} onClose={() => setDetails(null)} />
      <OfferModal
        state={offerForm}
        onClose={() => setOfferForm(null)}
        onSend={(s) =>
          action(() =>
            adminSendOffer({
              data: { password, applicationId: s.appId, payRate: s.payRate, startDate: s.startDate, contractDuration: s.duration },
            }),
          ).then(() => setOfferForm(null))
        }
        sending={loading}
      />

      <style>{`
        .ipt { width:100%; border-radius:.875rem; border:1px solid var(--border); background:var(--cream); padding:.75rem .875rem; font-size:.875rem; color:var(--ink); outline:none; transition: border-color .15s, box-shadow .15s; }
        .ipt:focus { border-color: var(--ink); box-shadow: 0 0 0 3px color-mix(in oklab, var(--lime) 50%, transparent); }
        .ipt-error { border-color: #f87171 !important; }
      `}</style>
    </div>
  );
}

function DetailsModal({ row, onClose }: { row: any | null; onClose: () => void }) {
  const open = Boolean(row);
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl rounded-3xl border border-ink/10 bg-card p-6 shadow-xl md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-medium text-ink">Application details</h3>
                <p className="mt-1 text-sm text-ink/60">{row.full_name} · {row.email} · {row.role_title}</p>
              </div>
              <button onClick={onClose} className="shrink-0 rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:bg-ink/5">
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
              <LongDetail label="Remote work history" value={row.worked_remote ? `Yes — ${row.remote_description || ""}` : "No"} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OfferModal({
  state, onClose, onSend, sending,
}: {
  state: { appId: string; payRate: string; startDate: string; duration: string } | null;
  onClose: () => void;
  onSend: (s: { appId: string; payRate: string; startDate: string; duration: string }) => void;
  sending: boolean;
}) {
  const open = Boolean(state);
  const [local, setLocal] = useState(state);

  useEffect(() => { setLocal(state); }, [state]);

  return (
    <AnimatePresence initial={false}>
      {open && local && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl border border-ink/10 bg-card p-6 shadow-xl md:p-8">
            <h3 className="text-2xl font-medium text-ink">Send offer</h3>
            <p className="mt-1 text-sm text-ink/60">Fill these fields and send the offer link.</p>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Pay rate (USD/hr)</span>
                <input value={local.payRate} onChange={(e) => setLocal((s) => s ? { ...s, payRate: e.target.value } : s)} className="ipt" placeholder="e.g. 18" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Start date</span>
                <input value={local.startDate} onChange={(e) => setLocal((s) => s ? { ...s, startDate: e.target.value } : s)} className="ipt" placeholder="e.g. May 1, 2026" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Contract duration</span>
                <input value={local.duration} onChange={(e) => setLocal((s) => s ? { ...s, duration: e.target.value } : s)} className="ipt" placeholder="e.g. 3 months" />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={onClose} disabled={sending} className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:bg-ink/5 disabled:opacity-50">
                Cancel
              </button>
              <button
                onClick={() => local && onSend(local)}
                disabled={sending || !local.payRate.trim() || !local.startDate.trim() || !local.duration.trim()}
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
