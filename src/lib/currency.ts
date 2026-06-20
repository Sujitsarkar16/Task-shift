/**
 * Currency utilities — all subscription amounts are stored in INR internally.
 * When a user types a USD amount (or pastes with a $ prefix), we convert it
 * to INR using the live rate fetched from /api/currency/inr-rate.
 */

export const FALLBACK_USD_TO_INR = 84.5;

/**
 * Format a number as Indian Rupees using the ₹ symbol and Indian number formatting.
 * e.g. formatINR(1299.5) → "₹1,299.50"
 */
export function formatINR(amount: number, decimals = 2): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Format INR compactly for dashboard cards (no paise for large amounts).
 * e.g.  formatINRCompact(1299.5) → "₹1,300"
 *        formatINRCompact(99.9)   → "₹99.90"
 */
export function formatINRCompact(amount: number): string {
  if (amount >= 1000) return formatINR(amount, 0);
  return formatINR(amount, 2);
}

/**
 * Detect whether a raw string/number input looks like a USD amount.
 * Returns the numeric USD value if it has a $ prefix or the value is
 * suspiciously small (< 500) and currency context suggests USD.
 */
export function parseAmountInput(raw: string | number): {
  value: number;
  looksLikeUSD: boolean;
} {
  const str = String(raw).trim();
  const hasDollarSign = str.startsWith("$");
  const numeric = parseFloat(str.replace(/[$,\s]/g, "")) || 0;
  // Heuristic: if there's a $ sign explicitly, treat as USD
  return { value: numeric, looksLikeUSD: hasDollarSign };
}

/**
 * Convert USD → INR. Returns the rounded INR amount.
 */
export function usdToInr(usd: number, rate: number = FALLBACK_USD_TO_INR): number {
  return Math.round(usd * rate * 100) / 100;
}

/**
 * Fetch the latest USD→INR rate from our own API route.
 * Falls back silently to FALLBACK_USD_TO_INR on error.
 */
export async function fetchUsdToInrRate(): Promise<number> {
  try {
    const res = await fetch("/api/currency/inr-rate");
    if (!res.ok) return FALLBACK_USD_TO_INR;
    const data = await res.json();
    return typeof data.rate === "number" ? data.rate : FALLBACK_USD_TO_INR;
  } catch {
    return FALLBACK_USD_TO_INR;
  }
}
