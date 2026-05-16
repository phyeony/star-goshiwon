-- Per-send audit log for emails sent from the admin composer.
-- Replaces the [date] "subject" by ... lines that were previously appended
-- to booking_requests.admin_notes.

CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_request_id UUID NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'send',
  template_slug TEXT,
  template_locale TEXT,
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  body_html TEXT NOT NULL,
  sent_by_email TEXT NOT NULL DEFAULT '',
  sent_to_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  send_status TEXT NOT NULL DEFAULT 'sent',
  send_error TEXT NOT NULL DEFAULT '',
  extra JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_email_sends_booking_request_id
  ON email_sends(booking_request_id, sent_at DESC);

ALTER TABLE email_sends DISABLE ROW LEVEL SECURITY;
