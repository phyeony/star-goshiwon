-- Inbound email log for guest replies imported from a mail provider or
-- Cloudflare Email Routing worker.

CREATE TABLE IF NOT EXISTS email_receives (
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

CREATE INDEX IF NOT EXISTS idx_email_receives_booking_request_id
  ON email_receives(booking_request_id, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_receives_from_email
  ON email_receives(from_email, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_receives_provider_thread_id
  ON email_receives(provider, provider_thread_id);

CREATE INDEX IF NOT EXISTS idx_email_receives_match_status
  ON email_receives(match_status, received_at DESC);

ALTER TABLE email_receives DISABLE ROW LEVEL SECURITY;
