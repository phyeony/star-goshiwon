// Registry of policy versions, ordered newest first. Add a new entry whenever
// the live policy changes materially (refund tiers, payment model, etc.).
//
// - `slug` is the URL segment under /policies/archive/<slug> for archived
//   versions, and is omitted for the version that is currently live.
// - Dates are ISO yyyy-mm-dd in Seoul time (KST). `effectiveTo` is omitted on
//   the current version.
// - `id` is internal-only (used for keys / file matching). Never display it
//   to guests — they see effective dates instead.

export interface PolicyVersion {
  /** Internal stable id. Never shown to guests. */
  id: string;
  /** Effective start date, yyyy-mm-dd KST. */
  effectiveFrom: string;
  /** Effective end date (inclusive), yyyy-mm-dd KST. Undefined for the current version. */
  effectiveTo?: string;
  /** Short plain-language description of what this version of the policy says. */
  summary: string;
  /** Korean summary. */
  summaryKo: string;
  /** Archive slug. Undefined for the current version (which lives at /policies). */
  slug?: string;
}

export const POLICY_VERSIONS: PolicyVersion[] = [
  {
    id: "v2-percentage",
    effectiveFrom: "2026-05-09",
    summary:
      "Cancellation refunds are calculated as a tiered percentage of total room rate (100/90/70/50/0) based on how far in advance you cancel. Once you have checked in, the room rate is non-refundable for any unused portion of the stay.",
    summaryKo:
      "취소 환불은 취소 시점에 따라 총 객실료의 비율(100/90/70/50/0)로 산정됩니다. 체크인 이후에는 잔여 숙박분에 대해 객실료가 환불되지 않습니다.",
  },
];

/** The version currently in effect (the one without effectiveTo). */
export const CURRENT_POLICY_VERSION = POLICY_VERSIONS.find(
  (v) => !v.effectiveTo
)!;

/** Past versions, ordered newest first. */
export const ARCHIVED_POLICY_VERSIONS = POLICY_VERSIONS.filter(
  (v) => v.effectiveTo
);

/**
 * Find the policy version that was in effect on a given yyyy-mm-dd date.
 * Returns the current version if the date is on/after its effectiveFrom.
 */
export function getPolicyVersionForDate(
  date: string
): PolicyVersion | undefined {
  return POLICY_VERSIONS.find((v) => {
    if (date < v.effectiveFrom) return false;
    if (v.effectiveTo && date > v.effectiveTo) return false;
    return true;
  });
}

const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Format a yyyy-mm-dd date as a human-readable string in the given locale. */
export function formatPolicyDate(
  iso: string,
  locale: "en" | "ko" = "en"
): string {
  const [y, m, d] = iso.split("-").map((s) => parseInt(s, 10));
  if (!y || !m || !d) return iso;
  if (locale === "ko") return `${y}년 ${m}월 ${d}일`;
  return `${EN_MONTHS[m - 1]} ${d}, ${y}`;
}

/**
 * Human-readable effective-date label, e.g.:
 *   en: "Effective from May 9, 2026" / "Effective May 5 – May 8, 2026"
 *   ko: "2026년 5월 9일부터 적용" / "2026년 5월 5일 ~ 5월 8일 적용"
 */
export function formatEffectiveRange(
  v: PolicyVersion,
  locale: "en" | "ko" = "en"
): string {
  const from = formatPolicyDate(v.effectiveFrom, locale);
  if (!v.effectiveTo) {
    return locale === "ko" ? `${from}부터 적용` : `Effective from ${from}`;
  }
  const to = formatPolicyDate(v.effectiveTo, locale);
  return locale === "ko"
    ? `${from} ~ ${to} 적용`
    : `Effective ${from} – ${to}`;
}

/**
 * User-facing title for a version, used in archive headings, page titles,
 * and metadata. Never includes internal version numbers.
 */
export function formatVersionTitle(
  v: PolicyVersion,
  locale: "en" | "ko" = "en"
): string {
  return locale === "ko"
    ? `이용 약관 (${formatEffectiveRange(v, "ko")})`
    : `Policies (${formatEffectiveRange(v, "en")})`;
}
