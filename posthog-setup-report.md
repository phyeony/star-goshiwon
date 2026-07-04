<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Star Goshiwon. The project already had `posthog-js`, a `PostHogProvider`, and automatic pageview tracking wired up. This integration adds meaningful business event tracking across the full booking funnel — from form submission to confirmed PayPal payment — on both the client and server side.

**New files created:**
- `lib/posthog-server.ts` — singleton factory for the `posthog-node` server-side client (`flushAt: 1`, `flushInterval: 0` for Cloudflare Workers)

**Environment:**
- `.env.local` — `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` set

**Package installed:**
- `posthog-node` — server-side event capture for API routes

| Event | Description | File |
|---|---|---|
| `booking_request_submitted` | Guest successfully submitted a booking request (client-side) | `components/request-form.tsx` |
| `booking_request_failed` | Guest's booking request failed due to validation or network error | `components/request-form.tsx` |
| `paypal_checkout_started` | Guest was redirected to PayPal checkout | `components/booking-payment/paypal-start-button.tsx` |
| `paypal_checkout_failed` | PayPal redirect failed (API or network error) | `components/booking-payment/paypal-start-button.tsx` |
| `booking_request_created` | Booking request persisted to DB and emails sent (server-side authoritative event) | `app/api/booking-requests/route.ts` |
| `payment_completed` | PayPal `PAYMENT.CAPTURE.COMPLETED` webhook received — booking confirmed | `app/api/paypal/webhook/route.ts` |
| `payment_failed` | PayPal payment denied or reversed | `app/api/paypal/webhook/route.ts` |

**User identification:** `posthog.identify(email, { name })` is called in `components/request-form.tsx` on successful form submission, linking all subsequent events to the guest by email. Server-side events use `guest_email` as the `distinctId` for correlation.

## Next steps

We've built a dashboard and 5 insights to monitor your booking funnel:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/462417/dashboard/1688623)
- [Booking to Payment Funnel](https://us.posthog.com/project/462417/insights/O0bXTJDU) — 2-step funnel: booking submitted → payment completed
- [Full Booking Journey Funnel](https://us.posthog.com/project/462417/insights/AKYO7ezE) — 3-step funnel: booking submitted → PayPal started → payment completed
- [Booking Requests Over Time](https://us.posthog.com/project/462417/insights/MUsj0KiT) — weekly server-side bookings trend
- [Payments Completed Over Time](https://us.posthog.com/project/462417/insights/3HrTzRIg) — weekly confirmed payments trend
- [Booking & Payment Failures](https://us.posthog.com/project/462417/insights/vrSRGgXh) — weekly failure rate for bookings and payments

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
