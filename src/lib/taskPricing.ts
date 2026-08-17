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

export function nairaFromUsd(usd: number) {
  return Math.round(usd * NGN_PER_USD_TASK);
}

export function usdFromNaira(naira: number) {
  return naira / NGN_PER_USD_TASK;
}

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export const TASK_PRICES_NAIRA = {
  m1t01: nairaFromUsd(12),
  m1t02: nairaFromUsd(12),
  m1t03: nairaFromUsd(15),
  m1t04: nairaFromUsd(15),
  m1t05: nairaFromUsd(25),
  m1t06: nairaFromUsd(25),
} as const;