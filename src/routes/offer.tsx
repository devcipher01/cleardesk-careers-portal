import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { acceptOffer, declineOffer, getOfferByToken } from "@/lib/server/actions";

interface Search {
  token?: string;
}

export const Route = createFileRoute("/offer")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Your Offer — Worknesta" },
      { name: "description", content: "Private offer letter for Worknesta candidates." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OfferPage,
});

function OfferPage() {
  const { token } = Route.useSearch();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [offer, setOffer] = useState<any | null>(null);
  const [decision, setDecision] = useState<"pending" | "accepted" | "declined">("pending");

  const [agree, setAgree] = useState(false);
  const [signature, setSignature] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declineNote, setDeclineNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getOfferByToken({ data: { token } });
        if (!res.valid) {
          setValid(false);
          return;
        }
        setValid(true);
        setOffer(res);
        if (res.acceptedAt) setDecision("accepted");
        if (res.declinedAt) setDecision("declined");
      } catch (e: any) {
        setError(e?.message || "Failed to load offer");
        setValid(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (!token) return <InvalidLink />;
  if (!loading && !valid) return <InvalidLink />;
  if (loading || !offer) return <Loading />;
  if (decision !== "pending") return <DecisionScreen decision={decision} name={offer.candidateName} />;

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const signatureDate = useMemo(
    () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    [],
  );

  const doAccept = async () => {
    setError("");
    if (!agree) return setError("Please confirm you agree to the terms.");
    if (!signature.trim()) return setError("Please type your full legal name as your digital signature.");
    setSubmitting(true);
    try {
      await acceptOffer({ data: { token, agree, signatureName: signature.trim(), signatureDate } });
      setDecision("accepted");
    } catch (e: any) {
      setError(e?.message || "Failed to accept offer");
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  const doDecline = async () => {
    setError("");
    if (!declineReason.trim()) return setError("Please select a reason.");
    setSubmitting(true);
    try {
      await declineOffer({ data: { token, reason: declineReason, note: declineNote.trim() || null } });
      setDecision("declined");
    } catch (e: any) {
      setError(e?.message || "Failed to decline offer");
    } finally {
      setSubmitting(false);
      setDeclineOpen(false);
    }
  };

  return (
    <section className="container-page max-w-3xl py-10 md:py-16">
      <div className="mx-auto rounded-3xl border border-ink/10 bg-card p-6 shadow-xl md:p-10">
        <div className="flex items-start justify-between gap-4">
          <Logo />
          <p className="text-xs text-ink/55">{today}</p>
        </div>

        <div className="my-6 h-px bg-ink/10" />

        <p className="text-ink">Dear {offer.candidateName},</p>
        <p className="mt-4 text-ink/75">
          We are pleased to offer you the position of{" "}
          <span className="font-medium text-ink">{offer.roleTitle}</span> at Worknesta.
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-cream">
          <dl className="divide-y divide-ink/5 text-sm">
            <Row label="Role" value={offer.roleTitle} />
            <Row label="Type" value="Remote Contractor" />
            <Row label="Pay" value={`${offer.payRate} USD per hour`} />
            <Row label="Payment" value="Every Friday via Wise or Payoneer" />
            <Row label="Hours" value="As agreed per week" />
            <Row label="Contract" value={`${offer.contractDuration} initial term, renewable monthly after that`} />
            <Row label="Start date" value={offer.startDate} />
            <Row label="Probation" value="First 2 weeks are paid training and probation period" />
          </dl>
        </div>

        <div className="mt-6 rounded-2xl border border-ink/10 bg-cream p-5 text-sm text-ink/75">
          <p className="font-medium text-ink">Here is what this means in plain English:</p>
          <ul className="mt-3 space-y-2">
            {[
              "✅ You work remotely on your own schedule within your agreed weekly hours",
              "✅ You get paid every Friday — no delays",
              `✅ Your initial contract is ${offer.contractDuration} — renews monthly after that`,
              "✅ All tools you need are free — we never ask you to pay for software",
              "✅ Either party can end the arrangement with 7 days written notice",
              "✅ Your personal data and all client work stays strictly confidential",
              "This is the same contractor model used by companies like Toptal, Deel, and thousands of remote-first businesses worldwide.",
            ].map((l) => (
              <li key={l} className="leading-relaxed">
                {l}
              </li>
            ))}
          </ul>
        </div>

        <div className="my-7 flex items-center gap-3">
          <span className="h-px flex-1 bg-ink/10" />
          <span className="font-script text-xl text-ink/55">Remote Contractor Agreement</span>
          <span className="h-px flex-1 bg-ink/10" />
        </div>

        <div className="max-h-[300px] overflow-y-auto rounded-2xl border border-ink/10 bg-cream p-5 text-sm leading-relaxed text-ink/75">
          <p>
            This Remote Contractor Agreement is entered into between Worknesta, a company registered in the State of Delaware, USA, and the individual identified above (the Contractor).
          </p>
          <Clause n="1" title="REMOTE CONTRACTOR RELATIONSHIP">
            The Contractor is an independent contractor and not an employee of Worknesta. Nothing in this agreement creates an employment relationship, partnership, or joint venture.
          </Clause>
          <Clause n="2" title="CONFIDENTIALITY">
            The Contractor agrees to keep all client data, project materials, internal processes, and proprietary information strictly confidential, both during and after the term of this agreement.
          </Clause>
          <Clause n="3" title="PAYMENT TERMS">
            The Contractor will be paid at the agreed hourly rate stated above. Payments are issued weekly on Fridays via Wise or Payoneer. The Contractor is responsible for all applicable taxes in their country of residence.
          </Clause>
          <Clause n="4" title="HARDWARE & INTERNET">
            The Contractor provides their own hardware (laptop/desktop) and stable internet suitable for remote work.
          </Clause>
          <Clause n="5" title="TOOLS">
            Worknesta provides all software tools at no cost. Worknesta will never charge the Contractor any fees.
          </Clause>
          <Clause n="6" title="TERM & TERMINATION">
            The initial contract term is as stated above. Either party may terminate this agreement with 7 days written notice.
          </Clause>
          <Clause n="7" title="GOVERNING LAW">
            This agreement is governed by the laws of the State of Delaware, USA.
          </Clause>
        </div>

        <div className="mt-7 rounded-2xl border border-ink/10 bg-cream p-5">
          <p className="text-sm font-medium text-ink">Acceptance</p>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/10 bg-card p-4 text-sm text-ink has-[:checked]:border-ink has-[:checked]:bg-lime/20">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
            <span>I have read and agree to the terms of this Remote Contractor Agreement</span>
          </label>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Digital signature (full legal name)</span>
              <input value={signature} onChange={(e) => setSignature(e.target.value)} className="ipt" placeholder="Type your full name" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Date</span>
              <input value={signatureDate} readOnly className="ipt opacity-70" />
            </label>
          </div>
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-butter bg-butter/40 p-4 text-sm text-ink">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>By accepting, you confirm that you have read and agree to the agreement above.</p>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              onClick={() => setDeclineOpen(true)}
              className="rounded-full border border-ink/15 px-5 py-3 text-sm font-medium text-ink transition hover:bg-ink/5"
            >
              Not able to accept? Click to decline
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={!agree || !signature.trim() || submitting}
              className="rounded-full bg-lime px-5 py-3 text-sm font-medium text-lime-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Accept Offer & Sign Agreement →
            </button>
          </div>
        </div>
      </div>

      <ConfirmAcceptModal open={confirmOpen} submitting={submitting} onCancel={() => setConfirmOpen(false)} onConfirm={() => void doAccept()} />
      <DeclineModal
        open={declineOpen}
        submitting={submitting}
        reason={declineReason}
        note={declineNote}
        onReason={setDeclineReason}
        onNote={setDeclineNote}
        onCancel={() => setDeclineOpen(false)}
        onConfirm={() => void doDecline()}
      />

      <style>{`
        .ipt { width:100%; border-radius:.875rem; border:1px solid var(--border); background:var(--cream); padding:.75rem .875rem; font-size:.875rem; color:var(--ink); outline:none; }
        .ipt:focus { border-color: var(--ink); box-shadow: 0 0 0 3px color-mix(in oklab, var(--lime) 50%, transparent); }
      `}</style>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 px-5 py-3">
      <dt className="text-ink/55">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}

function Clause({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="font-medium text-ink">
        {n}. {title}
      </p>
      <p className="mt-1">{children}</p>
    </div>
  );
}

function ConfirmAcceptModal({
  open,
  submitting,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-ink/10 bg-card p-6 shadow-xl"
          >
            <h3 className="text-xl font-medium text-ink">Accept this offer?</h3>
            <p className="mt-2 text-sm text-ink/65">Are you sure you want to accept this offer and sign the agreement?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onCancel}
                disabled={submitting}
                className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:bg-ink/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={submitting}
                className="rounded-full bg-lime px-4 py-2 text-sm font-medium text-lime-foreground hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Confirm"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DecisionScreen({ decision, name }: { decision: "accepted" | "declined"; name: string }) {
  const accepted = decision === "accepted";
  return (
    <section className="container-page max-w-2xl py-16">
      <div className="rounded-3xl border border-ink/10 bg-card p-10 text-center shadow-xl">
        <Logo />
        <div
          className={`mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full ${
            accepted ? "bg-lime text-ink" : "bg-rose/50 text-ink"
          }`}
        >
          {accepted ? <CheckCircle2 className="h-9 w-9" /> : <XCircle className="h-9 w-9" />}
        </div>
        <p className="mt-5 font-script text-2xl text-ink/55">
          {accepted ? "welcome aboard" : "thank you for letting us know"}
        </p>
        <h1 className="mt-1 text-4xl font-medium text-ink md:text-5xl">
          {accepted ? (
            <>
              Welcome to <span className="font-serif italic">Worknesta!</span>
            </>
          ) : (
            <>
              Offer <span className="font-serif italic">declined</span>
            </>
          )}
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-ink/70">
          {accepted
            ? `Your agreement is signed. Check your email for your onboarding link.`
            : `Thank you for letting us know ${name}. We wish you all the best.`}
        </p>
      </div>
    </section>
  );
}

function DeclineModal({
  open,
  submitting,
  reason,
  note,
  onReason,
  onNote,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  submitting: boolean;
  reason: string;
  note: string;
  onReason: (v: string) => void;
  onNote: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-ink/10 bg-card p-6 shadow-xl"
          >
            <h3 className="text-xl font-medium text-ink">Decline offer</h3>
            <p className="mt-2 text-sm text-ink/65">Please share a reason (optional note below).</p>
            <label className="mt-4 block text-sm font-medium text-ink">Reason</label>
            <select
              value={reason}
              onChange={(e) => onReason(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-ink/10 bg-cream p-3 text-sm text-ink outline-none focus:border-ink"
            >
              <option value="">Select…</option>
              <option>Pay rate</option>
              <option>Start date</option>
              <option>Schedule / hours</option>
              <option>Found another opportunity</option>
              <option>Other</option>
            </select>
            <label className="mt-4 block text-sm font-medium text-ink">Optional note</label>
            <textarea
              value={note}
              onChange={(e) => onNote(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-ink/10 bg-cream p-3 text-sm text-ink outline-none focus:border-ink"
              placeholder="Anything you'd like us to know…"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onCancel}
                disabled={submitting}
                className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink hover:bg-ink/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={submitting || !reason}
                className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-ink-foreground hover:bg-ink/90 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Confirm decline"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Loading() {
  return (
    <section className="container-page flex min-h-[60vh] items-center justify-center py-16">
      <div className="text-sm text-ink/60">Loading…</div>
    </section>
  );
}

function InvalidLink() {
  return (
    <section className="container-page flex min-h-[80vh] items-center justify-center py-16">
      <div className="max-w-lg rounded-3xl border border-ink/10 bg-card p-10 text-center shadow-sm">
        <Logo />
        <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-rose/40 text-ink">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="mt-6 text-3xl font-medium text-ink">
          This offer link is <span className="font-serif italic">invalid</span> or has expired.
        </h1>
        <p className="mt-4 text-ink/65">
          Please check your email for the correct offer link or contact us at{" "}
          <a className="underline hover:text-ink" href="mailto:talent@worknesta.com">
            talent@worknesta.com
          </a>
          .
        </p>
      </div>
    </section>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2 text-ink">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-serif text-lg italic text-ink-foreground">
        c
      </span>
      <span className="text-base font-medium">Worknesta</span>
    </div>
  );
}
