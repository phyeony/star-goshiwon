-- Korean site (/ko): monthly KRW prices per room, and booking requests that
-- come in with a phone number (answered on KakaoTalk) instead of an email.

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS monthly_rate_krw INTEGER CHECK (monthly_rate_krw IS NULL OR monthly_rate_krw >= 0),
  ADD COLUMN IF NOT EXISTS deposit_krw INTEGER CHECK (deposit_krw IS NULL OR deposit_krw >= 0);

ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'ko')),
  ADD COLUMN IF NOT EXISTS guest_phone TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS stay_months INTEGER CHECK (stay_months IS NULL OR stay_months BETWEEN 1 AND 24);

CREATE INDEX IF NOT EXISTS idx_booking_requests_locale ON booking_requests(locale);
