/**
 * Public task pricing is shown in Nigerian naira.
 *
 * The legacy submission table still stores a USD-equivalent value, so the
 * conversion helpers keep that storage contract while every user-facing
 * amount uses naira.
 */
export const USD_TO_NGN = 1500;
export const TASK_PAYOUT_FACTOR = 0.5;
export const NGN_PER_USD_TASK = USD_TO_NGN * TASK_PAYOUT_FACTOR;

// Keep existing base factor but apply a further 28% reduction to all task prices
// (0.72 = 1 - 0.28). This reduces displayed task prices by 28% without
// changing other conversion logic.
export const PRICE_FACTOR = 0.85 * 0.72;

export function nairaFromUsd(usd: number) {
  return Math.round(usd * NGN_PER_USD_TASK);
}

export function usdFromNaira(naira: number) {
  return naira / NGN_PER_USD_TASK;
}

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

/** Display FX for Philippines. Same USD task base as Nigeria; change here if PH rates are set separately. */
export const USD_TO_PHP = 58;

export function pesoFromNaira(naira: number) {
  return Math.round(usdFromNaira(naira) * USD_TO_PHP);
}

export function formatPeso(amount: number) {
  return `₱${amount.toLocaleString("en-PH")}`;
}

/** Format a naira-denominated task total for the contractor's market. Nigeria stays ₦. */
export function formatMoney(naira: number, market?: string | null) {
  if (market === "ph") return formatPeso(pesoFromNaira(naira));
  return formatNaira(naira);
}

/** Admin/offer amounts are typed in local currency (naira or pesos). */
export function formatOfferAmount(raw: string | number, market?: string | null) {
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(/,/g, ""));
  if (!Number.isFinite(n)) return String(raw);
  return market === "ph" ? formatPeso(Math.round(n)) : formatNaira(Math.round(n));
}

export function payoutRails(market?: string | null) {
  return market === "ph" ? "Payoneer or bank transfer" : "Wise, Payoneer, or bank transfer";
}

/** Offer/email Friday line. Nigeria keeps the existing Wise wording. */
export function offerPayoutSentence(market?: string | null) {
  return market === "ph"
    ? "You get paid every Friday via Payoneer or bank transfer."
    : "You get paid every Friday via Wise or Payoneer.";
}

export const TASK_PRICES_NAIRA = {
  m1t01: nairaFromUsd(12 * PRICE_FACTOR),
  m1t02: nairaFromUsd(12 * PRICE_FACTOR),
  m1t03: nairaFromUsd(15 * PRICE_FACTOR),
  m1t04: nairaFromUsd(15 * PRICE_FACTOR),
  m1t05: nairaFromUsd(25 * PRICE_FACTOR),
  m1t06: nairaFromUsd(25 * PRICE_FACTOR),
} as const;