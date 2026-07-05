-- Move room pricing into the database as the single source of truth: one flat
-- USD nightly rate per room, plus a long-stay discount fraction applied at 28+
-- nights (the 28-night threshold stays a code constant, LONG_STAY_MIN_NIGHTS).
-- Weekly and 4-week prices are derived in the app from the nightly rate
-- (weekly = nightly*7; monthly = round(nightly*28*(1-discount))).
--
-- Replaces the legacy KRW price_weekly/price_monthly/price_daily columns, which
-- were unused for charging (the real USD prices lived in code). Backfill values
-- come from the code constants that were live at migration time: $11/night for
-- the economy room, $13/night for the private rooms, 15% long-stay discount.

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS nightly_rate_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS long_stay_discount NUMERIC(4, 3) NOT NULL DEFAULT 0.15;

UPDATE rooms SET nightly_rate_usd = 11 WHERE slug = 'economy-room';
UPDATE rooms SET nightly_rate_usd = 13
  WHERE slug IN ('room-with-private-shower', 'room-with-private-shower-and-toilet');

ALTER TABLE rooms
  DROP COLUMN IF EXISTS price_weekly,
  DROP COLUMN IF EXISTS price_monthly,
  DROP COLUMN IF EXISTS price_daily;
