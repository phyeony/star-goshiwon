-- Guest passport photos for identity checks (plan: passport photo plan doc).
--
-- The image itself lives encrypted (AES-256-GCM) in the private R2 bucket
-- bound as PASSPORTS; this table only points at it. No passport number or
-- other passport field is ever stored. Rows are kept after the image is
-- deleted (deleted_at set) as the record that a check happened.
--
-- Retention: deleted on the guest's check-out day, or 7 days after a request
-- is declined / expired / closed (lib/passport/retention.ts, daily cron).

ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS passport_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS passport_token_created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS passport_checked_at TIMESTAMPTZ,
  -- When status last changed; the 7-day clock after a decline counts from
  -- here, so later edits (notes etc.) don't push deletion back.
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ;

-- No backfill: rows from before this keep status_changed_at NULL and the
-- retention code falls back to updated_at for them.

CREATE OR REPLACE FUNCTION booking_requests_status_changed_at() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_requests_status_changed_at
  BEFORE INSERT OR UPDATE ON booking_requests
  FOR EACH ROW EXECUTE FUNCTION booking_requests_status_changed_at();

CREATE TABLE IF NOT EXISTS passport_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_request_id UUID NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'image/jpeg',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  consent_at TIMESTAMPTZ NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  delete_reason TEXT
);

CREATE INDEX IF NOT EXISTS passport_photos_request_idx
  ON passport_photos (booking_request_id);
CREATE INDEX IF NOT EXISTS passport_photos_active_idx
  ON passport_photos (uploaded_at) WHERE deleted_at IS NULL;

-- Who opened or changed a photo, and when (PIPA access-log expectation).
CREATE TABLE IF NOT EXISTS passport_photo_log (
  id BIGSERIAL PRIMARY KEY,
  photo_id UUID REFERENCES passport_photos(id) ON DELETE SET NULL,
  booking_request_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('upload', 'view', 'checked', 'delete', 'auto_delete', 'link_created', 'link_sent')),
  actor TEXT NOT NULL DEFAULT '',
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS passport_photo_log_request_idx
  ON passport_photo_log (booking_request_id, at DESC);

-- Service role only: no policies, so anon/authenticated clients get nothing.
ALTER TABLE passport_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE passport_photo_log ENABLE ROW LEVEL SECURITY;
