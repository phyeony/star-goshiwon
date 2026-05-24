-- Goshiwon V1 Database Schema

-- Room availability status enum
CREATE TYPE room_status AS ENUM (
  'available',
  'available_soon',
  'limited',
  'unavailable'
);

-- Booking request status enum
CREATE TYPE booking_status AS ENUM (
  'new',
  'reviewing',
  'contacted',
  'approved',
  'confirmed',
  'declined',
  'expired',
  'closed'
);

CREATE TYPE payment_status AS ENUM (
  'none',
  'pending',
  'paid',
  'failed',
  'expired',
  'refunded'
);

-- Room types table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_monthly INTEGER NOT NULL,
  price_weekly INTEGER NOT NULL,
  price_daily INTEGER NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  size_sqm NUMERIC(5,1),
  amenities TEXT[] NOT NULL DEFAULT '{}',
  status room_status NOT NULL DEFAULT 'available',
  available_from DATE,
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Room images table
CREATE TABLE room_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_room_images_room_id ON room_images(room_id);

-- Booking requests table
CREATE TABLE booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  room_slug TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  -- estimated_total is USD post-cutover (PayPal). Pre-cutover rows are KRW.
  estimated_total INTEGER NOT NULL DEFAULT 0,
  bedding_prepaid BOOLEAN NOT NULL DEFAULT false,
  payment_status payment_status NOT NULL DEFAULT 'none',
  payment_provider TEXT,
  payment_order_id TEXT,
  payment_capture_id TEXT,
  payment_approval_url TEXT,
  payment_amount INTEGER,
  payment_currency TEXT,
  payment_created_at TIMESTAMPTZ,
  payment_paid_at TIMESTAMPTZ,
  payment_expires_at TIMESTAMPTZ,
  payment_token_hash TEXT,
  payment_token_created_at TIMESTAMPTZ,
  payment_error TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status booking_status NOT NULL DEFAULT 'new',
  admin_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_requests_status ON booking_requests(status);
CREATE INDEX idx_booking_requests_created_at ON booking_requests(created_at DESC);
CREATE INDEX idx_booking_requests_payment_order_id ON booking_requests(payment_order_id);
CREATE INDEX idx_booking_requests_payment_status ON booking_requests(payment_status);
CREATE INDEX idx_booking_requests_payment_token_hash ON booking_requests(payment_token_hash);

CREATE TABLE payment_orders (
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

CREATE INDEX idx_payment_orders_booking_request_id
  ON payment_orders(booking_request_id, created_at DESC);
CREATE INDEX idx_payment_orders_status ON payment_orders(status);
CREATE UNIQUE INDEX idx_payment_orders_one_active_per_request
  ON payment_orders(booking_request_id)
  WHERE is_active = true;

CREATE TABLE email_receives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_request_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'manual',
  provider_thread_id TEXT,
  provider_message_id TEXT UNIQUE,
  match_status TEXT NOT NULL DEFAULT 'unmatched' CHECK (
    match_status IN ('matched', 'unmatched', 'ambiguous', 'ignored')
  ),
  subject TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL DEFAULT '',
  to_email TEXT NOT NULL DEFAULT '',
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_receives_booking_request_id
  ON email_receives(booking_request_id, received_at DESC);
CREATE INDEX idx_email_receives_from_email
  ON email_receives(from_email, received_at DESC);
CREATE INDEX idx_email_receives_provider_thread_id
  ON email_receives(provider, provider_thread_id);
CREATE INDEX idx_email_receives_match_status
  ON email_receives(match_status, received_at DESC);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER booking_requests_updated_at
  BEFORE UPDATE ON booking_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
