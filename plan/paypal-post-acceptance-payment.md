# Post-Acceptance PayPal Payment System

## Summary

Implement payments as a **PayPal Checkout** flow triggered only after admin approval. The guest pays the **full prepaid total**: room rate, refundable deposit, and optional bedding. After PayPal capture succeeds, the system automatically marks the booking as confirmed and sends confirmation emails.

Stripe is not the recommended v1 path for this Korean business because Stripe's official global availability page does not list South Korea as a supported country for local merchant signup. PayPal can support card checkout through guest checkout, but PayPal decides when card-without-account is shown based on account settings, buyer location, and risk checks. Eximbay is a plausible Korea-local future option, especially for foreign cards, but should be treated as a separate v2 integration.

References checked:

- Stripe global availability: https://stripe.com/global
- PayPal guest checkout KR: https://qwac.paypal.com/kr/cshelp/article/how-do-i-accept-credit-cards-using-guest-checkout-with-paypal-express-checkout-ts1623?locale.x=en_KR
- PayPal Orders API: https://developer.paypal.com/docs/api/orders/sdk/v2/
- PayPal checkout webhooks: https://developer.paypal.com/docs/checkout/apm/reference/subscribe-to-webhooks/
- Eximbay: https://www.eximbay.com/index.do?lang=EN

## Key Changes

- Add PayPal server integration using Orders v2:
  - Create an order with `intent: "CAPTURE"` when admin accepts a request.
  - Store the PayPal order ID, approval URL, amount, currency, and expiry metadata.
  - Capture after buyer approval through a return route and reconcile through webhook events.
- Extend booking/payment state:
  - Keep existing booking statuses, but add `confirmed` for paid bookings.
  - Add payment fields to `booking_requests`: `payment_status`, `payment_provider`, `payment_order_id`, `payment_capture_id`, `payment_approval_url`, `payment_amount`, `payment_currency`, `payment_created_at`, `payment_paid_at`, `payment_expires_at`, and `payment_error`.
  - Use payment statuses: `none`, `pending`, `paid`, `failed`, `expired`, `refunded`.
- Update the admin flow:
  - Replace plain `Approved` status save with an explicit **Approve & Send Payment Link** action.
  - Recalculate the total from stored room slug, dates, and bedding flag server-side before creating a PayPal order.
  - Email the guest with a first-party review-and-pay link and a 48-hour payment deadline.
  - Show payment status, order ID, paid timestamp, and resend/regenerate-link action on the admin request detail page.
- Update the guest flow:
  - Add `/booking-payment/pay` as a first-party payment review page.
  - The approval email should link to `/booking-payment/pay`, not directly to PayPal.
  - The review page shows the guest's exact booking summary, itemized total, 48-hour deadline, and a clear **Continue to PayPal** button.
  - The PayPal approval URL stays server-stored and is only used when the guest clicks through from the first-party review page.
  - Add `/booking-payment/return` and `/booking-payment/cancel` pages.
  - Return page verifies and captures the PayPal order server-side, then shows payment success or failure.
  - Cancel page keeps the request approved but unpaid and tells the guest to use the email link again or contact support.
- Add webhook reconciliation:
  - Add `/api/paypal/webhook`.
  - Verify PayPal webhook signatures.
  - Handle `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, and pending/failure events.
  - On successful capture, idempotently mark `payment_status = paid`, `status = confirmed`, store the capture ID, and send paid-confirmation emails.
- Update public copy and policies:
  - Change all payment copy to match the automated PayPal link flow after approval.
  - Keep card-payment language cautious: card payment may be available through PayPal guest checkout, but it is not guaranteed for every buyer.
  - Update the Korean policy page in parallel.

## Implementation Notes

Required environment variables:

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENV=sandbox|live`
- `PAYPAL_WEBHOOK_ID`
- Existing `NEXT_PUBLIC_SITE_URL`, SMTP vars, and Supabase vars

Use `fetch` directly for PayPal REST calls; avoid adding an SDK unless the direct API becomes painful. Use idempotency keys when creating and capturing orders. Never trust client totals; always recalculate server-side from the stored booking request.

For trust, the guest-facing approval email should feel like an official booking email, not a standalone payment demand. Use a subject like `Your booking request is approved — review and pay to confirm`, include room/dates/total/deadline, and use a button labeled **Review and pay securely**. Avoid shortened links, attachments, vague urgency, or a raw PayPal URL in the primary CTA. The first payment action should land on `goshiwonseoul.com`, where the guest can verify the details before continuing to PayPal.

Admin APIs are currently blocked by `middleware.ts` and `app/admin/layout.tsx`. Payment work depends on re-enabling admin behind real protection before launch.

Refund automation is out of scope for v1. Admin handles refunds manually in PayPal and records notes/status in the admin panel.

## Test Plan

- Unit-test price recalculation for weekly, extra-day, 4+ week discount, deposit, and bedding.
- Test admin approval creates one PayPal order and persists payment metadata.
- Test approval email links to `/booking-payment/pay`, not directly to PayPal.
- Test `/booking-payment/pay` renders the stored booking summary and redirects/links to PayPal only for an active pending payment.
- Test duplicate approval does not create duplicate active orders unless admin explicitly regenerates.
- Test successful sandbox payment updates the request to `confirmed` and `paid`.
- Test webhook replay is idempotent.
- Test canceled/failed payment keeps the request unpaid and does not confirm the booking.
- Test email rendering for payment-link and payment-confirmed messages.
- Run `npm run build` after implementation.

## Assumptions

- V1 provider is **PayPal Checkout**, not Stripe or Eximbay.
- Guest pays the full prepaid total online.
- Successful payment automatically confirms the booking.
- Refunds are manual in v1.
