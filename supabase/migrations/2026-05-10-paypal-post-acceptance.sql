-- Adds post-acceptance PayPal payment tracking.

ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'confirmed';

DO $$
BEGIN
  CREATE TYPE payment_status AS ENUM (
    'none',
    'pending',
    'paid',
    'failed',
    'expired',
    'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS payment_status payment_status NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS payment_order_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_capture_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_approval_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_amount INTEGER,
  ADD COLUMN IF NOT EXISTS payment_currency TEXT,
  ADD COLUMN IF NOT EXISTS payment_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_error TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_booking_requests_payment_order_id
  ON booking_requests(payment_order_id);

CREATE INDEX IF NOT EXISTS idx_booking_requests_payment_status
  ON booking_requests(payment_status);
