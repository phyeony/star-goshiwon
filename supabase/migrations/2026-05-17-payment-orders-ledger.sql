-- Track every PayPal checkout order created for a booking. This prevents stale
-- PayPal return/webhook events from becoming ambiguous after a replacement
-- order is created.

CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_request_id UUID NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'paypal',
  provider_order_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'created' CHECK (
    status IN (
      'created',
      'approved',
      'paid',
      'failed',
      'expired',
      'superseded',
      'duplicate_paid'
    )
  ),
  approval_url TEXT NOT NULL DEFAULT '',
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  capture_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  requires_refund BOOLEAN NOT NULL DEFAULT false,
  raw_status TEXT NOT NULL DEFAULT '',
  error TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_booking_request_id
  ON payment_orders(booking_request_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_orders_status
  ON payment_orders(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_orders_one_active_per_request
  ON payment_orders(booking_request_id)
  WHERE is_active = true;

DROP TRIGGER IF EXISTS payment_orders_updated_at ON payment_orders;
CREATE TRIGGER payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO payment_orders (
  booking_request_id,
  provider,
  provider_order_id,
  status,
  approval_url,
  amount,
  currency,
  capture_id,
  is_active,
  raw_status,
  paid_at,
  created_at
)
SELECT
  id,
  COALESCE(payment_provider, 'paypal'),
  payment_order_id,
  CASE
    WHEN payment_status = 'paid' THEN 'paid'
    WHEN payment_status = 'failed' THEN 'failed'
    WHEN payment_status = 'expired' THEN 'expired'
    ELSE 'created'
  END,
  COALESCE(payment_approval_url, ''),
  COALESCE(payment_amount, estimated_total),
  COALESCE(payment_currency, 'USD'),
  payment_capture_id,
  payment_status = 'pending',
  payment_status::TEXT,
  payment_paid_at,
  COALESCE(payment_created_at, created_at)
FROM booking_requests
WHERE payment_order_id IS NOT NULL
ON CONFLICT (provider_order_id) DO NOTHING;
