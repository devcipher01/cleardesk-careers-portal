import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, CheckCircle2, ExternalLink, Loader2, Lock } from "lucide-react";
import { OrgShell, OrgShellLoading } from "@/components/workspace/OrgShell";
import {
  NETVERIFY_REGISTRAR_URL,
  PIPELINE_SESSION_KEY,
  VDE_TOKEN_REGEX,
} from "@/lib/careersPipeline";
import {
  getWorkspaceSetupState,
  getWorkspaceBySession,
  submitWorkspaceContract,
  submitWorkspaceNda,
} from "@/lib/server/actions";
import { getStoredAppId, saveAppId } from "@/lib/client/session";

interface Search {
  applicationId?: string;
}

type Phase = "loading" | "denied" | "nda" | "contract" | "submitting" | "success";

export const Route = createFileRoute("/onboarding/workspace-setup")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    applicationId: typeof search.applicationId === "string" ? search.applicationId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Technical Workspace Configuration — Worknesta" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WorkspaceSetupPage,
});

function WorkspaceSetupPage() {
  const { applicationId: searchId } = Route.useSearch();
  const [applicationId, setApplicationId] = useState<string | undefined>(searchId);
  const [phase, setPhase] = useState<Phase>("loading");
  const [candidateName, setCandidateName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");

  const [ndaName, setNdaName] = useState("");
  const [ndaSignature, setNdaSignature] = useState("");
  const [ndaSubmitting, setNdaSubmitting] = useState(false);

  const [declareAccurate, setDeclareAccurate] = useState(false);
  const [agreeSchedule, setAgreeSchedule] = useState(false);
  const [employeeSignature, setEmployeeSignature] = useState("");
  const [witnessSignature, setWitnessSignature] = useState("");
  const [vdeToken, setVdeToken] = useState("");
  const [contractError, setContractError] = useState("");

  useEffect(() => {
    void (async () => {
      // Persist URL applicationId immediately so it survives navigation and tab reopen
      if (searchId) saveAppId(searchId);

      // 1. Try session (cookie-first, localStorage fallback for Vercel serverless cookie issues)
      try {
        const sess = await getWorkspaceBySession({ data: { clientAppId: searchId ?? getStoredAppId() } });
        if (sess.authenticated) {
          const id = sess.applicationId;
          saveAppId(id);
          setApplicationId(id);
          setCandidateName(sess.candidateName);
          setRoleTitle(sess.roleTitle);
          if (sess.contractSubmitted) {
            setPhase("success");
            return;
          }
          if (sess.ndaSigned) {
            setPhase("contract");
            setEmployeeSignature(sess.candidateName.split(" ")[0] ?? "");
          } else {
            setPhase("nda");
          }
          return;
        }
      } catch {
        /* fall through to URL/sessionStorage */
      }

      // 2. Fall back to URL param → sessionStorage → localStorage
      const id =
        searchId ||
        (typeof window !== "undefined" ? sessionStorage.getItem(PIPELINE_SESSION_KEY) : null) ||
        getStoredAppId() ||
        undefined;

      if (!id) {
        setPhase("denied");
        return;
      }
      setApplicationId(id);

      try {
        const state = await getWorkspaceSetupState({ data: { applicationId: id } });
        if (!state.allowed) {
          setPhase("nda");
          return;
        }
        setCandidateName(state.candidateName);
        setRoleTitle(state.roleTitle);
        if (state.ndaLegalName) setNdaName(state.ndaLegalName);
        if (state.contractSubmitted) {
          setPhase("success");
        } else if (state.ndaSigned) {
          setPhase("contract");
          setEmployeeSignature(state.ndaLegalName);
        } else {
          setPhase("nda");
        }
      } catch {
        setPhase("denied");
      }
    })();
  }, [searchId]);

  const tokenValid = useMemo(() => VDE_TOKEN_REGEX.test(vdeToken.trim().toUpperCase()), [vdeToken]);

  const contractReady =
    declareAccurate &&
    agreeSchedule &&
    employeeSignature.trim().length >= 2 &&
    witnessSignature.trim().length >= 2 &&
    tokenValid;

  const submitNda = () => {
    if (!applicationId || ndaName.trim().length < 2 || ndaSignature.trim().length < 2) return;
    void (async () => {
      setNdaSubmitting(true);
      try {
        await submitWorkspaceNda({
          data: { applicationId, legalName: ndaName.trim(), signature: ndaSignature.trim() },
        });
        setEmployeeSignature(ndaName.trim());
        setPhase("contract");
      } catch (e) {
        setContractError(e instanceof Error ? e.message : "NDA submission failed");
      } finally {
        setNdaSubmitting(false);
      }
    })();
  };

  const submitContract = () => {
    if (!applicationId || !contractReady) return;
    void (async () => {
      setContractError("");
      setPhase("submitting");
      try {
        await new Promise((r) => setTimeout(r, 3000));
        await submitWorkspaceContract({
          data: {
            applicationId,
            declareAccurate: true,
            agreeSchedule: true,
            employeeSignature: employeeSignature.trim(),
            witnessSignature: witnessSignature.trim(),
            vdeToken: vdeToken.trim().toUpperCase(),
          },
        });
        saveAppId(applicationId);
        setPhase("success");
      } catch (e) {
        setContractError(e instanceof Error ? e.message : "Contract submission failed");
        setPhase("contract");
      }
    })();
  };

  if (phase === "loading") {
    return <OrgShellLoading activeNav="setup" />;
  }

  if (phase === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1419] px-4">
        <div className="max-w-md text-center">
          <Lock className="mx-auto h-10 w-10 text-slate-500" />
          <h1 className="mt-4 text-xl font-medium text-white">Restricted access</h1>
          <p className="mt-3 text-sm text-slate-400">
            Open the link from your qualification email, or sign in to your workspace.
          </p>
          <Link
            to="/workspace/signin"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-lime px-5 py-2.5 text-sm font-medium text-ink"
          >
            Sign in <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1419] px-4">
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-lime" />
          <p className="mt-6 text-lg font-medium text-white">
            Verifying agreement and network signature…
          </p>
        </div>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <OrgShell candidateName={candidateName} roleTitle={roleTitle} activeNav="setup">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center"
        >
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />
          <h1 className="mt-6 text-2xl font-medium text-white md:text-3xl">
            Contract executed — pending activation
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-emerald-100/80">
            Your agreement and network verification are on file. Head to your task queue to begin your first transcription module.
          </p>
          <Link
            to="/workspace/tasks"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-lime px-6 py-3 text-sm font-semibold text-ink"
          >
            Go to tasks <ArrowUpRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </OrgShell>
    );
  }

  return (
    <OrgShell candidateName={candidateName} roleTitle={roleTitle} activeNav="setup">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace setup
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
          Agreement & payment terms
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign required documents and confirm compensation before accessing production tasks.
        </p>

        <div className="mt-8 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-300">
            Compensation
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
            $24.50{" "}
            <span className="text-base font-normal text-slate-300">USD / hour</span>
          </p>
          <p className="mt-2 text-sm text-sky-100/80">
            Paid twice monthly (1st and 15th) via Wise or Payoneer. Independent contractor — not an employee relationship.
          </p>
        </div>

        {/* Step 1: NDA */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-sm font-bold text-ink">
              1
            </span>
            <h2 className="text-xl font-medium text-white">
              Secure Data Non-Disclosure Agreement
            </h2>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            You agree not to disclose, copy, or distribute any client data, training materials, or
            proprietary workflows accessed through Worknesta systems. This agreement remains in
            effect for the duration of your engagement and thereafter.
          </p>
          {phase === "nda" ? (
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-200">
                  Full legal name
                </span>
                <input
                  value={ndaName}
                  onChange={(e) => setNdaName(e.target.value)}
                  className="ipt w-full"
                  placeholder="As shown on government ID"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-200">
                  Digital signature
                </span>
                <input
                  value={ndaSignature}
                  onChange={(e) => setNdaSignature(e.target.value)}
                  className="ipt w-full font-serif italic"
                  placeholder="Type your full name to sign"
                />
              </label>
              {contractError && phase === "nda" && (
                <p className="text-sm text-rose-400">{contractError}</p>
              )}
              <button
                type="button"
                onClick={submitNda}
                disabled={
                  ndaSubmitting ||
                  ndaName.trim().length < 2 ||
                  ndaSignature.trim().length < 2
                }
                className="inline-flex items-center gap-2 rounded-xl bg-lime px-5 py-2.5 text-sm font-semibold text-ink hover:opacity-90 disabled:opacity-50"
              >
                {ndaSubmitting ? "Submitting…" : "Submit signed NDA"}
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> NDA completed
            </p>
          )}
        </div>

        {/* Step 2: Contract */}
        {phase === "contract" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-ink">
                2
              </span>
              <h2 className="text-xl font-medium text-white">
                Employment Contract & Network Verification
              </h2>
            </div>

            <div className="mt-5 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#0b1015] p-4 text-xs leading-relaxed text-slate-400">
              <p className="font-medium text-slate-200">
                Worknesta — Independent Contractor Agreement
              </p>
              <p className="mt-3">
                Compensation: <strong>$24.50/hr USD</strong>, paid twice monthly (1st and 15th)
                via approved disbursement channels. Schedule adherence and data integrity standards
                apply to all production queues. Contractors must maintain secure connectivity,
                complete assigned training cohorts, and follow client-specific style guides.
                Misrepresentation of credentials or network identity voids this agreement.
              </p>
              <p className="mt-3">
                Working hours align with your stated availability; overtime requires lead approval.
                Corporate policies on confidentiality, equipment standards, and quality thresholds
                are incorporated by reference.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={declareAccurate}
                  onChange={(e) => setDeclareAccurate(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I declare that all information provided in this onboarding profile is accurate.
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={agreeSchedule}
                  onChange={(e) => setAgreeSchedule(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  I agree to adhere to the schedule and data integrity guidelines outlined in this
                  contract.
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-200">
                  Employee Signature
                </span>
                <input
                  value={employeeSignature}
                  onChange={(e) => setEmployeeSignature(e.target.value)}
                  className="ipt w-full font-serif italic"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-200">
                  Authorized Witness / Declaration Attestation
                </span>
                <input
                  value={witnessSignature}
                  onChange={(e) => setWitnessSignature(e.target.value)}
                  className="ipt w-full font-serif italic"
                  placeholder="Witness full name"
                />
              </label>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                <p className="text-sm text-amber-100/90">
                  Provision an active{" "}
                  <strong>128-bit V-VDE Handshake Token</strong> to satisfy data privacy compliance
                  before workspace activation.
                </p>
                <a
                  href={NETVERIFY_REGISTRAR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                >
                  Proceed to Authorized Registrar (NetVerify Express)
                  <ExternalLink className="h-4 w-4" />
                </a>
                <label className="mt-4 block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-200">
                    Enter Verified 16-Digit V-VDE Token ID
                  </span>
                  <input
                    value={vdeToken}
                    onChange={(e) => setVdeToken(e.target.value.toUpperCase())}
                    className="ipt w-full font-mono text-sm tracking-wide"
                    placeholder="VDE-A1B2-C3D4-E5F6"
                  />
                  {vdeToken && !tokenValid && (
                    <span className="mt-1 flex items-center gap-1 text-xs text-rose-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Format: VDE-XXXX-XXXX-XXXX (A–Z, 0–9)
                    </span>
                  )}
                </label>
              </div>

              {contractError && (
                <p className="text-sm text-rose-400">{contractError}</p>
              )}

              <button
                type="button"
                onClick={submitContract}
                disabled={!contractReady}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime px-6 py-3 text-sm font-semibold text-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                Submit Signed Contract & Verify Workspace
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {phase === "nda" && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-500">
            <Lock className="h-4 w-4 shrink-0" />
            Employment Contract & Network Verification unlocks after NDA submission.
          </div>
        )}
      </div>
      <style>{`
        .ipt { width: 100%; max-width: 100%; box-sizing: border-box; border-radius: 0.75rem; border: 1px solid rgba(255,255,255,0.15); background: #0b1015; padding: 0.75rem 0.875rem; font-size: 0.875rem; color: #f1f5f9; outline: none; }
        .ipt:focus { border-color: #c8f542; box-shadow: 0 0 0 3px rgba(200,245,66,0.2); }
      `}</style>
    </OrgShell>
  );
}
