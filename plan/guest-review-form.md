# Guest Review Form — Design Spec

**Date:** 2026-07-06
**Status:** Approved by owner (brainstorming session)

## Problem

Reviews on the site are six hardcoded Booking.com reviews in `lib/reviews.ts`. The
property is no longer listed on Booking.com and all bookings are direct, so there is
no way to collect new reviews. We need a way for real guests to submit reviews —
including the many guests who book **off-platform** (WhatsApp, KakaoTalk, walk-in)
and therefore have no `booking_requests` row.

## Approach: admin-minted invite links

Verification comes from the admin, not the booking record. The admin knows who
actually stayed, so the unit of trust is a **single-use invite token** the admin
generates:

- **Platform bookings:** a "Request review" button on the admin booking request
  detail page creates an invite pre-filled with guest name and room type.
- **Off-platform guests:** a "New review invite" form on `/admin/reviews` where the
  admin enters name + room type manually.
- Either path yields a **copyable link** (for WhatsApp/KakaoTalk) and an optional
  **"Send email"** action.

Because a review can only be submitted through an admin-issued link, every review is
legitimately a "verified stay" and there is no public form to spam. Submitted
reviews require **admin approval** before appearing publicly.

Rejected alternatives: public form gated only by moderation (cannot claim verified;
moderating spam), linking guests to Google Maps (off-site, no control, does not feed
the site's reviews page).

## Data model (Supabase, one migration)

### `review_invites`

| column               | type        | notes                                      |
| -------------------- | ----------- | ------------------------------------------ |
| `id`                 | uuid pk     | default `gen_random_uuid()`                |
| `token`              | text unique | URL-safe random (32+ chars), indexed       |
| `guest_name`         | text        | pre-fills the form; editable by guest      |
| `room_type`          | text        | display name, e.g. "Private Shower Room"   |
| `booking_request_id` | uuid null   | fk → `booking_requests`, null if off-platform |
| `created_at`         | timestamptz | default now()                              |
| `expires_at`         | timestamptz | created_at + 90 days                       |
| `used_at`            | timestamptz | set when a review is submitted; null = open |

### `reviews`

| column                  | type        | notes                                             |
| ----------------------- | ----------- | ------------------------------------------------- |
| `id`                    | uuid pk     |                                                   |
| `invite_id`             | uuid unique | fk → `review_invites` (unique = single use)       |
| `guest_name`            | text        |                                                   |
| `country`               | text null   | ISO-ish short code or name as typed               |
| `room_type`             | text        | copied from invite                                |
| `score`                 | integer     | required, whole number 1–10                       |
| `title`                 | text null   | optional headline                                 |
| `positive`              | text null   | "What did you like?"                              |
| `negative`              | text null   | "What could be better?"                           |
| `basic_categories`      | jsonb       | `[{"label": "...", "score": 7.5}, ...]`, may be `[]` |
| `additional_categories` | jsonb       | same shape, may be `[]`                           |
| `status`                | text        | `pending` \| `approved` \| `rejected`; default `pending` |
| `submitted_at`          | timestamptz | default now()                                     |
| `reviewed_at`           | timestamptz | when admin approved/rejected                      |

The jsonb category shape matches `ReviewCategoryScore` in `lib/reviews.ts` so DB
reviews render through the existing components unchanged.

## Guest form — `/review/[token]`

Mirrors the current Booking.com review display; **only the overall score is
required**, matching Booking.com's real form.

- **Overall score 1–10** — required; whole numbers, tap-to-select scale (not a
  dropdown).
- **Basic categories** — staff, cleanliness, location, facilities, comfort, value
  for money. Optional; each uses the 4-smiley scale mapping to **2.5 / 5 / 7.5 / 10**
  (the values in the existing imported data). Guests may answer any subset.
- **Additional categories** — WiFi, bed rating, room view. Optional, same scale.
- **Title** — optional short text (max 120 chars).
- **Positive / negative comments** — optional textareas. Exception: if overall
  score ≤ 3, at least one comment is required (Booking.com's extreme-score rule).
- **Name** — pre-filled from the invite, editable. **Country** — optional text.
- **Room type** — read-only from the invite.

Token states: valid & unused → form; used → "this link has already been used";
expired/unknown → friendly error page. Validation happens server-side in the API
route; the page itself is a server component that checks the token before render.

Submission: `POST /api/reviews` with `{ token, ...fields }` → validates token
(exists, unused, unexpired) and fields → inserts `reviews` row (status `pending`),
sets `review_invites.used_at` → success page: "Thanks — your review will appear
after a quick check."

## Admin

### `/admin/reviews` page (new, linked from admin nav)

- **Pending reviews** — full review preview with Approve / Reject buttons.
- **Approved / rejected** — collapsed list for reference (status change allowed,
  e.g. un-approve).
- **Invites** — open invites with guest name, room type, created/expires dates, a
  **Copy link** button, and **Send email** (disabled if no email known). Plus a
  **New review invite** form: guest name, room type (select from room types),
  optional email.

### Booking request detail page

A **"Request review"** button (visible for paid/completed bookings) that creates an
invite from the booking's guest name + room type, then shows the copy-link /
send-email actions inline. Follows the existing pattern in
`components/admin/request-actions.tsx`.

### API routes (admin-authed, existing `/api/admin` pattern)

- `POST /api/admin/review-invites` — create invite `{ guest_name, room_type, booking_request_id?, email? }`.
- `POST /api/admin/review-invites/[id]/send-email` — send the invite email.
- `PATCH /api/admin/reviews/[id]` — `{ status: "approved" | "rejected" }`.

## Email

`sendReviewRequestEmail` in `lib/email.ts`, following the `sendPaymentLinkEmail`
pattern: guest name, review link, short friendly copy ("How was your stay at Star
Goshiwon?"). English only.

## Public display — `/reviews`

- Page fetches approved DB reviews server-side and merges them with the legacy
  hardcoded Booking.com reviews into one list (existing sort controls apply).
- Each review is badged by source: **"Verified stay · Booking.com"** (legacy) or
  **"Verified direct stay"** (DB).
- The Booking.com 7.5 summary box stays as-is; once direct reviews exist, show a
  separate direct-review count/average alongside it.
- `GuestReview.basicCategories` becomes optional; `ReviewList` skips the
  basic-categories section when empty (it already skips additional categories and
  comments when absent).
- Homepage/room-page review components (`GuestReviews` variants) keep using the
  highlighted legacy reviews for now — no change.

## Analytics

PostHog events via the existing instrumentation: `review_invite_created` (admin,
server-side), `review_submitted` (API route), `review_approved` (API route).

## Testing

- Unit: submission validation (score bounds, low-score comment rule, smiley
  values, token states), legacy+DB merge ordering.
- E2E (Playwright, following `e2e/payment-flow.spec.ts` patterns): admin creates
  invite → guest submits via link → review pending → admin approves → review
  visible on `/reviews`; reused token rejected.

## Out of scope (YAGNI)

Photos, owner replies, editing after submit, multi-language form, automatic
post-checkout email scheduling, review deletion by guests, importing further
Booking.com reviews.

## Deployment notes

Apply the migration to prod **before** deploying code (project rule: migrate, then
deploy). No changes to existing tables, so the migration is purely additive and
safe for the running site.
