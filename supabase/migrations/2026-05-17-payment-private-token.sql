-- Add a private magic-link token for guest payment access. The raw token is
-- only sent in email; only the SHA-256 hash is stored.

ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS payment_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS payment_token_created_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_booking_requests_payment_token_hash
  ON booking_requests(payment_token_hash);
