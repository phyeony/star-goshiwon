// USD is canonical (PayPal settles in USD). KRW shown to guests is approximate
// and derived from KRW_PER_USD. Update KRW_PER_USD manually if FX drifts >5%.
export const KRW_PER_USD = 1480;

export const BEDDING_FEE_USD = 15;

// Refundable security deposit, prepaid via PayPal with the booking and refunded
// via PayPal at the end of the stay. Set in USD (PayPal canonical) and roughly
// equivalent to ₩100,000 at KRW_PER_USD = 1480.
export const DEPOSIT_USD = 70;

// Long-stay discount applies at 4 weeks (28 nights) or longer. The 28-night
// threshold is a code constant; the discount *rate* is stored per-room in the
// database (rooms.long_stay_discount). There is no weekly discount — every
// night is billed at the flat nightly rate until the stay reaches 28 nights.
export const LONG_STAY_MIN_NIGHTS = 28;
export const DEFAULT_LONG_STAY_DISCOUNT = 0.4;

export interface UsdPriceTier {
  nightly: number; // canonical flat per-night rate (USD)
  daily: number; // alias of `nightly`, kept for existing consumers
  weekly: number; // 7 nights at the nightly rate (no discount)
  monthly: number; // 28 nights with the long-stay discount, rounded
  discount: number; // long-stay discount fraction, e.g. 0.15
}

// A room's stored pricing. The nightly rate and discount live in the database
// as the single source of truth (see the room-nightly-rate migration).
export interface RoomPricing {
  nightly_rate_usd: number;
  long_stay_discount: number;
}

// Derive the display tier from a room's stored nightly rate + discount. Postgres
// numeric columns can arrive as strings over the wire, so coerce to number here
// (this is the one place raw stored pricing enters the pricing math).
export function deriveTier(
  nightly: number | string,
  discount: number | string = DEFAULT_LONG_STAY_DISCOUNT,
): UsdPriceTier {
  const n = Number(nightly) || 0;
  const d = Number(discount) || 0;
  return {
    nightly: n,
    daily: n,
    weekly: n * 7,
    monthly: Math.round(n * LONG_STAY_MIN_NIGHTS * (1 - d)),
    discount: d,
  };
}

export function roomTier(room: RoomPricing): UsdPriceTier {
  return deriveTier(room.nightly_rate_usd, room.long_stay_discount);
}

export interface PricingBreakdown {
  // The room is billed per night at a flat rate — 1 week = 7 nights,
  // 4 weeks = 28 nights. `nightsSubtotal` is nightlyRate × nights; the only
  // discount is the long-stay discount at 28+ nights, shown as `totalSaving`
  // on a single "Monthly discount" line. total = nightsSubtotal - totalSaving
  // + beddingFee + deposit.
  nights: number;
  nightlyRate: number;
  nightsSubtotal: number;
  discountApplied: boolean;
  discount: number;
  totalSaving: number;
  savingLabel: string;
  subtotal: number;
  beddingFee: number;
  deposit: number;
  total: number;
  label: string;
}

export function calculateEstimate(
  prices: { nightly: number | string; discount?: number | string },
  checkIn: string,
  checkOut: string,
  options: { beddingPrepaid?: boolean } = {}
): PricingBreakdown {
  const nightlyRate = Number(prices.nightly) || 0;
  const discountRate =
    prices.discount === undefined
      ? DEFAULT_LONG_STAY_DISCOUNT
      : Number(prices.discount) || 0;

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  const empty: PricingBreakdown = {
    nights: 0,
    nightlyRate,
    nightsSubtotal: 0,
    discountApplied: false,
    discount: 0,
    totalSaving: 0,
    savingLabel: "",
    subtotal: 0,
    beddingFee: 0,
    deposit: 0,
    total: 0,
    label: "",
  };

  if (nights <= 0) return empty;

  const nightsSubtotal = nights * nightlyRate;

  // The only discount is the long-stay discount at 28+ nights (4 weeks).
  const discountApplied = nights >= LONG_STAY_MIN_NIGHTS;
  const discount = discountApplied
    ? Math.round(nightsSubtotal * discountRate)
    : 0;
  const beddingFee = options.beddingPrepaid ? BEDDING_FEE_USD : 0;
  const deposit = DEPOSIT_USD;
  const total = nightsSubtotal - discount + beddingFee + deposit;

  return {
    nights,
    nightlyRate,
    nightsSubtotal,
    discountApplied,
    discount,
    totalSaving: discount,
    savingLabel: discountApplied ? "Monthly discount" : "",
    subtotal: nightsSubtotal,
    beddingFee,
    deposit,
    total,
    label: `${nights} night${nights > 1 ? "s" : ""}`,
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

// Replace pricing placeholders in static copy (guide markdown) with values
// derived from a room tier, so rate/discount changes in the DB flow through
// without editing the copy. Supported tokens:
//   {{DISCOUNT_PCT}}  {{WEEKLY_USD}}  {{WEEKLY_KRW}}  {{MONTHLY_USD}}  {{MONTHLY_KRW}}
export function fillPricingTokens(text: string, tier: UsdPriceTier): string {
  return text
    .replaceAll("{{DISCOUNT_PCT}}", String(Math.round(tier.discount * 100)))
    .replaceAll("{{WEEKLY_USD}}", formatUSD(tier.weekly))
    .replaceAll("{{WEEKLY_KRW}}", formatApproxKRW(tier.weekly))
    .replaceAll("{{MONTHLY_USD}}", formatUSD(tier.monthly))
    .replaceAll("{{MONTHLY_KRW}}", formatApproxKRW(tier.monthly));
}
