import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  Save,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { OrgShell, OrgShellLoading } from "@/components/workspace/OrgShell";
import {
  getWorkspaceBySession,
  getPaymentInfoBySession,
  savePaymentInfoBySession,
  getDocumentsBySession,
  uploadDocumentBySession,
} from "@/lib/server/actions";
import { getSessionData } from "@/lib/client/supabase";

export const Route = createFileRoute("/workspace/settings")({
  head: () => ({ meta: [{ title: "Settings — Worknesta Workspace" }] }),
  component: SettingsPage,
});

type SessionState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "ready"; candidateName: string; roleTitle: string; email: string; applicationId: string; appId: string | null; accessToken: string | null };

type DocInfo = {
  doc_type: string;
  file_name: string;
  uploaded_at: string;
  verified_at: string | null;
  verified_by: string | null;
};

const DOC_TYPE_LABELS: Record<string, { label: string; description: string; icon: React.ReactNode; required: boolean }> = {
  medical_cert: {
    label: "Medical transcription certificate",
    description: "Required to unlock medical tasks (tasks 8–10 in Module 1). PDF, JPG or PNG · max 5 MB.",
    icon: <Activity className="h-4 w-4 text-rose-500" />,
    required: true,
  },
  id_document: {
    label: "Government-issued ID",
    description: "A copy of your national ID, passport, or driver's licence for identity verification. PDF, JPG or PNG · max 5 MB.",
    icon: <FileText className="h-4 w-4 text-sky-500" />,
    required: false,
  },
};

function DocCard({
  docType,
  info,
  uploading,
  onUpload,
}: {
  docType: string;
  info: DocInfo | null;
  uploading: boolean;
  onUpload: (docType: string, file: File) => void;
}) {
  const meta = DOC_TYPE_LABELS[docType] ?? { label: docType, description: "", icon: <FileText className="h-4 w-4 text-gray-400" />, required: false };
  const fileRef = useRef<HTMLInputElement>(null);
  const verified = Boolean(info?.verified_at);

  return (
    <div className={`rounded-xl border p-4 ${verified ? "border-emerald-200 bg-emerald-50/50" : info ? "border-sky-200 bg-sky-50/40" : "border-gray-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 shrink-0">{meta.icon}</div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-gray-900">{meta.label}</p>
              {meta.required && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-600">Required</span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-gray-500">{meta.description}</p>
            {info && (
              <p className="mt-1 text-xs text-gray-400">
                Uploaded: <span className="font-medium text-gray-600">{info.file_name}</span> · {new Date(info.uploaded_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> Verified
            </span>
          )}
          {info && !verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-medium text-sky-700">
              <ShieldCheck className="h-3 w-3" /> Under review
            </span>
          )}
        </div>
      </div>

      <div className="mt-3">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { onUpload(docType, f); e.target.value = ""; }
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {info ? "Replace document" : "Upload document"}
        </button>
      </div>
    </div>
  );
}

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

  // Documents
  const [docs, setDocs] = useState<DocInfo[]>([]);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [docError, setDocError] = useState("");
  const [docSuccess, setDocSuccess] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const { appId, accessToken } = await getSessionData();
        const s = await getWorkspaceBySession({ data: { clientAppId: appId, accessToken } });
        if (!s.authenticated) { setSession({ status: "unauthenticated" }); return; }
        setSession({ status: "ready", candidateName: s.candidateName, roleTitle: s.roleTitle, email: s.email, applicationId: s.applicationId, appId: appId ?? null, accessToken: accessToken ?? null });

        try {
          const pi = await getPaymentInfoBySession({ data: { clientAppId: appId, accessToken } });
          if (pi) {
            if (pi.payment_method === "wise" || pi.payment_method === "payoneer") setPaymentMethod(pi.payment_method);
            setAccountEmail(pi.account_email ?? "");
            setAccountName(pi.account_name ?? "");
          }
        } catch { /* table may not exist yet */ }

        try {
          const docResult = await getDocumentsBySession({ data: { clientAppId: appId, accessToken } });
          if (docResult.authenticated) setDocs(docResult.docs);
        } catch { /* ignore */ }
      } catch {
        setSession({ status: "unauthenticated" });
      }
    })();
  }, []);

  if (session.status === "loading") return <OrgShellLoading activeNav="settings" />;
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

  const { candidateName, roleTitle, email, appId, accessToken } = session;
  const docMap = Object.fromEntries(docs.map((d) => [d.doc_type, d]));

  async function handleSavePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!accountEmail.trim() || !accountName.trim()) { setPaymentError("All payment fields are required."); return; }
    setPaymentSaving(true);
    setPaymentError("");
    setPaymentSaved(false);
    try {
      const { appId: curId, accessToken: curToken } = await getSessionData();
      await savePaymentInfoBySession({ data: { paymentMethod, accountEmail: accountEmail.trim(), accountName: accountName.trim(), clientAppId: curId, accessToken: curToken } });
      setPaymentSaved(true);
    } catch (err: any) {
      setPaymentError(err?.message ?? "Failed to save payment info.");
    } finally {
      setPaymentSaving(false);
    }
  }

  async function handleUploadDoc(docType: string, file: File) {
    if (file.size > 5 * 1024 * 1024) { setDocError("File too large — maximum 5 MB."); return; }
    setDocError("");
    setDocSuccess("");
    setUploadingDocType(docType);
    try {
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // strip the data URL prefix (e.g. "data:application/pdf;base64,")
          resolve(result.split(",")[1] ?? "");
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { appId: curId, accessToken: curToken } = await getSessionData();
      await uploadDocumentBySession({
        data: {
          docType: docType as "medical_cert" | "id_document" | "other",
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          base64Data,
          clientAppId: curId,
          accessToken: curToken,
        },
      });

      // Refresh docs list
      const docResult = await getDocumentsBySession({ data: { clientAppId: curId, accessToken: curToken } });
      if (docResult.authenticated) setDocs(docResult.docs);
      setDocSuccess("Document uploaded successfully — our team will review it shortly.");
    } catch (err: any) {
      setDocError(err?.message ?? "Upload failed. Please try again.");
    } finally {
      setUploadingDocType(null);
    }
  }

  return (
    <OrgShell candidateName={candidateName} roleTitle={roleTitle} activeNav="settings">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Workspace settings</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">Preferences & payment</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Left column */}
          <div className="space-y-6">

            {/* Account info */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Account</h2>
              <div className="space-y-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-400">Name</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900">{candidateName}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900">{email}</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">Documents</h2>
              </div>
              <p className="mb-4 text-xs text-gray-500">
                Upload required certifications and identity documents. Files are stored securely and reviewed by our team.
              </p>

              {docError && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
                  <X className="h-3.5 w-3.5 shrink-0" /> {docError}
                </div>
              )}
              {docSuccess && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {docSuccess}
                </div>
              )}

              <div className="space-y-3">
                {Object.keys(DOC_TYPE_LABELS).map((docType) => (
                  <DocCard
                    key={docType}
                    docType={docType}
                    info={docMap[docType] ?? null}
                    uploading={uploadingDocType === docType}
                    onUpload={handleUploadDoc}
                  />
                ))}
              </div>
            </div>

            {/* Payment info */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">Payment info</h2>
              </div>
              <p className="mb-4 text-xs text-gray-500">
                Payments are processed on the{" "}
                <span className="font-semibold text-gray-700">1st and 15th</span> of each month via your chosen method.
              </p>
              <form onSubmit={(e) => void handleSavePayment(e)} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Payment method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["wise", "payoneer"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                          paymentMethod === m
                            ? "border-lime bg-lime/10 text-gray-900"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {m === "wise" ? "Wise" : "Payoneer"}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="text-xs font-medium text-gray-600">
                    {paymentMethod === "wise" ? "Wise" : "Payoneer"} account email
                  </span>
                  <input
                    type="email"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-lime/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/20"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-gray-600">
                    Account holder name (as shown on {paymentMethod === "wise" ? "Wise" : "Payoneer"})
                  </span>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Full legal name"
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-lime/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime/20"
                  />
                </label>

                {paymentError && <p className="text-xs text-rose-500">{paymentError}</p>}
                {paymentSaved && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Payment info saved
                  </div>
                )}

                <button
                  type="submit"
                  disabled={paymentSaving}
                  className="inline-flex items-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-50 hover:opacity-90 transition"
                >
                  {paymentSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save payment info
                </button>
              </form>
            </div>

            {/* Notifications */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <BellRing className="h-4 w-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Email reminders", value: notifications, onChange: setNotifications },
                  { label: "Quiet hours (no emails 10pm–7am)", value: quietHours, onChange: setQuietHours },
                ].map(({ label, value, onChange }) => (
                  <label key={label} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 transition">
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => onChange(e.target.checked)}
                      className="h-4 w-4 rounded accent-lime"
                    />
                  </label>
                ))}
                <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <span className="text-sm text-gray-700">Timezone</span>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-lime/50 focus:outline-none"
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
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">

            {/* Pay schedule */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="h-4 w-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">Pay schedule</h2>
              </div>
              <div className="space-y-2">
                {["1st of each month", "15th of each month"].map((d) => (
                  <div key={d} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                    <CalendarDays className="h-3.5 w-3.5 text-lime shrink-0" />
                    {d}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-400">
                Reviewed transcriptions are included in the next scheduled payout.
              </p>
            </div>

            {/* Security */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Security</h2>
                  <p className="mt-2 text-xs leading-5 text-gray-600">
                    Your workspace is protected by a secure session cookie. Sign out when using a shared device.
                  </p>
                  <a
                    href="/api/auth/signout"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                  >
                    Sign out of all sessions
                  </a>
                </div>
              </div>
            </div>

            {/* Earnings link */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Earnings</h2>
              <p className="text-xs text-gray-500 mb-3">View your transcription history and payout status.</p>
              <Link
                to="/workspace/earnings"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition"
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
