/** Minimum module average required for payout. */
export const MODULE_PAYOUT_MIN_ACCURACY = 97;

/** Accuracy from word count vs expected words, or a stable fallback. Capped at 99%. */
export function transcriptionAccuracyPercent(text: string | undefined, durationMin: number): number {
  if (text && text.trim().length > 0) {
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const expectedWords = durationMin * 130;
    return Math.min(99, Math.round((wordCount / expectedWords) * 100));
  }
  return Math.round(85 + (durationMin % 15));
}

/** Prefer a stored review score; otherwise the same display score used on Tasks. */
export function effectiveAccuracyPercent(
  dbScore: number | null | undefined,
  text: string | undefined,
  durationMin: number,
): number {
  if (dbScore != null && Number.isFinite(Number(dbScore))) return Math.round(Number(dbScore));
  return transcriptionAccuracyPercent(text, durationMin);
}
