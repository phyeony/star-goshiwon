-- Stay dates on reviews ("Stayed 3 May – 2 Jun 2026"), shown next to the date
-- the review was left. The invite carries the dates (filled from the booking
-- or entered by the admin) and the review copies them on submit.

ALTER TABLE review_invites
  ADD COLUMN IF NOT EXISTS stay_check_in DATE,
  ADD COLUMN IF NOT EXISTS stay_check_out DATE;

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS stay_check_in DATE,
  ADD COLUMN IF NOT EXISTS stay_check_out DATE;

-- Backfill 1: invites minted from a booking request take that booking's dates.
UPDATE review_invites ri
SET stay_check_in = br.check_in_date,
    stay_check_out = br.check_out_date
FROM booking_requests br
WHERE ri.booking_request_id = br.id
  AND ri.stay_check_in IS NULL;

-- Backfill 2: off-platform invites with an email take the guest's most recent
-- confirmed or paid booking (by that email) that started before the invite
-- was made.
WITH match AS (
  SELECT DISTINCT ON (ri.id) ri.id, br.check_in_date, br.check_out_date
  FROM review_invites ri
  JOIN booking_requests br
    ON lower(br.guest_email) = lower(ri.guest_email)
  WHERE ri.stay_check_in IS NULL
    AND (br.status = 'confirmed' OR br.payment_status = 'paid')
    AND br.check_in_date <= (ri.created_at AT TIME ZONE 'Asia/Seoul')::date
  ORDER BY ri.id, br.check_in_date DESC
)
UPDATE review_invites ri
SET stay_check_in = match.check_in_date,
    stay_check_out = match.check_out_date
FROM match
WHERE ri.id = match.id;

-- Backfill 3: otherwise, a non-cancelled room availability block with the same
-- full guest name (two or more words, so a lone first name can't mismatch)
-- that started before the invite was made.
WITH match AS (
  SELECT DISTINCT ON (ri.id) ri.id, b.check_in_date, b.check_out_date
  FROM review_invites ri
  JOIN room_unit_blocks b
    ON lower(regexp_replace(trim(b.guest_name), '\s+', ' ', 'g'))
     = lower(regexp_replace(trim(ri.guest_name), '\s+', ' ', 'g'))
  WHERE ri.stay_check_in IS NULL
    AND trim(ri.guest_name) ~ '\S\s+\S'
    AND b.status <> 'cancelled'
    AND b.check_in_date <= (ri.created_at AT TIME ZONE 'Asia/Seoul')::date
  ORDER BY ri.id, b.check_in_date DESC
)
UPDATE review_invites ri
SET stay_check_in = match.check_in_date,
    stay_check_out = match.check_out_date
FROM match
WHERE ri.id = match.id;

-- Existing reviews copy their invite's dates.
UPDATE reviews r
SET stay_check_in = ri.stay_check_in,
    stay_check_out = ri.stay_check_out
FROM review_invites ri
WHERE r.invite_id = ri.id
  AND r.stay_check_in IS NULL
  AND ri.stay_check_in IS NOT NULL;
