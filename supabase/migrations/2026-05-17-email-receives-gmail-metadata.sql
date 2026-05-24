-- Safe follow-up for databases where email_receives was created before
-- Gmail import metadata fields were added.

ALTER TABLE email_receives
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS provider_thread_id TEXT,
  ADD COLUMN IF NOT EXISTS match_status TEXT NOT NULL DEFAULT 'unmatched';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'email_receives_match_status_check'
  ) THEN
    ALTER TABLE email_receives
      ADD CONSTRAINT email_receives_match_status_check
      CHECK (match_status IN ('matched', 'unmatched', 'ambiguous', 'ignored'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_receives_provider_thread_id
  ON email_receives(provider, provider_thread_id);

CREATE INDEX IF NOT EXISTS idx_email_receives_match_status
  ON email_receives(match_status, received_at DESC);
