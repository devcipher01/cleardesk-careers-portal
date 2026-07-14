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
  adminBulkMarkReviewed,
  adminGetStats,
  adminGetContractorBreakdown,
} from "@/lib/server/actions";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
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
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Worknesta" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Tab = "applications" | "transcriptions" | "stats";
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
type TxStatusFilter = "submitted" | "reviewed" | "all";
type TxTimeFilter = "all" | "2h" | "4h" | "today";

interface Stats {
  totalContractors: number;
  totalSubmitted: number;
  underReview: number;
  totalReviewed: number;
  totalEarningsUsd: number;
}

interface ContractorRow {
  name: string;
  email: string;
  submitted: number;
  reviewed: number;
  earnings: number;
}

const APP_FILTERS: [AppFilter, string][] = [
  ["all", "All"],
  ["pending", "Pending"],
  ["interview_sent", "Interview sent"],
  ["assessment_sent", "Assessment sent"],
  ["offer_sent", "Offer sent"],
  ["active", "Active"],
  ["rejected", "Rejected"],
];

const TX_STATUS_FILTERS: [TxStatusFilter, string][] = [
  ["submitted", "Under review"],
  ["reviewed", "Reviewed"],
  ["all", "All tasks"],
];

const TX_TIME_FILTERS: [TxTimeFilter, string][] = [
  ["all", "All time"],
  ["today", "Today"],
  ["4h", "Last 4 hrs"],
  ["2h", "Last 2 hrs"],
];

function sinceIso(filter: TxTimeFilter): string | undefined {
  if (filter === "all") return undefined;
  const d = new Date();
  if (filter === "2h") d.setHours(d.getHours() - 2);
  else if (filter === "4h") d.setHours(d.getHours() - 4);
  else if (filter === "today") { d.setHours(0, 0, 0, 0); }
  return d.toISOString();
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}

function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("transcriptions");
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
  const [txStatusFilter, setTxStatusFilter] = useState<TxStatusFilter>("submitted");
  const [txTimeFilter, setTxTimeFilter] = useState<TxTimeFilter>("all");
  const [txRows, setTxRows] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  // Stats tab
  const [contractorRows, setContractorRows] = useState<ContractorRow[]>([]);

  // Restore session — verify with server before trusting stored password.
  useEffect(() => {
    const restore = async () => {
      try {
        const stored = sessionStorage.getItem("wn_admin_password");
        if (!stored) return;
        setPassword(stored);
        await adminCheckPassword({ data: { password: stored } });
        setAuthed(true);
      } catch {
        try { sessionStorage.removeItem("wn_admin_password"); } catch { /* ignore */ }
      }
    };
    void restore();
  }, []);

  const isAuthError = (msg: string) => msg.toLowerCase() === "invalid admin password";

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
      if (isAuthError(msg)) setAuthed(false);
    } finally {
      setLoading(false);
    }
  };

  const loadTx = async (pwd = password, sf = txStatusFilter, tf = txTimeFilter) => {
    setLoading(true);
    setError("");
    try {
      const since = sinceIso(tf);
      const [txRes, statsRes] = await Promise.all([
        adminListTranscriptions({ data: { password: pwd, status: sf, since } }),
        adminGetStats({ data: { password: pwd } }),
      ]);
      setTxRows(txRes.rows);
      setStats(statsRes);
    } catch (e: any) {
      const msg: string = e?.message || "Failed to load transcriptions";
      setError(msg);
      setTxRows([]);
      if (isAuthError(msg)) setAuthed(false);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (pwd = password) => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, breakdownRes] = await Promise.all([
        adminGetStats({ data: { password: pwd } }),
        adminGetContractorBreakdown({ data: { password: pwd } }),
      ]);
      setStats(statsRes);
      setContractorRows(breakdownRes.contractors);
    } catch (e: any) {
      const msg: string = e?.message || "Failed to load stats";
      setError(msg);
      if (isAuthError(msg)) setAuthed(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authed || !password) return;
    if (tab === "applications") void loadApps(password, appFilter);
    else if (tab === "transcriptions") void loadTx(password, txStatusFilter, txTimeFilter);
    else void loadStats(password);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, tab, appFilter, txStatusFilter, txTimeFilter]);

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
      else if (tab === "transcriptions") await loadTx(password, txStatusFilter, txTimeFilter);
      else await loadStats(password);
    } catch (e: any) {
      setError(e?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkMarkReviewed = async () => {
    const since = sinceIso(txTimeFilter) ?? new Date(0).toISOString();
    await action(() => adminBulkMarkReviewed({ data: { password, since } }));
    setBulkConfirm(false);
  };

  const submittedInView = filteredTx.filter((r) => r.status === "submitted").length;

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

  // ── SIDEBAR NAV ITEMS ─────────────────────────────────────────────────────
  const NAV_ITEMS: [Tab, string, React.ReactNode][] = [
    ["transcriptions", "Transcriptions", <FileText key="f" className="h-4 w-4" />],
    ["applications",   "Applications",   <Users    key="u" className="h-4 w-4" />],
    ["stats",          "Contractor stats", <BarChart3 key="b" className="h-4 w-4" />],
  ];

  // ── AUTHENTICATED DASHBOARD ───────────────────────────────────────────────
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
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* Section nav */}
          <div>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink/40">Dashboard</p>
            <div className="space-y-1">
              {NAV_ITEMS.map(([id, label, icon]) => (
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

          {/* Status filter (transcriptions) */}
          {tab === "transcriptions" && (
            <div>
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink/40">Status</p>
              <div className="space-y-0.5">
                {TX_STATUS_FILTERS.map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => { setTxStatusFilter(id); setSidebarOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                      txStatusFilter === id
                        ? "bg-ink text-ink-foreground font-medium"
                        : "text-ink hover:bg-ink/5"
                    }`}
                  >
                    {label}
                    {txStatusFilter === id && <CheckCircle2 className="h-3.5 w-3.5 opacity-70" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time filter (transcriptions) */}
          {tab === "transcriptions" && (
            <div>
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink/40">Time window</p>
              <div className="space-y-0.5">
                {TX_TIME_FILTERS.map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => { setTxTimeFilter(id); setSidebarOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                      txTimeFilter === id
                        ? "bg-ink text-ink-foreground font-medium"
                        : "text-ink hover:bg-ink/5"
                    }`}
                  >
                    <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 opacity-60" />{label}</span>
                    {txTimeFilter === id && <CheckCircle2 className="h-3.5 w-3.5 opacity-70" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* App filter */}
          {tab === "applications" && (
            <div>
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink/40">Filter</p>
              <div className="space-y-0.5">
                {APP_FILTERS.map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => { setAppFilter(id); setSidebarOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                      appFilter === id
                        ? "bg-ink text-ink-foreground font-medium"
                        : "text-ink hover:bg-ink/5"
                    }`}
                  >
                    {label}
                    {appFilter === id && <CheckCircle2 className="h-3.5 w-3.5 opacity-70" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats summary */}
          {stats && (
            <div>
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-ink/40">Overview</p>
              <div className="space-y-1.5">
                {[
                  { label: "Active contractors", value: stats.totalContractors },
                  { label: "Total submitted", value: stats.totalSubmitted },
                  { label: "Under review", value: stats.underReview },
                  { label: "Reviewed", value: stats.totalReviewed },
                  { label: "Earnings owed", value: `$${stats.totalEarningsUsd.toFixed(2)}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-ink/10 px-3 py-2.5">
                    <span className="text-xs text-ink/60">{label}</span>
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
            onClick={() => {
              if (tab === "applications") void loadApps();
              else if (tab === "transcriptions") void loadTx();
              else void loadStats();
              setSidebarOpen(false);
            }}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink/15 py-2.5 text-sm font-medium text-ink hover:bg-ink/5 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
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
            {tab === "applications" ? "Applications" : tab === "transcriptions" ? "Transcriptions" : "Contractor Stats"}
          </p>
          {tab !== "stats" && (
            <p className="text-[11px] text-ink/50">
              {resultCount} result{resultCount !== 1 ? "s" : ""}
              {tab === "transcriptions" && txTimeFilter !== "all" ? ` · ${TX_TIME_FILTERS.find(([id]) => id === txTimeFilter)?.[1]}` : ""}
            </p>
          )}
        </div>

        <div className="relative shrink-0">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-32 rounded-xl border border-ink/15 bg-cream py-2 pl-8 pr-3 text-xs focus:border-ink focus:outline-none focus:ring-2 focus:ring-lime/30"
            placeholder="Search…"
          />
        </div>
      </header>

      {/* ── MOBILE CONTENT ──────────────────────────────────────────── */}
      <div className="md:hidden px-4 py-4 space-y-3">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-ink">
            <strong>Error:</strong> {error}
          </div>
        )}
        {loading && (
          <div className="py-12 text-center text-sm text-ink/50">Loading…</div>
        )}

        {/* Mobile: Bulk action (transcriptions) */}
        {tab === "transcriptions" && !loading && submittedInView > 0 && txStatusFilter === "submitted" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-medium text-amber-800 mb-2">
              {submittedInView} task{submittedInView !== 1 ? "s" : ""} under review
              {txTimeFilter !== "all" ? ` in ${TX_TIME_FILTERS.find(([id]) => id === txTimeFilter)?.[1]?.toLowerCase()}` : ""}
            </p>
            {!bulkConfirm ? (
              <button
                onClick={() => setBulkConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-800"
              >
                <Zap className="h-3.5 w-3.5" /> Mark all as reviewed
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-800">Sure? This marks {submittedInView} tasks.</span>
                <button onClick={() => void handleBulkMarkReviewed()} disabled={loading}
                  className="rounded-full bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-800 disabled:opacity-50">
                  Confirm
                </button>
                <button onClick={() => setBulkConfirm(false)}
                  className="rounded-full border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-800">
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mobile: Transcription task cards */}
        {tab === "transcriptions" && !loading && (
          <div className="space-y-2">
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
                  className={`rounded-2xl border bg-card overflow-hidden ${
                    isSubmitted ? "border-amber-200" : "border-emerald-200"
                  }`}
                >
                  <div className="px-4 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          isSubmitted ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {isSubmitted ? "Under review" : "Reviewed"}
                        </span>
                        <span className="font-mono text-[11px] text-ink/50">{r.task_id}</span>
                      </div>
                      <p className="text-sm font-medium text-ink truncate">{app?.full_name ?? "—"}</p>
                      <p className="text-xs text-ink/50 truncate">{app?.email ?? ""}</p>
                      <p className="mt-1 text-[11px] text-ink/40">
                        {isSubmitted ? "Submitted" : "Reviewed"} {relativeTime(isSubmitted ? r.submitted_at : r.reviewed_at)}
                      </p>
                    </div>
                    {r.earnings_usd && (
                      <span className="shrink-0 text-sm font-semibold text-lime">${Number(r.earnings_usd).toFixed(2)}</span>
                    )}
                  </div>
                  {isSubmitted && (
                    <div className="border-t border-ink/8 px-4 py-3">
                      <button
                        onClick={() => void action(() => adminMarkTranscriptionReviewed({ data: { password, taskProgressId: r.id } }))}
                        disabled={loading}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark as reviewed
                      </button>
                    </div>
                  )}
                  {!isSubmitted && r.reviewed_at && (
                    <div className="border-t border-emerald-100 px-4 py-2.5 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs text-emerald-600">Reviewed {new Date(r.reviewed_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile: Applications cards */}
        {tab === "applications" && !loading && (
          <div className="space-y-2">
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
                  <p className="mt-0.5 text-[11px] text-ink/40">Applied {new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-ink/8 px-4 py-3">
                  <button onClick={() => setDetails(r)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-ink/5">
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  {r.status === "pending" && (
                    <button onClick={() => void action(() => adminSendInterviewLink({ data: { password, applicationId: r.id } }))}
                      className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground">
                      <Send className="h-3.5 w-3.5" /> Interview
                    </button>
                  )}
                  {r.status === "interview_complete" && (
                    <button onClick={() => void action(() => adminSendAssessmentLink({ data: { password, applicationId: r.id } }))}
                      className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground">
                      <Send className="h-3.5 w-3.5" /> Assessment
                    </button>
                  )}
                  {r.status === "assessment_complete" && (
                    <button onClick={() => setOfferForm({ appId: r.id, payRate: "", startDate: "", duration: "" })}
                      className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Offer
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
          </div>
        )}

        {/* Mobile: Stats */}
        {tab === "stats" && !loading && (
          <div className="space-y-3">
            {stats && (
              <div className="rounded-2xl border border-ink/10 bg-card p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/40">Overview</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Active contractors", value: stats.totalContractors },
                    { label: "Total tasks submitted", value: stats.totalSubmitted },
                    { label: "Under review", value: stats.underReview },
                    { label: "Reviewed", value: stats.totalReviewed },
                    { label: "Earnings owed", value: `$${stats.totalEarningsUsd.toFixed(2)}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl border border-ink/10 bg-cream p-3">
                      <p className="text-[11px] text-ink/50">{label}</p>
                      <p className="text-lg font-semibold text-ink">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-2xl border border-ink/10 bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-ink/10">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Per Contractor</p>
              </div>
              {contractorRows.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-ink/50">No data yet.</p>
              )}
              {contractorRows.map((c) => (
                <div key={c.email} className="flex items-center justify-between gap-3 border-b border-ink/8 last:border-0 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{c.name}</p>
                    <p className="text-xs text-ink/50 truncate">{c.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-ink/60">{c.submitted} pending · {c.reviewed} reviewed</p>
                    {c.earnings > 0 && <p className="text-xs font-semibold text-lime">${c.earnings.toFixed(2)}</p>}
                  </div>
                </div>
              ))}
            </div>
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
                  : tab === "transcriptions"
                  ? <><span>Transcription</span> <span className="font-serif italic">review.</span></>
                  : <><span>Contractor</span> <span className="font-serif italic">stats.</span></>
                }
              </h1>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {tab !== "stats" && (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="ipt pl-9"
                    placeholder={tab === "applications" ? "Search name, email, role..." : "Search name, email, task ID..."}
                  />
                </div>
              )}
              <button
                onClick={() => {
                  if (tab === "applications") void loadApps();
                  else if (tab === "transcriptions") void loadTx();
                  else void loadStats();
                }}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-ink-foreground transition hover:bg-lime hover:text-lime-foreground disabled:opacity-50"
              >
                Refresh <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Desktop tabs */}
          <div className="mt-6 flex gap-2 border-b border-ink/10 pb-0">
            {NAV_ITEMS.map(([id, label, icon]) => (
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

          {/* Desktop stats bar */}
          {stats && (tab === "transcriptions" || tab === "stats") && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { label: "Active contractors", value: stats.totalContractors, color: "text-ink" },
                { label: "Total submitted", value: stats.totalSubmitted, color: "text-sky-600" },
                { label: "Under review", value: stats.underReview, color: "text-amber-600" },
                { label: "Reviewed", value: stats.totalReviewed, color: "text-emerald-600" },
                { label: "Earnings owed", value: `$${stats.totalEarningsUsd.toFixed(2)}`, color: "text-lime" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-2xl border border-ink/10 bg-card p-4">
                  <p className={`mb-1 text-xs font-medium ${color}`}>{label}</p>
                  <p className="text-xl font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Desktop filter row */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {tab === "applications" && APP_FILTERS.map(([id, label]) => (
              <button key={id} onClick={() => setAppFilter(id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  appFilter === id ? "bg-lime text-lime-foreground" : "border border-ink/15 bg-card text-ink hover:bg-ink/5"
                }`}>
                {label}
              </button>
            ))}

            {tab === "transcriptions" && (
              <>
                {TX_STATUS_FILTERS.map(([id, label]) => (
                  <button key={id} onClick={() => setTxStatusFilter(id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      txStatusFilter === id ? "bg-lime text-lime-foreground" : "border border-ink/15 bg-card text-ink hover:bg-ink/5"
                    }`}>
                    {label}
                  </button>
                ))}
                <span className="text-ink/20">|</span>
                {TX_TIME_FILTERS.map(([id, label]) => (
                  <button key={id} onClick={() => setTxTimeFilter(id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                      txTimeFilter === id ? "bg-ink text-ink-foreground" : "border border-ink/15 bg-card text-ink hover:bg-ink/5"
                    }`}>
                    <Clock className="h-3.5 w-3.5 opacity-60" /> {label}
                  </button>
                ))}
                {submittedInView > 0 && txStatusFilter === "submitted" && (
                  <>
                    <span className="text-ink/20">|</span>
                    {!bulkConfirm ? (
                      <button onClick={() => setBulkConfirm(true)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700">
                        <Zap className="h-3.5 w-3.5" /> Mark all {submittedInView} as reviewed
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5">
                        <span className="text-sm text-amber-800">Mark {submittedInView} tasks reviewed?</span>
                        <button onClick={() => void handleBulkMarkReviewed()} disabled={loading}
                          className="rounded-full bg-amber-700 px-3 py-1 text-xs font-medium text-white hover:bg-amber-800 disabled:opacity-50">
                          Confirm
                        </button>
                        <button onClick={() => setBulkConfirm(false)}
                          className="rounded-full border border-amber-300 px-3 py-1 text-xs font-medium text-amber-800">
                          Cancel
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
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
                      <button onClick={() => setDetails(r)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-ink/5">
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                      {r.status === "pending" && (
                        <button onClick={() => void action(() => adminSendInterviewLink({ data: { password, applicationId: r.id } }))}
                          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground">
                          <Send className="h-3.5 w-3.5" /> Interview
                        </button>
                      )}
                      {r.status === "interview_complete" && (
                        <button onClick={() => void action(() => adminSendAssessmentLink({ data: { password, applicationId: r.id } }))}
                          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground">
                          <Send className="h-3.5 w-3.5" /> Assessment
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
            <div className="mt-6 overflow-hidden rounded-3xl border border-ink/10 bg-card">
              {/* Table header */}
              <div className="grid grid-cols-[2fr_1.5fr_.9fr_.8fr_.8fr_auto] gap-4 border-b border-ink/10 bg-cream px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink/60">
                <div>Contractor</div>
                <div>Email</div>
                <div>Task ID</div>
                <div>Submitted</div>
                <div>Status</div>
                <div>Action</div>
              </div>
              <div className="divide-y divide-ink/8">
                {filteredTx.length === 0 && !loading && (
                  <div className="px-5 py-10 text-center text-sm text-ink/60">
                    No transcriptions found for this filter.
                  </div>
                )}
                {filteredTx.map((r) => {
                  const app = r.applications as any;
                  const isSubmitted = r.status === "submitted";
                  return (
                    <div key={r.id} className={`grid grid-cols-[2fr_1.5fr_.9fr_.8fr_.8fr_auto] gap-4 items-center px-5 py-3.5 text-sm ${
                      isSubmitted ? "bg-amber-50/40" : ""
                    }`}>
                      <div className="font-medium text-ink truncate">{app?.full_name ?? "—"}</div>
                      <div className="text-ink/60 truncate text-xs">{app?.email ?? ""}</div>
                      <div className="font-mono text-xs text-ink/70">{r.task_id}</div>
                      <div className="text-xs text-ink/50">{relativeTime(r.submitted_at)}</div>
                      <div>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          isSubmitted ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {isSubmitted ? "Pending" : "Reviewed"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        {isSubmitted ? (
                          <button
                            onClick={() => void action(() => adminMarkTranscriptionReviewed({ data: { password, taskProgressId: r.id } }))}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground hover:bg-lime hover:text-lime-foreground disabled:opacity-50 whitespace-nowrap"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Mark reviewed
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 whitespace-nowrap">
                            <CheckCircle2 className="h-3 w-3" />
                            {r.reviewed_at ? relativeTime(r.reviewed_at) : "Done"}
                          </span>
                        )}
                        {!isSubmitted && r.earnings_usd && (
                          <span className="text-xs font-semibold text-lime">${Number(r.earnings_usd).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Desktop stats / contractor breakdown */}
          {tab === "stats" && (
            <div className="mt-6 space-y-6">
              <div className="overflow-hidden rounded-3xl border border-ink/10 bg-card">
                <div className="border-b border-ink/10 bg-cream px-5 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">Per-Contractor Breakdown</p>
                </div>
                <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 border-b border-ink/8 bg-cream/60 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink/50">
                  <div>Name</div>
                  <div>Email</div>
                  <div>Pending</div>
                  <div>Reviewed</div>
                  <div>Earnings</div>
                </div>
                <div className="divide-y divide-ink/8">
                  {contractorRows.length === 0 && !loading && (
                    <div className="px-5 py-10 text-center text-sm text-ink/60">No data yet.</div>
                  )}
                  {contractorRows.map((c) => (
                    <div key={c.email} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-4 items-center px-5 py-3.5 text-sm">
                      <div className="font-medium text-ink truncate">{c.name}</div>
                      <div className="text-xs text-ink/60 truncate">{c.email}</div>
                      <div className={`font-medium ${c.submitted > 0 ? "text-amber-600" : "text-ink/40"}`}>
                        {c.submitted}
                      </div>
                      <div className={`font-medium ${c.reviewed > 0 ? "text-emerald-600" : "text-ink/40"}`}>
                        {c.reviewed}
                      </div>
                      <div className={`font-semibold ${c.earnings > 0 ? "text-lime" : "text-ink/40"}`}>
                        {c.earnings > 0 ? `$${c.earnings.toFixed(2)}` : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="mt-8 py-12 text-center text-sm text-ink/50">Loading…</div>
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
