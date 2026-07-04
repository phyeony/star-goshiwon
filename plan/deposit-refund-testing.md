# Deposit Refund — Testing Guide

How to verify the admin deposit-refund feature, both automated and manually
(PayPal sandbox). Feature spans: `lib/paypal.ts` (`refundPayPalCapture`),
`lib/payments.ts` (`refundBookingDeposit`), `app/api/admin/requests/[id]/refund`,
the admin UI in `components/admin/request-actions.tsx`, and the
`2026-06-14-deposit-refunds.sql` migration.

## Prerequisite: apply the migration

The refund writes `refund_amount` / `refunded_at` / `refund_id` to
`booking_requests`. The refund call fails (`refund_failed`) until these columns
exist. Apply `supabase/migrations/2026-06-14-deposit-refunds.sql` to the target
database (dev first, then prod) before testing against it.

## Automated tests

### Unit (`lib/payments.test.ts`)
Mocked PayPal + DB. Covers default $70 deposit refund, explicit partial amount,
full-refund status flip to `refunded`, cumulative partial refunds, and the
guards (over-balance, not-paid, no-capture).

```bash
pnpm test
# or just this file:
npx vitest run lib/payments.test.ts
```

### E2E (`e2e/payment-flow.spec.ts` → "admin can refund the deposit on a paid booking")
Runs under `E2E_TEST_MODE=true` + `PAYPAL_FAKE=true`. Drives a real fake-PayPal
payment to produce a stored capture id, then exercises the refund through an
E2E-only route (`/api/test/refund`, 404 outside the harness, since the real
admin route is middleware-guarded). Asserts: partial $70 refund keeps the
booking `paid`, the guest refund email lands in the outbox, over-balance refunds
are rejected, and refunding the remainder flips the booking to `refunded`.

```bash
npx playwright test e2e/payment-flow.spec.ts -g "admin can refund the deposit"
```

> Requires the dev database to have the refund columns (see Prerequisite). The
> E2E fixture writes to real dev Supabase, so without the migration the refund
> route returns 500 `refund_failed`.

## Manual test — PayPal sandbox

Yes, the full partial-refund flow works in sandbox. The code auto-targets
sandbox whenever `PAYPAL_ENV` is not `live`.

### Setup
1. Apply the migration to the database the app is pointed at.
2. Env: `PAYPAL_ENV=sandbox`, sandbox `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`,
   sandbox `PAYPAL_WEBHOOK_ID`.
3. **Do not** set `PAYPAL_FAKE=true` — fake mode returns a stub refund without
   calling PayPal. Sandbox testing needs the real sandbox API.
4. Have a sandbox **business** (receiver) and **personal/buyer** account from the
   PayPal Developer dashboard.

### Steps
1. Create a booking and pay it with the sandbox **buyer** account so a real
   capture is created and stored in `payment_capture_id`.
2. Admin dashboard → the request → **보증금 환불 (Refund deposit)**.
3. The amount is prefilled to the $70 deposit (capped at the remaining
   refundable balance). Edit it for a partial/goodwill refund if needed.
4. **PayPal로 환불 (Refund via PayPal)** → confirm the dialog.

### Verify
- Sandbox **business** account activity shows a refund against the capture.
- Sandbox **buyer** account receives the refunded amount.
- Booking detail shows `환불됨: $70 / $<paid>` and stays **paid** (a refund of the
  full paid amount flips it to **refunded**).
- Guest + admin refund emails are sent (in dev they're redirected to
  `DEV_EMAIL_OVERRIDE`).

### Sandbox caveats
- **Fees aren't realistic in sandbox** — you won't see the real "original fee not
  returned" behavior, but the API mechanics (partial amount, capture targeting,
  status) are identical to live.
- **Idempotency** — the `PayPal-Request-Id` is stable per
  `(booking, cumulative refunded amount)`. Refunding the same amount at the same
  cumulative total returns the original refund instead of double-refunding. To
  test a second genuine partial refund, use a different amount (e.g. $70 then
  $30); the over-balance guard prevents exceeding the paid total.
- **180-day window** — PayPal only allows refunding a capture within 180 days.
  Not an issue for typical 1–4 week stays; relevant only for very long stays.
