# Guest Review Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let real guests submit reviews via admin-minted single-use invite links, with admin moderation, merged into the public `/reviews` page.

**Architecture:** Two new Supabase tables (`review_invites`, `reviews`) accessed through a new `lib/review-queries.ts` (service-client wrappers, same pattern as `lib/queries.ts`). A public guest form at `/review/[token]` posts to `/api/reviews`; admin moderates on a new `/admin/reviews` page backed by `/api/admin/*` routes (middleware + explicit `getAdminUserOrNull()` auth). Approved DB reviews are converted to the existing `GuestReview` shape and merged with the legacy hardcoded Booking.com reviews.

**Tech Stack:** Next.js App Router (deployed via @opennextjs/cloudflare), Supabase (service client), vitest, Playwright, PostHog (`posthog-node`), worker-mailer SMTP via `lib/email.ts`.

**Spec:** `plan/guest-review-form.md` (approved).

## Global Constraints

- **pnpm only** — never npm/yarn. Tests: `pnpm test` (vitest), `pnpm exec tsc --noEmit`, e2e: `pnpm test:e2e`.
- **Admin UI copy is Korean** (see `components/admin/admin-nav.tsx`); guest-facing copy is English.
- **Migrations:** apply to **supabase-dev now** (via `mcp__supabase-dev__apply_migration`); apply to **prod only at deploy time, BEFORE `pnpm run deploy`** (project rule: migrate-then-deploy). The migration is purely additive.
- **Admin API routes** live under `/api/admin/*` (middleware-protected) AND do an explicit `getAdminUserOrNull()` check (pattern: `app/api/admin/requests/[id]/refund/route.ts`).
- **PostHog server events** use `getPostHogClient()` → `capture` → `await posthog.shutdown()` (same file as above).
- **No new dependencies.**
- Category labels must match `lib/reviews.ts` exactly: basic = `Staff, Cleanliness, Location, Facilities, Comfort, Value for money`; additional = `Room view, WiFi, Bed rating`. Category scores are only `2.5 | 5 | 7.5 | 10`. Overall score is an integer 1–10; score ≤ 3 requires at least one comment.
- Review invite links are single-use, expire 90 days after creation, and the guest page must be `noindex`.

---

### Task 1: Migration, types, and review queries

**Files:**
- Create: `supabase/migrations/2026-07-06-guest-reviews.sql`
- Modify: `schema.sql` (append the same DDL), `lib/types.ts` (append review types)
- Create: `lib/review-queries.ts`

**Interfaces:**
- Consumes: `getSupabaseServiceClient()` from `lib/supabase.ts`.
- Produces (used by every later task):
  - Types (in `lib/types.ts`): `ReviewStatus`, `ReviewCategoryScoreRow`, `ReviewInvite`, `ReviewInviteInsert`, `Review`, `ReviewInsert`.
  - Functions (in `lib/review-queries.ts`): `generateReviewToken(): string`, `reviewInviteUrl(token: string): string`, `isReviewInviteOpen(invite: ReviewInvite, now?: Date): boolean`, `createReviewInvite(insert: ReviewInviteInsert): Promise<ReviewInvite>`, `getReviewInviteById(id: string): Promise<ReviewInvite | null>`, `getReviewInviteByToken(token: string): Promise<ReviewInvite | null>`, `getReviewInvites(): Promise<ReviewInvite[]>`, `markReviewInviteUsed(id: string): Promise<void>`, `createReview(insert: ReviewInsert): Promise<Review>`, `getReviews(): Promise<Review[]>`, `getApprovedReviews(): Promise<Review[]>`, `updateReviewStatus(id: string, status: ReviewStatus): Promise<Review>`.

- [ ] **Step 1: Write the migration**

`supabase/migrations/2026-07-06-guest-reviews.sql`:

```sql
-- Guest reviews collected via admin-minted single-use invite links.
-- An invite is the unit of verification: only the admin can create one, so any
-- review that exists came from a real stay (platform or off-platform).
-- Reviews stay 'pending' until the admin approves them.

CREATE TABLE IF NOT EXISTS review_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  guest_name TEXT NOT NULL DEFAULT '',
  guest_email TEXT,
  room_type TEXT NOT NULL,
  booking_request_id UUID REFERENCES booking_requests(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '90 days',
  used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- UNIQUE makes the invite single-use even under a double-submit race.
  invite_id UUID NOT NULL UNIQUE REFERENCES review_invites(id),
  guest_name TEXT NOT NULL,
  country TEXT,
  room_type TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 10),
  title TEXT,
  positive TEXT,
  negative TEXT,
  basic_categories JSONB NOT NULL DEFAULT '[]',
  additional_categories JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews (status);

-- All app access goes through the service-role client, which bypasses RLS.
-- Enabling RLS with no policies blocks any anon/authenticated direct access.
ALTER TABLE review_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
```

Append the same DDL (without this step's prose) to `schema.sql` with a `-- Guest reviews (2026-07-06)` header, matching how earlier migrations were folded in.

- [ ] **Step 2: Apply to supabase-dev**

Use the MCP tool `mcp__supabase-dev__apply_migration` with name `guest_reviews` and the SQL above. Then verify with `mcp__supabase-dev__list_tables` that `review_invites` and `reviews` exist. (Do NOT touch prod — that happens at deploy time.)

- [ ] **Step 3: Add types to `lib/types.ts`** (append at the end):

```ts
// ─── Guest Reviews ───

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ReviewCategoryScoreRow {
  label: string;
  score: number;
}

export interface ReviewInvite {
  id: string;
  token: string;
  guest_name: string;
  guest_email: string | null;
  room_type: string;
  booking_request_id: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}

export interface ReviewInviteInsert {
  token: string;
  guest_name: string;
  guest_email?: string | null;
  room_type: string;
  booking_request_id?: string | null;
}

export interface Review {
  id: string;
  invite_id: string;
  guest_name: string;
  country: string | null;
  room_type: string;
  score: number;
  title: string | null;
  positive: string | null;
  negative: string | null;
  basic_categories: ReviewCategoryScoreRow[];
  additional_categories: ReviewCategoryScoreRow[];
  status: ReviewStatus;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface ReviewInsert {
  invite_id: string;
  guest_name: string;
  country: string | null;
  room_type: string;
  score: number;
  title: string | null;
  positive: string | null;
  negative: string | null;
  basic_categories: ReviewCategoryScoreRow[];
  additional_categories: ReviewCategoryScoreRow[];
}
```

- [ ] **Step 4: Create `lib/review-queries.ts`**

```ts
import { getSupabaseServiceClient } from "./supabase";
import { siteConfig } from "./site-data";
import type {
  Review,
  ReviewInsert,
  ReviewInvite,
  ReviewInviteInsert,
  ReviewStatus,
} from "./types";

// 32 hex chars of Web-Crypto randomness; fine on Cloudflare Workers.
export function generateReviewToken(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

export function reviewInviteUrl(token: string): string {
  return `${siteConfig.url}/review/${token}`;
}

export function isReviewInviteOpen(
  invite: ReviewInvite,
  now: Date = new Date()
): boolean {
  return !invite.used_at && new Date(invite.expires_at) > now;
}

export async function createReviewInvite(
  insert: ReviewInviteInsert
): Promise<ReviewInvite> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("review_invites")
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return data as ReviewInvite;
}

export async function getReviewInviteById(
  id: string
): Promise<ReviewInvite | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("review_invites")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as ReviewInvite) ?? null;
}

export async function getReviewInviteByToken(
  token: string
): Promise<ReviewInvite | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("review_invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  return (data as ReviewInvite) ?? null;
}

export async function getReviewInvites(): Promise<ReviewInvite[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("review_invites")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ReviewInvite[]) ?? [];
}

export async function markReviewInviteUsed(id: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("review_invites")
    .update({ used_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function createReview(insert: ReviewInsert): Promise<Review> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("reviews")
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return data as Review;
}

export async function getReviews(): Promise<Review[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data as Review[]) ?? [];
}

export async function getApprovedReviews(): Promise<Review[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("status", "approved")
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data as Review[]) ?? [];
}

export async function updateReviewStatus(
  id: string,
  status: ReviewStatus
): Promise<Review> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("reviews")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Review;
}
```

- [ ] **Step 5: Typecheck**

Run: `pnpm exec tsc --noEmit` — Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/2026-07-06-guest-reviews.sql schema.sql lib/types.ts lib/review-queries.ts
git commit -m "feat(reviews): guest-review tables, types, and query layer"
```

---

### Task 2: Submission validation (TDD)

**Files:**
- Create: `lib/review-validation.ts`
- Test: `lib/review-validation.test.ts`

**Interfaces:**
- Consumes: `ReviewCategoryScoreRow` from `lib/types.ts`.
- Produces (used by Tasks 3 and 7):
  - Constants: `BASIC_REVIEW_CATEGORY_LABELS: readonly string[]` (Staff, Cleanliness, Location, Facilities, Comfort, Value for money), `ADDITIONAL_REVIEW_CATEGORY_LABELS: readonly string[]` (Room view, WiFi, Bed rating), `SMILEY_SCORES: readonly number[]` ([2.5, 5, 7.5, 10]), `LOW_SCORE_COMMENT_THRESHOLD = 3`.
  - `validateReviewSubmission(input: unknown): { ok: true; value: ValidReviewSubmission } | { ok: false; error: string }` where `ValidReviewSubmission = { guest_name: string; country: string | null; score: number; title: string | null; positive: string | null; negative: string | null; basic_categories: ReviewCategoryScoreRow[]; additional_categories: ReviewCategoryScoreRow[] }`.

- [ ] **Step 1: Write the failing tests**

`lib/review-validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validateReviewSubmission } from "./review-validation";

const base = {
  guest_name: "Test Guest",
  country: "GB",
  score: 9,
  title: "Great stay",
  positive: "Nice view",
  negative: null,
  basic_categories: [{ label: "Staff", score: 10 }],
  additional_categories: [{ label: "WiFi", score: 7.5 }],
};

describe("validateReviewSubmission", () => {
  it("accepts a full valid submission", () => {
    const result = validateReviewSubmission(base);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.score).toBe(9);
      expect(result.value.basic_categories).toEqual([
        { label: "Staff", score: 10 },
      ]);
    }
  });

  it("accepts score-only submissions (everything else optional)", () => {
    const result = validateReviewSubmission({
      guest_name: "Min Guest",
      score: 8,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        guest_name: "Min Guest",
        country: null,
        score: 8,
        title: null,
        positive: null,
        negative: null,
        basic_categories: [],
        additional_categories: [],
      });
    }
  });

  it("trims strings and turns empty strings into null", () => {
    const result = validateReviewSubmission({
      ...base,
      country: "  ",
      title: " Great stay ",
      positive: "",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.country).toBeNull();
      expect(result.value.title).toBe("Great stay");
      expect(result.value.positive).toBeNull();
    }
  });

  it("rejects a missing or blank guest name", () => {
    expect(validateReviewSubmission({ ...base, guest_name: "  " }).ok).toBe(false);
    expect(validateReviewSubmission({ ...base, guest_name: undefined }).ok).toBe(false);
  });

  it("rejects non-integer or out-of-range scores", () => {
    for (const score of [0, 11, 7.5, "9", NaN, undefined]) {
      expect(validateReviewSubmission({ ...base, score }).ok).toBe(false);
    }
  });

  it("requires a comment when the score is 3 or lower", () => {
    const low = { ...base, score: 3, positive: null, negative: null, title: null };
    const rejected = validateReviewSubmission(low);
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) expect(rejected.error).toMatch(/comment/i);
    expect(
      validateReviewSubmission({ ...low, negative: "Too noisy" }).ok
    ).toBe(true);
  });

  it("rejects unknown category labels and off-scale category scores", () => {
    expect(
      validateReviewSubmission({
        ...base,
        basic_categories: [{ label: "Vibes", score: 10 }],
      }).ok
    ).toBe(false);
    expect(
      validateReviewSubmission({
        ...base,
        basic_categories: [{ label: "Staff", score: 6 }],
      }).ok
    ).toBe(false);
    expect(
      validateReviewSubmission({
        ...base,
        additional_categories: [{ label: "Staff", score: 10 }],
      }).ok
    ).toBe(false); // Staff is a basic label, not an additional one
  });

  it("rejects duplicate category labels", () => {
    expect(
      validateReviewSubmission({
        ...base,
        basic_categories: [
          { label: "Staff", score: 10 },
          { label: "Staff", score: 5 },
        ],
      }).ok
    ).toBe(false);
  });

  it("rejects over-length fields", () => {
    expect(
      validateReviewSubmission({ ...base, guest_name: "x".repeat(81) }).ok
    ).toBe(false);
    expect(
      validateReviewSubmission({ ...base, title: "x".repeat(121) }).ok
    ).toBe(false);
    expect(
      validateReviewSubmission({ ...base, positive: "x".repeat(2001) }).ok
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- review-validation`
Expected: FAIL — cannot resolve `./review-validation`.

- [ ] **Step 3: Implement `lib/review-validation.ts`**

```ts
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

export const SMILEY_SCORES = [2.5, 5, 7.5, 10] as const;

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
      return { error: `${field} scores must be one of ${SMILEY_SCORES.join(", ")}` };
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

  if (typeof body.guest_name !== "string" || body.guest_name.trim().length === 0) {
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
    return { ok: false, error: "Overall score must be a whole number from 1 to 10" };
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
      error: "For a low score, please add a short comment about what went wrong",
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- review-validation`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add lib/review-validation.ts lib/review-validation.test.ts
git commit -m "feat(reviews): review submission validation"
```

---

### Task 3: Guest form page and submission API

**Files:**
- Create: `app/review/[token]/page.tsx`, `components/review-form.tsx`, `app/api/reviews/route.ts`

**Interfaces:**
- Consumes: `getReviewInviteByToken`, `isReviewInviteOpen`, `createReview`, `markReviewInviteUsed` (Task 1); `validateReviewSubmission`, category/smiley constants (Task 2); `getPostHogClient` from `lib/posthog-server.ts`.
- Produces: `POST /api/reviews` accepting `{ token: string, guest_name, country?, score, title?, positive?, negative?, basic_categories?, additional_categories? }` → `200 { status: "success" }`, `400 { error }` (validation), `404 { error: "invalid_link" }`, `409 { error: "already_used" }`, `410 { error: "expired" }`. Guest page at `/review/[token]`.

- [ ] **Step 1: Create `app/review/[token]/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ReviewForm } from "@/components/review-form";
import { getReviewInviteByToken, isReviewInviteOpen } from "@/lib/review-queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Write a Review",
  robots: { index: false, follow: false },
};

function Notice({ heading, body }: { heading: string; body: string }) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold text-gray-900">{heading}</h1>
        <p className="mt-4 text-base leading-7 text-gray-600">{body}</p>
        <Link
          href="/reviews"
          className="mt-8 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          See guest reviews
        </Link>
      </div>
    </section>
  );
}

export default async function ReviewInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getReviewInviteByToken(token);

  if (!invite) {
    return (
      <Notice
        heading="This review link is not valid"
        body="Please check the link you received, or contact us if you think this is a mistake."
      />
    );
  }
  if (invite.used_at) {
    return (
      <Notice
        heading="This review link has already been used"
        body="Thank you — your review was already submitted. Each link can only be used once."
      />
    );
  }
  if (!isReviewInviteOpen(invite)) {
    return (
      <Notice
        heading="This review link has expired"
        body="Review links are valid for 90 days after your stay. Contact us if you would still like to leave a review."
      />
    );
  }

  return (
    <section className="bg-[#f5f5f5]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          How was your stay?
        </h1>
        <p className="mt-3 text-base leading-7 text-gray-600">
          Thanks for staying at Star Goshiwon. Only the overall score is
          required — everything else is optional.
        </p>
        <div className="mt-8">
          <ReviewForm
            token={invite.token}
            initialGuestName={invite.guest_name}
            roomType={invite.room_type}
          />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `components/review-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ADDITIONAL_REVIEW_CATEGORY_LABELS,
  BASIC_REVIEW_CATEGORY_LABELS,
  LOW_SCORE_COMMENT_THRESHOLD,
  SMILEY_SCORES,
} from "@/lib/review-validation";

const SMILEY_FACES = ["😞", "🙁", "🙂", "😄"] as const;

function SmileyRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (score: number | null) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex gap-1">
        {SMILEY_SCORES.map((score, i) => (
          <button
            key={score}
            type="button"
            aria-label={`${label}: ${score} out of 10`}
            aria-pressed={value === score}
            onClick={() => onChange(value === score ? null : score)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition ${
              value === score
                ? "border-indigo-600 bg-indigo-50"
                : "border-gray-200 bg-white opacity-60 hover:opacity-100"
            }`}
          >
            {SMILEY_FACES[i]}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewForm({
  token,
  initialGuestName,
  roomType,
}: {
  token: string;
  initialGuestName: string;
  roomType: string;
}) {
  const [score, setScore] = useState<number | null>(null);
  const [basic, setBasic] = useState<Record<string, number | null>>({});
  const [additional, setAdditional] = useState<Record<string, number | null>>({});
  const [title, setTitle] = useState("");
  const [positive, setPositive] = useState("");
  const [negative, setNegative] = useState("");
  const [guestName, setGuestName] = useState(initialGuestName);
  const [country, setCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const needsComment =
    score !== null &&
    score <= LOW_SCORE_COMMENT_THRESHOLD &&
    !positive.trim() &&
    !negative.trim();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (score === null) {
      setError("Please choose an overall score.");
      return;
    }
    if (needsComment) {
      setError("For a low score, please add a short comment about what went wrong.");
      return;
    }
    setSubmitting(true);
    try {
      const toRows = (record: Record<string, number | null>) =>
        Object.entries(record)
          .filter(([, s]) => s !== null)
          .map(([label, s]) => ({ label, score: s as number }));
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          guest_name: guestName,
          country,
          score,
          title,
          positive,
          negative,
          basic_categories: toRows(basic),
          additional_categories: toRows(additional),
        }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(
          body.error === "already_used"
            ? "This link has already been used."
            : body.error === "expired"
              ? "This review link has expired."
              : (body.error ?? "Something went wrong. Please try again."),
        );
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900">
          Thank you for your review!
        </h2>
        <p className="mt-3 text-base leading-7 text-gray-700">
          Your review has been received and will appear on our reviews page
          after a quick check.
        </p>
        <Link
          href="/reviews"
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          See guest reviews
        </Link>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 focus:border-indigo-500 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-sm font-medium text-gray-500">Your stay</p>
        <p className="mt-1 text-base font-semibold text-gray-900">{roomType}</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <label className="text-base font-bold text-gray-900">
          Overall score <span className="text-red-600">*</span>
        </label>
        <p className="mt-1 text-sm text-gray-500">1 = poor, 10 = excellent</p>
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={score === n}
              onClick={() => setScore(n)}
              className={`h-11 rounded-lg border text-base font-semibold transition ${
                score === n
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-indigo-400"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-base font-bold text-gray-900">Rate your stay</p>
        <p className="mt-1 text-sm text-gray-500">
          Optional — tap a face, tap again to clear.
        </p>
        <div className="mt-3 divide-y divide-gray-100">
          {BASIC_REVIEW_CATEGORY_LABELS.map((label) => (
            <SmileyRow
              key={label}
              label={label}
              value={basic[label] ?? null}
              onChange={(s) => setBasic((prev) => ({ ...prev, [label]: s }))}
            />
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-gray-700">A bit more detail</p>
        <div className="mt-1 divide-y divide-gray-100">
          {ADDITIONAL_REVIEW_CATEGORY_LABELS.map((label) => (
            <SmileyRow
              key={label}
              label={label}
              value={additional[label] ?? null}
              onChange={(s) => setAdditional((prev) => ({ ...prev, [label]: s }))}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
        <div>
          <label htmlFor="review-title" className="text-sm font-medium text-gray-700">
            Title <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="review-title"
            type="text"
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`mt-1 ${inputClass}`}
            placeholder="Sum up your stay in one line"
          />
        </div>
        <div>
          <label htmlFor="review-positive" className="text-sm font-medium text-gray-700">
            What did you like? <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="review-positive"
            rows={3}
            maxLength={2000}
            value={positive}
            onChange={(e) => setPositive(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label htmlFor="review-negative" className="text-sm font-medium text-gray-700">
            What could be better? <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="review-negative"
            rows={3}
            maxLength={2000}
            value={negative}
            onChange={(e) => setNegative(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 sm:grid-cols-2">
        <div>
          <label htmlFor="review-name" className="text-sm font-medium text-gray-700">
            Your name <span className="text-red-600">*</span>
          </label>
          <input
            id="review-name"
            type="text"
            required
            maxLength={80}
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label htmlFor="review-country" className="text-sm font-medium text-gray-700">
            Country <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="review-country"
            type="text"
            maxLength={60}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={`mt-1 ${inputClass}`}
            placeholder="e.g. US"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-base font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create `app/api/reviews/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import {
  createReview,
  getReviewInviteByToken,
  isReviewInviteOpen,
  markReviewInviteUsed,
} from "@/lib/review-queries";
import { validateReviewSubmission } from "@/lib/review-validation";
import { getPostHogClient } from "@/lib/posthog-server";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const token = typeof body.token === "string" ? body.token : "";
    if (!token) {
      return NextResponse.json({ error: "invalid_link" }, { status: 404 });
    }

    const invite = await getReviewInviteByToken(token);
    if (!invite) {
      return NextResponse.json({ error: "invalid_link" }, { status: 404 });
    }
    if (invite.used_at) {
      return NextResponse.json({ error: "already_used" }, { status: 409 });
    }
    if (!isReviewInviteOpen(invite)) {
      return NextResponse.json({ error: "expired" }, { status: 410 });
    }

    const result = validateReviewSubmission(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    let review;
    try {
      review = await createReview({
        invite_id: invite.id,
        room_type: invite.room_type,
        ...result.value,
      });
    } catch (error) {
      // 23505 = unique_violation on invite_id: a concurrent submit won.
      if ((error as { code?: string })?.code === "23505") {
        return NextResponse.json({ error: "already_used" }, { status: 409 });
      }
      throw error;
    }
    await markReviewInviteUsed(invite.id);

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: invite.guest_email ?? `review-invite:${invite.id}`,
      event: "review_submitted",
      properties: {
        review_id: review.id,
        invite_id: invite.id,
        score: review.score,
        room_type: review.room_type,
        has_comments: Boolean(review.positive || review.negative),
      },
    });
    await posthog.shutdown();

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Review submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Typecheck and unit tests**

Run: `pnpm exec tsc --noEmit && pnpm test`
Expected: no type errors; all vitest suites pass.

- [ ] **Step 5: Manual smoke check**

Insert a dev invite (via `mcp__supabase-dev__execute_sql`):
`INSERT INTO review_invites (token, guest_name, room_type) VALUES ('devtoken123', 'Dev Guest', 'Private Shower Room') RETURNING token;`
Then `pnpm dev`, open `http://localhost:3000/review/devtoken123`, submit a review with score + one comment, confirm the success panel, reload the URL and confirm the "already been used" notice. Verify a `reviews` row with status `pending` exists.

- [ ] **Step 6: Commit**

```bash
git add app/review components/review-form.tsx app/api/reviews
git commit -m "feat(reviews): guest review form and submission API"
```

---

### Task 4: Merge direct reviews into the public /reviews page

**Files:**
- Modify: `lib/reviews.ts`, `components/guest-reviews.tsx`, `app/reviews/page.tsx`
- Test: `lib/reviews.test.ts` (new)

**Interfaces:**
- Consumes: `Review` type (Task 1), `getApprovedReviews` (Task 1).
- Produces: `GuestReview` gains `source: "booking" | "direct"` (optional, defaults to booking in rendering) and `basicCategories` becomes optional; new pure converter `dbReviewToGuestReview(review: Review): GuestReview` in `lib/reviews.ts`; `ReviewControlsAndList` accepts a `reviews: GuestReview[]` prop.

- [ ] **Step 1: Write the failing converter test**

`lib/reviews.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { dbReviewToGuestReview } from "./reviews";
import type { Review } from "./types";

const dbReview: Review = {
  id: "r1",
  invite_id: "i1",
  guest_name: "Direct Guest",
  country: "US",
  room_type: "Economy Room",
  score: 9,
  title: "Great value",
  positive: "Loved the view",
  negative: null,
  basic_categories: [{ label: "Staff", score: 10 }],
  additional_categories: [],
  status: "approved",
  submitted_at: "2026-07-06T09:30:00.000Z",
  reviewed_at: "2026-07-06T10:00:00.000Z",
};

describe("dbReviewToGuestReview", () => {
  it("maps a DB review onto the GuestReview display shape", () => {
    const review = dbReviewToGuestReview(dbReview);
    expect(review).toEqual({
      id: "r1",
      date: "6 Jul 2026",
      score: 9,
      title: "Great value",
      guest: "Direct Guest",
      country: "US",
      roomType: "Economy Room",
      basicCategories: [{ label: "Staff", score: 10 }],
      additionalCategories: [],
      positive: "Loved the view",
      negative: undefined,
      source: "direct",
    });
  });

  it("falls back to a generic title and empty country", () => {
    const review = dbReviewToGuestReview({
      ...dbReview,
      title: null,
      country: null,
      positive: null,
    });
    expect(review.title).toBe("Review from a verified direct stay");
    expect(review.country).toBe("");
    expect(review.positive).toBeUndefined();
  });
});
```

Run: `pnpm test -- reviews` — Expected: FAIL (`dbReviewToGuestReview` not exported).

- [ ] **Step 2: Update `lib/reviews.ts`**

Change the `GuestReview` type: `basicCategories` optional, add `source`:

```ts
export type GuestReview = {
  id: string;
  date: string;
  score: number;
  title: string;
  guest: string;
  country: string;
  roomType: string;
  basicCategories?: ReviewCategoryScore[];
  additionalCategories?: ReviewCategoryScore[];
  positive?: string;
  negative?: string;
  language?: "en" | "ja" | "de";
  source?: "booking" | "direct";
};
```

Append the converter at the end of the file:

```ts
import type { Review } from "./types";

export function dbReviewToGuestReview(review: Review): GuestReview {
  return {
    id: review.id,
    date: new Date(review.submitted_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Seoul",
    }),
    score: review.score,
    title: review.title ?? "Review from a verified direct stay",
    guest: review.guest_name,
    country: review.country ?? "",
    roomType: review.room_type,
    basicCategories: review.basic_categories,
    additionalCategories: review.additional_categories,
    positive: review.positive ?? undefined,
    negative: review.negative ?? undefined,
    source: "direct",
  };
}
```

(Move the `import type { Review } from "./types";` to the top of the file with a plain `import type` — no runtime import cycle: `lib/types.ts` imports nothing from `lib/reviews.ts`.)

Note: `toLocaleDateString("en-GB", { month: "short" })` yields `"6 Jul 2026"`, the same format as the legacy hardcoded dates, so the existing `parseReviewDate` sorting keeps working.

- [ ] **Step 3: Run converter tests**

Run: `pnpm test -- reviews` — Expected: PASS.

- [ ] **Step 4: Update `components/guest-reviews.tsx`**

Three changes:

1. In `ReviewList`, guard the basic-categories block the same way additional already is, and add a source badge. Replace the categories `<div className="mt-7 space-y-7">` block with:

```tsx
<div className="mt-7 space-y-7">
  {review.basicCategories && review.basicCategories.length > 0 && (
    <InlineCategoryScores
      title="Basic categories"
      categories={review.basicCategories}
    />
  )}
  {review.additionalCategories &&
    review.additionalCategories.length > 0 && (
      <InlineCategoryScores
        title="Additional categories"
        categories={review.additionalCategories}
      />
    )}
</div>
```

2. In the same `ReviewList` article header, under the `roomType` line, add the badge:

```tsx
<p className="mt-2 text-sm font-medium text-blue-700">
  {review.source === "direct"
    ? "Verified direct stay"
    : "Verified stay · Booking.com"}
</p>
```

3. Make `ReviewControlsAndList` take the list as a prop (the page now decides what to show):

```tsx
export function ReviewControlsAndList({
  reviews = guestReviews,
}: {
  reviews?: GuestReview[];
}) {
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  const sortedReviews = useMemo(() => {
    return reviews.slice().sort((a, b) => {
      if (sortOption === "highest") return b.score - a.score;
      if (sortOption === "lowest") return a.score - b.score;
      return parseReviewDate(b.date) - parseReviewDate(a.date);
    });
  }, [reviews, sortOption]);
  // ...rest unchanged
```

- [ ] **Step 5: Update `app/reviews/page.tsx`**

Add `export const dynamic = "force-dynamic";` below the imports. Fetch and merge in the component:

```tsx
import { dbReviewToGuestReview, guestReviews, bookingReviewSummary } from "@/lib/reviews";
import { getApprovedReviews } from "@/lib/review-queries";

export default async function ReviewsPage() {
  const approved = await getApprovedReviews();
  const directReviews = approved.map(dbReviewToGuestReview);
  const allReviews = [...directReviews, ...guestReviews];
  const directAverage =
    directReviews.length > 0
      ? directReviews.reduce((sum, r) => sum + r.score, 0) / directReviews.length
      : null;
  // ...
```

Pass `reviews={allReviews}` to `<ReviewControlsAndList />`. Next to the existing Booking.com score card (inside the same `lg:grid-cols-[1fr_320px]` right column, stacked with `space-y-4`), render a direct-review card only when `directAverage !== null`:

```tsx
{directAverage !== null && (
  <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
    <p className="text-sm font-medium text-gray-500">Direct guest reviews</p>
    <p className="mt-2 text-5xl font-extrabold text-gray-900">
      {directAverage.toFixed(1)}
      <span className="text-xl font-semibold text-gray-500">/10</span>
    </p>
    <p className="mt-2 text-sm text-gray-500">
      Based on {directReviews.length} verified direct{" "}
      {directReviews.length === 1 ? "stay" : "stays"}.
    </p>
  </div>
)}
```

- [ ] **Step 6: Verify**

Run: `pnpm exec tsc --noEmit && pnpm test`
Expected: clean. Then with the dev server and the pending review from Task 3: approve it manually (`UPDATE reviews SET status = 'approved' WHERE status = 'pending';` via `mcp__supabase-dev__execute_sql`), load `/reviews`, and confirm the direct review renders with the "Verified direct stay" badge, the direct-score card appears, and legacy reviews still show "Verified stay · Booking.com".

- [ ] **Step 7: Commit**

```bash
git add lib/reviews.ts lib/reviews.test.ts components/guest-reviews.tsx app/reviews/page.tsx
git commit -m "feat(reviews): merge approved direct reviews into public reviews page"
```

---

### Task 5: Admin API routes and invite email

**Files:**
- Create: `app/api/admin/review-invites/route.ts`, `app/api/admin/review-invites/[id]/send-email/route.ts`, `app/api/admin/reviews/[id]/route.ts`
- Modify: `lib/email.ts` (add `sendReviewRequestEmail`)

**Interfaces:**
- Consumes: Task 1 queries; `getAdminUserOrNull` from `lib/supabase-server.ts`; `sendEmail`, `wrapEmailHtml`, `siteConfig` already in `lib/email.ts` scope; `getPostHogClient`.
- Produces:
  - `POST /api/admin/review-invites` body `{ guest_name: string, room_type: string, guest_email?: string, booking_request_id?: string }` → `200 { invite: ReviewInvite, url: string }`.
  - `POST /api/admin/review-invites/[id]/send-email` → `200 { status: "sent" }`, `400` if no email/used/expired, `404` if unknown.
  - `PATCH /api/admin/reviews/[id]` body `{ status: "pending" | "approved" | "rejected" }` → `200` updated `Review`.
  - `sendReviewRequestEmail(data: { guest_name: string; guest_email: string; review_url: string }): Promise<void>`.

- [ ] **Step 1: Add `sendReviewRequestEmail` to `lib/email.ts`** (place it after `sendDepositRefundEmail`):

```ts
export interface ReviewRequestEmailData {
  guest_name: string;
  guest_email: string;
  review_url: string;
}

export async function sendReviewRequestEmail(data: ReviewRequestEmailData) {
  const subject = "How was your stay? — Seoul Goshiwon by Star Goshiwon";
  const html = wrapEmailHtml(`
    <h1 style="font-size: 22px; margin: 0 0 16px;">How was your stay?</h1>
    <p>Hi ${data.guest_name},</p>
    <p>Thank you for staying at Star Goshiwon. We would love to hear how it went — your review helps future guests know what to expect.</p>
    <p>It takes about two minutes, and only the overall score is required.</p>
    <p style="margin: 24px 0;">
      <a href="${data.review_url}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 700;">Write a review</a>
    </p>
    <p style="font-size: 13px; color: #6b7280;">This personal link can be used once and is valid for 90 days.</p>
    <p>Best regards,<br /><strong>Seoul Goshiwon by Star Goshiwon</strong></p>
  `);

  const text = `Hi ${data.guest_name},

Thank you for staying at Star Goshiwon. We would love to hear how it went — your review helps future guests know what to expect.

It takes about two minutes, and only the overall score is required:
${data.review_url}

This personal link can be used once and is valid for 90 days.

Best regards,
Seoul Goshiwon by Star Goshiwon`;

  await sendEmail(data.guest_email, subject, text, html);
}
```

- [ ] **Step 2: Create `app/api/admin/review-invites/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import {
  createReviewInvite,
  generateReviewToken,
  reviewInviteUrl,
} from "@/lib/review-queries";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { getPostHogClient } from "@/lib/posthog-server";

export async function POST(req: NextRequest) {
  try {
    const adminUser = await getAdminUserOrNull();
    if (!adminUser) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const guestName = typeof body.guest_name === "string" ? body.guest_name.trim() : "";
    const roomType = typeof body.room_type === "string" ? body.room_type.trim() : "";
    const guestEmail =
      typeof body.guest_email === "string" && body.guest_email.trim().length > 0
        ? body.guest_email.trim().toLowerCase()
        : null;
    const bookingRequestId =
      typeof body.booking_request_id === "string" ? body.booking_request_id : null;

    if (!roomType) {
      return NextResponse.json({ error: "room_type is required" }, { status: 400 });
    }

    const invite = await createReviewInvite({
      token: generateReviewToken(),
      guest_name: guestName,
      guest_email: guestEmail,
      room_type: roomType,
      booking_request_id: bookingRequestId,
    });

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: adminUser.email ?? "admin",
      event: "review_invite_created",
      properties: {
        invite_id: invite.id,
        room_type: roomType,
        from_booking: Boolean(bookingRequestId),
        has_email: Boolean(guestEmail),
      },
    });
    await posthog.shutdown();

    return NextResponse.json({ invite, url: reviewInviteUrl(invite.token) });
  } catch (error) {
    console.error("Create review invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create `app/api/admin/review-invites/[id]/send-email/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import {
  getReviewInviteById,
  isReviewInviteOpen,
  reviewInviteUrl,
} from "@/lib/review-queries";
import { sendReviewRequestEmail } from "@/lib/email";
import { getAdminUserOrNull } from "@/lib/supabase-server";

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: Context) {
  try {
    const adminUser = await getAdminUserOrNull();
    if (!adminUser) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const invite = await getReviewInviteById(id);
    if (!invite) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (!invite.guest_email) {
      return NextResponse.json(
        { error: "이 초대에는 이메일 주소가 없습니다" },
        { status: 400 }
      );
    }
    if (!isReviewInviteOpen(invite)) {
      return NextResponse.json(
        { error: "이미 사용되었거나 만료된 링크입니다" },
        { status: 400 }
      );
    }

    await sendReviewRequestEmail({
      guest_name: invite.guest_name || "Guest",
      guest_email: invite.guest_email,
      review_url: reviewInviteUrl(invite.token),
    });

    return NextResponse.json({ status: "sent" });
  } catch (error) {
    console.error("Send review invite email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create `app/api/admin/reviews/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { updateReviewStatus } from "@/lib/review-queries";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { getPostHogClient } from "@/lib/posthog-server";
import type { ReviewStatus } from "@/lib/types";

const validStatuses: ReviewStatus[] = ["pending", "approved", "rejected"];

interface Context {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: Context) {
  try {
    const adminUser = await getAdminUserOrNull();
    if (!adminUser) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await req.json().catch(() => ({}))) as { status?: string };
    if (!validStatuses.includes(body.status as ReviewStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const review = await updateReviewStatus(id, body.status as ReviewStatus);

    if (review.status === "approved") {
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: adminUser.email ?? "admin",
        event: "review_approved",
        properties: {
          review_id: review.id,
          score: review.score,
          room_type: review.room_type,
        },
      });
      await posthog.shutdown();
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("Update review status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 5: Verify and commit**

Run: `pnpm exec tsc --noEmit && pnpm test` — Expected: clean.

```bash
git add lib/email.ts app/api/admin/review-invites app/api/admin/reviews
git commit -m "feat(reviews): admin invite/moderation APIs and review request email"
```

---

### Task 6: Admin UI — reviews page, nav, request-detail button

**Files:**
- Create: `app/admin/reviews/page.tsx`, `components/admin/review-admin.tsx`, `components/admin/review-invite-button.tsx`
- Modify: `components/admin/admin-nav.tsx` (nav item), `app/admin/requests/[id]/page.tsx` (render button)

**Interfaces:**
- Consumes: `getReviews`, `getReviewInvites`, `isReviewInviteOpen`, `reviewInviteUrl` (Task 1); `getRooms` from `lib/queries.ts`; the Task 5 API routes; `Review`, `ReviewInvite` types.
- Produces: admin page at `/admin/reviews`; `<ReviewInviteButton requestId guestName guestEmail roomTypeName />` client component.

- [ ] **Step 1: Add the nav item**

In `components/admin/admin-nav.tsx`, add to `navItems` after the `예약 요청` entry:

```ts
  { href: "/admin/reviews", label: "후기 관리" },
```

- [ ] **Step 2: Create `app/admin/reviews/page.tsx`**

```tsx
import { getReviewInvites, getReviews, reviewInviteUrl } from "@/lib/review-queries";
import { getRooms } from "@/lib/queries";
import { ReviewAdmin } from "@/components/admin/review-admin";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const [reviews, invites, rooms] = await Promise.all([
    getReviews(),
    getReviewInvites(),
    getRooms(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900">후기 관리</h1>
      <p className="mt-1 text-sm text-gray-500">
        후기 초대 링크를 만들어 보내고, 제출된 후기를 승인하면 사이트에 게시됩니다.
      </p>
      <div className="mt-6">
        <ReviewAdmin
          reviews={reviews}
          invites={invites.map((invite) => ({
            ...invite,
            url: reviewInviteUrl(invite.token),
          }))}
          roomTypeNames={rooms.map((room) => room.name)}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `components/admin/review-admin.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Review, ReviewInvite, ReviewStatus } from "@/lib/types";

type InviteWithUrl = ReviewInvite & { url: string };

const STATUS_LABELS_KO: Record<ReviewStatus, string> = {
  pending: "대기 중",
  approved: "게시됨",
  rejected: "거절됨",
};

function inviteStateKo(invite: ReviewInvite): string {
  if (invite.used_at) return "사용됨";
  if (new Date(invite.expires_at) <= new Date()) return "만료됨";
  return "대기 중";
}

function formatDateKo(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Seoul",
  });
}

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      {copied ? "복사됨 ✓" : "링크 복사"}
    </button>
  );
}

function ReviewModerationCard({ review }: { review: Review }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: ReviewStatus) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? "요청 실패");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const allCategories = [...review.basic_categories, ...review.additional_categories];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-bold text-gray-900">
            {review.guest_name}
            {review.country ? `, ${review.country}` : ""} · {review.room_type}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {formatDateKo(review.submitted_at)} · {STATUS_LABELS_KO[review.status]}
          </p>
        </div>
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-indigo-600 text-lg font-bold text-white">
          {review.score}
        </div>
      </div>
      {review.title && (
        <p className="mt-3 text-sm font-semibold text-gray-800">{review.title}</p>
      )}
      {review.positive && (
        <p className="mt-2 text-sm text-gray-700">👍 {review.positive}</p>
      )}
      {review.negative && (
        <p className="mt-2 text-sm text-gray-700">👎 {review.negative}</p>
      )}
      {allCategories.length > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {allCategories.map((c) => `${c.label} ${c.score}`).join(" · ")}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        {review.status !== "approved" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setStatus("approved")}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            승인
          </button>
        )}
        {review.status !== "rejected" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setStatus("rejected")}
            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            거절
          </button>
        )}
        {review.status === "approved" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setStatus("pending")}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            게시 취소
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function NewInviteForm({ roomTypeNames }: { roomTypeNames: string[] }) {
  const router = useRouter();
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [roomType, setRoomType] = useState(roomTypeNames[0] ?? "");
  const [busy, setBusy] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setCreatedUrl(null);
    try {
      const res = await fetch("/api/admin/review-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: guestName,
          guest_email: guestEmail,
          room_type: roomType,
        }),
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !body.url) {
        setError(body.error ?? "생성 실패");
        return;
      }
      setCreatedUrl(body.url);
      setGuestName("");
      setGuestEmail("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none";

  return (
    <form
      onSubmit={handleCreate}
      className="rounded-lg border border-gray-200 bg-white p-5"
    >
      <h3 className="text-base font-bold text-gray-900">새 후기 초대</h3>
      <p className="mt-1 text-sm text-gray-500">
        플랫폼 외 예약 고객에게도 링크를 만들어 보낼 수 있습니다.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input
          type="text"
          required
          placeholder="고객 이름"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className={inputClass}
        />
        <input
          type="email"
          placeholder="이메일 (선택)"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          className={inputClass}
        />
        <select
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
          className={inputClass}
        >
          {roomTypeNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {busy ? "생성 중…" : "초대 링크 만들기"}
      </button>
      {createdUrl && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 p-3">
          <code className="min-w-0 flex-1 truncate text-xs text-gray-700">
            {createdUrl}
          </code>
          <CopyLinkButton url={createdUrl} />
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}

function InviteRow({ invite }: { invite: InviteWithUrl }) {
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const open = inviteStateKo(invite) === "대기 중";

  async function handleSendEmail() {
    setEmailState("sending");
    const res = await fetch(`/api/admin/review-invites/${invite.id}/send-email`, {
      method: "POST",
    });
    setEmailState(res.ok ? "sent" : "error");
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">
          {invite.guest_name || "(이름 없음)"} · {invite.room_type}
        </p>
        <p className="text-xs text-gray-500">
          {formatDateKo(invite.created_at)} 생성 · {formatDateKo(invite.expires_at)}{" "}
          만료 · {inviteStateKo(invite)}
          {invite.guest_email ? ` · ${invite.guest_email}` : ""}
        </p>
      </div>
      {open && (
        <div className="flex gap-2">
          <CopyLinkButton url={invite.url} />
          {invite.guest_email && (
            <button
              type="button"
              disabled={emailState === "sending" || emailState === "sent"}
              onClick={handleSendEmail}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {emailState === "sent"
                ? "발송됨 ✓"
                : emailState === "sending"
                  ? "발송 중…"
                  : emailState === "error"
                    ? "실패 — 재시도"
                    : "이메일 보내기"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ReviewAdmin({
  reviews,
  invites,
  roomTypeNames,
}: {
  reviews: Review[];
  invites: InviteWithUrl[];
  roomTypeNames: string[];
}) {
  const pending = reviews.filter((r) => r.status === "pending");
  const handled = reviews.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-8">
      <NewInviteForm roomTypeNames={roomTypeNames} />

      <section>
        <h2 className="text-lg font-bold text-gray-900">
          대기 중 후기 ({pending.length})
        </h2>
        <div className="mt-3 space-y-3">
          {pending.length === 0 && (
            <p className="text-sm text-gray-500">대기 중인 후기가 없습니다.</p>
          )}
          {pending.map((review) => (
            <ReviewModerationCard key={review.id} review={review} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900">
          초대 링크 ({invites.length})
        </h2>
        <div className="mt-3 space-y-2">
          {invites.length === 0 && (
            <p className="text-sm text-gray-500">초대 링크가 없습니다.</p>
          )}
          {invites.map((invite) => (
            <InviteRow key={invite.id} invite={invite} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900">
          처리된 후기 ({handled.length})
        </h2>
        <div className="mt-3 space-y-3">
          {handled.map((review) => (
            <ReviewModerationCard key={review.id} review={review} />
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Create `components/admin/review-invite-button.tsx`**

```tsx
"use client";

import { useState } from "react";

export function ReviewInviteButton({
  requestId,
  guestName,
  guestEmail,
  roomTypeName,
}: {
  requestId: string;
  guestName: string;
  guestEmail: string;
  roomTypeName: string;
}) {
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState<{ id: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/review-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: guestName,
          guest_email: guestEmail,
          room_type: roomTypeName,
          booking_request_id: requestId,
        }),
      });
      const body = (await res.json()) as {
        invite?: { id: string };
        url?: string;
        error?: string;
      };
      if (!res.ok || !body.url || !body.invite) {
        setError(body.error ?? "초대 생성 실패");
        return;
      }
      setInvite({ id: body.invite.id, url: body.url });
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!invite) return;
    await navigator.clipboard.writeText(invite.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSendEmail() {
    if (!invite) return;
    setEmailState("sending");
    const res = await fetch(`/api/admin/review-invites/${invite.id}/send-email`, {
      method: "POST",
    });
    setEmailState(res.ok ? "sent" : "error");
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="text-base font-bold text-gray-900">후기 요청</h3>
      {!invite ? (
        <>
          <p className="mt-1 text-sm text-gray-500">
            이 고객에게 보낼 일회용 후기 링크를 만듭니다.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={handleCreate}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? "생성 중…" : "후기 링크 만들기"}
          </button>
        </>
      ) : (
        <div className="mt-3 space-y-3">
          <code className="block truncate rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
            {invite.url}
          </code>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {copied ? "복사됨 ✓" : "링크 복사 (WhatsApp용)"}
            </button>
            <button
              type="button"
              disabled={emailState === "sending" || emailState === "sent"}
              onClick={handleSendEmail}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {emailState === "sent"
                ? "발송됨 ✓"
                : emailState === "sending"
                  ? "발송 중…"
                  : emailState === "error"
                    ? "실패 — 재시도"
                    : "이메일 보내기"}
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 5: Render the button on the request detail page**

In `app/admin/requests/[id]/page.tsx`, import the component and render it directly below `<RequestActions request={request} templates={templates} />` (around line 266), gated to paid bookings:

```tsx
{request.payment_status === "paid" && (
  <div className="mt-6">
    <ReviewInviteButton
      requestId={request.id}
      guestName={request.guest_name}
      guestEmail={request.guest_email}
      roomTypeName={request.rooms?.name ?? request.room_slug}
    />
  </div>
)}
```

(Adjust the wrapper spacing class to match the neighbouring blocks in that column — check the surrounding markup when editing.)

- [ ] **Step 6: Verify**

Run: `pnpm exec tsc --noEmit && pnpm test` — Expected: clean.
Manual: `pnpm dev`, log in as admin, open `/admin/reviews` — create an invite, copy the link, open it in a private window, submit a review, refresh `/admin/reviews`, approve it, confirm it appears on `/reviews`. On a paid booking's detail page, confirm the 후기 요청 card renders and creates a link.

- [ ] **Step 7: Commit**

```bash
git add app/admin/reviews components/admin/review-admin.tsx components/admin/review-invite-button.tsx components/admin/admin-nav.tsx "app/admin/requests/[id]/page.tsx"
git commit -m "feat(admin): review moderation page, invite creation, request-detail button"
```

---

### Task 7: E2E test with test fixture route

**Files:**
- Create: `app/api/test/review-fixture/route.ts`, `e2e/guest-review.spec.ts`

**Interfaces:**
- Consumes: Task 1 queries; guest form (Task 3); public page (Task 4).
- Produces: `POST /api/test/review-fixture` (E2E_TEST_MODE only) with body `{ action: "create-invite", guestName?, roomType?, expired? }` → `{ id, token, url }`, or `{ action: "set-status", inviteId, status }` → the updated review.

- [ ] **Step 1: Create `app/api/test/review-fixture/route.ts`**

The admin UI requires a Supabase login, which Playwright doesn't have — so, like `payment-fixture`, this test-only route stands in for admin actions.

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  createReviewInvite,
  generateReviewToken,
  updateReviewStatus,
} from "@/lib/review-queries";
import type { Review, ReviewStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (process.env.E2E_TEST_MODE !== "true") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      guestName?: string;
      roomType?: string;
      expired?: boolean;
      inviteId?: string;
      status?: ReviewStatus;
    };

    if (body.action === "create-invite") {
      const invite = await createReviewInvite({
        token: generateReviewToken(),
        guest_name: body.guestName ?? "Playwright Reviewer",
        guest_email: `playwright-review-${Date.now()}@example.com`,
        room_type: body.roomType ?? "Private Shower Room",
      });
      if (body.expired) {
        const supabase = getSupabaseServiceClient();
        const { error } = await supabase
          .from("review_invites")
          .update({ expires_at: new Date(Date.now() - 60_000).toISOString() })
          .eq("id", invite.id);
        if (error) throw error;
      }
      return NextResponse.json({
        id: invite.id,
        token: invite.token,
        url: `/review/${invite.token}`,
      });
    }

    if (body.action === "set-status" && body.inviteId && body.status) {
      const supabase = getSupabaseServiceClient();
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("invite_id", body.inviteId)
        .single();
      if (error) throw error;
      const review = await updateReviewStatus((data as Review).id, body.status);
      return NextResponse.json(review);
    }

    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (error) {
    console.error("Review fixture error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "fixture_failed" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create `e2e/guest-review.spec.ts`**

```ts
import { expect, test, type APIRequestContext } from "@playwright/test";

async function createInvite(
  request: APIRequestContext,
  overrides: Record<string, unknown> = {}
) {
  const res = await request.post("/api/test/review-fixture", {
    data: { action: "create-invite", ...overrides },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as { id: string; token: string; url: string };
}

test("guest submits a review, admin approves, review appears on /reviews", async ({
  page,
  request,
}) => {
  const guestName = `Playwright Reviewer ${Date.now()}`;
  const invite = await createInvite(request, { guestName });

  await page.goto(invite.url);
  await expect(
    page.getByRole("heading", { name: "How was your stay?" })
  ).toBeVisible();

  // Name arrives pre-filled from the invite.
  await expect(page.getByLabel(/Your name/)).toHaveValue(guestName);

  await page.getByRole("button", { name: "9", exact: true }).click();
  await page.getByRole("button", { name: "Staff: 10 out of 10" }).click();
  await page.getByLabel(/What did you like/).fill("Great view from the room.");
  await page.getByLabel(/Country/).fill("US");
  await page.getByRole("button", { name: "Submit review" }).click();

  await expect(page.getByText("Thank you for your review!")).toBeVisible();

  // The link is single-use.
  await page.goto(invite.url);
  await expect(
    page.getByText("This review link has already been used")
  ).toBeVisible();

  // Pending reviews are not public.
  await page.goto("/reviews");
  await expect(page.getByText(guestName)).toHaveCount(0);

  // Admin approves (via test fixture; the admin UI needs a Supabase login).
  const approve = await request.post("/api/test/review-fixture", {
    data: { action: "set-status", inviteId: invite.id, status: "approved" },
  });
  expect(approve.ok()).toBeTruthy();

  await page.goto("/reviews");
  await expect(page.getByText(new RegExp(guestName))).toBeVisible();
  await expect(page.getByText("Verified direct stay").first()).toBeVisible();
  await expect(page.getByText("Great view from the room.")).toBeVisible();
});

test("a low score requires a comment before submitting", async ({
  page,
  request,
}) => {
  const invite = await createInvite(request);

  await page.goto(invite.url);
  await page.getByRole("button", { name: "2", exact: true }).click();
  await page.getByRole("button", { name: "Submit review" }).click();

  await expect(page.getByText(/please add a short comment/i)).toBeVisible();

  await page.getByLabel(/What could be better/).fill("Room was too noisy.");
  await page.getByRole("button", { name: "Submit review" }).click();
  await expect(page.getByText("Thank you for your review!")).toBeVisible();
});

test("an expired invite link shows the expired notice", async ({
  page,
  request,
}) => {
  const invite = await createInvite(request, { expired: true });

  await page.goto(invite.url);
  await expect(page.getByText("This review link has expired")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit review" })).toHaveCount(0);
});
```

- [ ] **Step 3: Run the new e2e spec**

Run: `pnpm test:e2e -- guest-review`
Expected: 3 tests pass. (The Playwright web server uses supabase-dev; Task 1's migration must already be applied there.)

- [ ] **Step 4: Full verification**

Run: `pnpm run verify` (vitest + build + full e2e).
Expected: everything passes, including the pre-existing `payment-flow` spec.

- [ ] **Step 5: Commit**

```bash
git add app/api/test/review-fixture e2e/guest-review.spec.ts
git commit -m "test(reviews): e2e coverage for invite → submit → approve flow"
```

---

## Post-implementation (deploy checklist — do NOT run without the user)

1. Apply `2026-07-06-guest-reviews.sql` to **prod** Supabase (`mcp__supabase__apply_migration`) — BEFORE deploying.
2. `pnpm run deploy` (or `deploy:staging` first).
3. Smoke-check prod: create a real invite from `/admin/reviews`, open the link, verify the form renders.
