-- Track PayPal refunds (primarily the security deposit refunded at the end of a
-- stay) directly on the booking request, so the admin dashboard can issue a
-- refund and show what was returned. A partial deposit refund keeps the booking
-- in 'paid'; payment_status only flips to 'refunded' once the full amount is
-- returned. Amounts are whole USD, matching estimated_total / payment_amount.

ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS refund_amount INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_id TEXT;
