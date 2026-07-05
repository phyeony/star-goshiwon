import type { ReviewCategoryScoreRow } from "./types";

export const BASIC_REVIEW_CATEGORY_LABELS = [
  "Staff",
  "Cleanliness",
  "Location",
  "Facilities",
  "Comfort",
  "Value for money",
] as const;

export const ADDITIONAL_REVIEW_CATEGORY_LABELS = [
  "Room view",
  "WiFi",
  "Bed rating",
] as const;

// The 4-smiley scale Booking.com uses for category sub-scores.
export const SMILEY_SCORES = [2.5, 5, 7.5, 10] as const;

// Booking.com requires a written comment for extreme low scores; we mirror that.
export const LOW_SCORE_COMMENT_THRESHOLD = 3;

const MAX_NAME = 80;
const MAX_COUNTRY = 60;
const MAX_TITLE = 120;
const MAX_COMMENT = 2000;

export type ValidReviewSubmission = {
  guest_name: string;
  country: string | null;
  score: number;
  title: string | null;
  positive: string | null;
  negative: string | null;
  basic_categories: ReviewCategoryScoreRow[];
  additional_categories: ReviewCategoryScoreRow[];
};

type Result =
  | { ok: true; value: ValidReviewSubmission }
  | { ok: false; error: string };

function optionalText(
  value: unknown,
  max: number,
  field: string
): { value: string | null } | { error: string } {
  if (value === undefined || value === null) return { value: null };
  if (typeof value !== "string") return { error: `${field} must be text` };
  const trimmed = value.trim();
  if (trimmed.length === 0) return { value: null };
  if (trimmed.length > max)
    return { error: `${field} must be ${max} characters or fewer` };
  return { value: trimmed };
}

function parseCategories(
  value: unknown,
  allowedLabels: readonly string[],
  field: string
): { value: ReviewCategoryScoreRow[] } | { error: string } {
  if (value === undefined || value === null) return { value: [] };
  if (!Array.isArray(value)) return { error: `${field} must be a list` };
  const seen = new Set<string>();
  const rows: ReviewCategoryScoreRow[] = [];
  for (const entry of value) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof (entry as { label?: unknown }).label !== "string" ||
      typeof (entry as { score?: unknown }).score !== "number"
    ) {
      return { error: `${field} entries must be { label, score }` };
    }
    const { label, score } = entry as { label: string; score: number };
    if (!allowedLabels.includes(label))
      return { error: `Unknown ${field} label: ${label}` };
    if (seen.has(label)) return { error: `Duplicate ${field} label: ${label}` };
    if (!SMILEY_SCORES.includes(score as (typeof SMILEY_SCORES)[number]))
      return {
        error: `${field} scores must be one of ${SMILEY_SCORES.join(", ")}`,
      };
    seen.add(label);
    rows.push({ label, score });
  }
  return { value: rows };
}

export function validateReviewSubmission(input: unknown): Result {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Invalid submission" };
  }
  const body = input as Record<string, unknown>;

  if (
    typeof body.guest_name !== "string" ||
    body.guest_name.trim().length === 0
  ) {
    return { ok: false, error: "Please enter your name" };
  }
  const guestName = body.guest_name.trim();
  if (guestName.length > MAX_NAME) {
    return { ok: false, error: `Name must be ${MAX_NAME} characters or fewer` };
  }

  if (
    typeof body.score !== "number" ||
    !Number.isInteger(body.score) ||
    body.score < 1 ||
    body.score > 10
  ) {
    return {
      ok: false,
      error: "Overall score must be a whole number from 1 to 10",
    };
  }

  const country = optionalText(body.country, MAX_COUNTRY, "Country");
  if ("error" in country) return { ok: false, error: country.error };
  const title = optionalText(body.title, MAX_TITLE, "Title");
  if ("error" in title) return { ok: false, error: title.error };
  const positive = optionalText(body.positive, MAX_COMMENT, "Comment");
  if ("error" in positive) return { ok: false, error: positive.error };
  const negative = optionalText(body.negative, MAX_COMMENT, "Comment");
  if ("error" in negative) return { ok: false, error: negative.error };

  if (
    body.score <= LOW_SCORE_COMMENT_THRESHOLD &&
    !positive.value &&
    !negative.value
  ) {
    return {
      ok: false,
      error:
        "For a low score, please add a short comment about what went wrong",
    };
  }

  const basic = parseCategories(
    body.basic_categories,
    BASIC_REVIEW_CATEGORY_LABELS,
    "category"
  );
  if ("error" in basic) return { ok: false, error: basic.error };
  const additional = parseCategories(
    body.additional_categories,
    ADDITIONAL_REVIEW_CATEGORY_LABELS,
    "extra category"
  );
  if ("error" in additional) return { ok: false, error: additional.error };

  return {
    ok: true,
    value: {
      guest_name: guestName,
      country: country.value,
      score: body.score,
      title: title.value,
      positive: positive.value,
      negative: negative.value,
      basic_categories: basic.value,
      additional_categories: additional.value,
    },
  };
}
