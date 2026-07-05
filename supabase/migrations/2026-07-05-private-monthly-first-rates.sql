-- Monthly-first pricing across all room types. A higher flat nightly rate paired
-- with a 40% long-stay (28+ nights) discount positions every room as a monthly
-- product: the higher short-stay rate gently discourages sub-week guests, while
-- the effective long-stay rate stays attractive to foreign monthly guests.
--   Economy: $15/night, 40% off  → ~$9.00/night long-stay (≈₩40만/mo)
--   Private: $20/night, 40% off  → ~$12.00/night long-stay (≈₩53만/mo)
-- (KRW at ₩1,480/$.)
--
-- Rates are stored in the rooms table (see 2026-07-05-room-nightly-rate-pricing.sql).
-- These UPDATEs are idempotent and safe to re-run.

UPDATE rooms
  SET nightly_rate_usd = 15, long_stay_discount = 0.40
  WHERE slug = 'economy-room';

UPDATE rooms
  SET nightly_rate_usd = 20, long_stay_discount = 0.40
  WHERE slug IN ('room-with-private-shower', 'room-with-private-shower-and-toilet');
