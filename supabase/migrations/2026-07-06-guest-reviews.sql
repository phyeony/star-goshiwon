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
