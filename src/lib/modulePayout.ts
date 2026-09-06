import { MODULE_PAYOUT_MIN_ACCURACY, effectiveAccuracyPercent } from "@/lib/taskAccuracy";

export const MODULE_TASK_COUNTS: Record<number, number> = { 1: 6, 2: 7, 3: 7, 4: 6 };

/**
 * Current NG cohort: tasks 1–4 have no stored accuracy_score, so do not average
 * for payout. PH modules should turn this on and persist scores at review time.
 */
export const USE_STORED_MODULE_ACCURACY_PAYOUT = false;

export type ModulePayoutKind = "pending_review" | "payable" | "below_accuracy" | "incomplete";

export type ModulePayoutTask = {
  earningsNaira: number;
  status: string;
  text?: string;
  dbAccuracyScore?: number | null;
  durationMin: number;
};

export type ModulePayoutResult = {
  kind: ModulePayoutKind;
  complete: boolean;
  averageAccuracy: number | null;
  payableNaira: number;
  pendingNaira: number;
  reviewedCount: number;
  pendingCount: number;
};

function moduleAverageFromStoredScores(reviewed: ModulePayoutTask[]): number | null {
  const stored = reviewed
    .map((t) => t.dbAccuracyScore)
    .filter((s): s is number => s != null && Number.isFinite(Number(s)))
    .map((s) => Math.round(Number(s)));
  if (stored.length === 0 || stored.length !== reviewed.length) return null;
  return stored.reduce((a, b) => a + b, 0) / stored.length;
}

/**
 * Payout is per completed module after review.
 * Incomplete/expired modules never pay. Under-review amounts are held, not earned.
 * Accuracy averaging is off until stored scores exist for every task (PH).
 */
export function evaluateModulePayout(
  expectedCount: number,
  submittedTasks: ModulePayoutTask[],
): ModulePayoutResult {
  const reviewed = submittedTasks.filter((t) => t.status === "reviewed");
  const pending = submittedTasks.filter((t) => t.status === "submitted");
  const complete = submittedTasks.length >= expectedCount && expectedCount > 0;
  const pendingNaira = pending.reduce((s, t) => s + t.earningsNaira, 0);
  const listTotal = submittedTasks.reduce((s, t) => s + t.earningsNaira, 0);

  const averageAccuracy = USE_STORED_MODULE_ACCURACY_PAYOUT
    ? moduleAverageFromStoredScores(reviewed)
    : null;

  const base = {
    complete,
    averageAccuracy,
    pendingNaira,
    reviewedCount: reviewed.length,
    pendingCount: pending.length,
  };

  if (pending.length > 0) {
    return { ...base, kind: "pending_review", payableNaira: 0 };
  }
  if (!complete) {
    return { ...base, kind: "incomplete", payableNaira: 0 };
  }
  if (!USE_STORED_MODULE_ACCURACY_PAYOUT) {
    return { ...base, kind: "below_accuracy", payableNaira: 0 };
  }
  if (averageAccuracy != null && averageAccuracy >= MODULE_PAYOUT_MIN_ACCURACY) {
    return { ...base, kind: "payable", payableNaira: listTotal };
  }
  return { ...base, kind: "below_accuracy", payableNaira: 0 };
}
