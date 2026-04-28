// USD is canonical (PayPal settles in USD). KRW shown to guests is approximate
// and derived from KRW_PER_USD. Update KRW_PER_USD manually if FX drifts >5%.
export const KRW_PER_USD = 1480;

export const BEDDING_FEE_USD = 15;

export interface UsdPriceTier {
  weekly: number;
  daily: number;
  monthly: number; // 4-week rate after 15% discount
}

export const USD_PRICES_BY_SLUG: Record<string, UsdPriceTier> = {
  "economy-room":                        { weekly: 75, daily: 11, monthly: 255 },
  "room-with-private-shower":            { weekly: 88, daily: 13, monthly: 299 },
  "room-with-private-shower-and-toilet": { weekly: 88, daily: 13, monthly: 299 },
};

export function getUsdPrices(slug: string): UsdPriceTier {
  const prices = USD_PRICES_BY_SLUG[slug];
  if (!prices) throw new Error(`No USD prices configured for room: ${slug}`);
  return prices;
}

export interface PricingBreakdown {
  weeks: number;
  days: number;
  weeklyRate: number;
  dailyRate: number;
  weeklySubtotal: number;
  dailySubtotal: number;
  discountApplied: boolean;
  subtotal: number;
  discount: number;
  beddingFee: number;
  total: number;
  label: string;
}

export function calculateEstimate(
  prices: Pick<UsdPriceTier, "weekly" | "daily">,
  checkIn: string,
  checkOut: string,
  options: { beddingPrepaid?: boolean } = {}
): PricingBreakdown {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const totalDays = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  const empty: PricingBreakdown = {
    weeks: 0,
    days: 0,
    weeklyRate: prices.weekly,
    dailyRate: prices.daily,
    weeklySubtotal: 0,
    dailySubtotal: 0,
    discountApplied: false,
    subtotal: 0,
    discount: 0,
    beddingFee: 0,
    total: 0,
    label: "",
  };

  if (totalDays <= 0) return empty;

  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  const weeklySubtotal = weeks * prices.weekly;
  const dailySubtotal = days * prices.daily;
  const subtotal = weeklySubtotal + dailySubtotal;

  // 15% discount for stays of 4 weeks or longer
  const discountApplied = weeks >= 4;
  const discount = discountApplied ? Math.round(subtotal * 0.15) : 0;
  const beddingFee = options.beddingPrepaid ? BEDDING_FEE_USD : 0;
  const total = subtotal - discount + beddingFee;

  const parts: string[] = [];
  if (weeks > 0) parts.push(`${weeks} week${weeks > 1 ? "s" : ""}`);
  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);

  return {
    weeks,
    days,
    weeklyRate: prices.weekly,
    dailyRate: prices.daily,
    weeklySubtotal,
    dailySubtotal,
    discountApplied,
    subtotal,
    discount,
    beddingFee,
    total,
    label: parts.join(", ") || "0 days",
  };
}

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Approximate KRW for display, rounded to nearest ₩1,000, prefixed with "~".
export function formatApproxKRW(usdAmount: number): string {
  const krw = Math.round((usdAmount * KRW_PER_USD) / 1000) * 1000;
  return `~${formatKRW(krw)}`;
}
