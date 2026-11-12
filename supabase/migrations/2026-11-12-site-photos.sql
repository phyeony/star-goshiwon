-- Photo library for the website (admin → 사진 관리).
--
-- site_photos is the library: every photo the admin can choose from. A photo
-- is either a file shipped with the site under /public ("static", the photos
-- that existed before the library) or an upload stored in Cloudflare R2
-- ("r2"). Uploads are resized in the browser into the same widths the static
-- photos use (384–1600px) and stored as "<path>-<width>.<ext>".
--
-- site_photo_placements says which photos show in which section of the site,
-- in what order: one gallery per room type, plus the shared-spaces section.
-- Both the English site and /ko read the same placements; each photo carries
-- an English and a Korean caption.
--
-- room_images is no longer read by the app. It is left in place, untouched,
-- so the change can be rolled back by deploying the previous code.

CREATE TABLE IF NOT EXISTS site_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('static', 'r2')),
  -- static: path under /public, e.g. "/images/economy/1.main.jpg"
  -- r2: object key prefix, e.g. "photos/2f1c…"; files are "<path>-<width>.<ext>"
  path TEXT NOT NULL UNIQUE,
  ext TEXT CHECK (ext IN ('webp', 'jpg')),
  width INTEGER,
  height INTEGER,
  caption_en TEXT NOT NULL DEFAULT '',
  caption_ko TEXT NOT NULL DEFAULT '',
  original_filename TEXT,
  -- Which room (by number) the photo was taken in. Optional; used to sort
  -- and filter the library, and later for per-room-number galleries.
  room_unit_id UUID REFERENCES room_units(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((source = 'r2') = (ext IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_site_photos_room_unit ON site_photos (room_unit_id);

CREATE TABLE IF NOT EXISTS site_photo_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL CHECK (section IN ('room', 'shared')),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES site_photos(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((section = 'room') = (room_id IS NOT NULL)),
  UNIQUE NULLS NOT DISTINCT (section, room_id, photo_id)
);

CREATE INDEX IF NOT EXISTS idx_site_photo_placements_section
  ON site_photo_placements (section, room_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_site_photo_placements_photo
  ON site_photo_placements (photo_id);

-- Server code uses the service role; no client reads these tables directly.
ALTER TABLE site_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_photo_placements ENABLE ROW LEVEL SECURITY;

-- Replace one section's photos (in order) in a single transaction.
CREATE OR REPLACE FUNCTION set_photo_section(
  p_section TEXT,
  p_room_id UUID,
  p_photo_ids UUID[]
) RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  DELETE FROM site_photo_placements
  WHERE section = p_section
    AND room_id IS NOT DISTINCT FROM p_room_id;

  INSERT INTO site_photo_placements (section, room_id, photo_id, sort_order)
  SELECT p_section, p_room_id, t.photo_id, t.ord
  FROM unnest(p_photo_ids) WITH ORDINALITY AS t(photo_id, ord);
END;
$$;

REVOKE EXECUTE ON FUNCTION set_photo_section(TEXT, UUID, UUID[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION set_photo_section(TEXT, UUID, UUID[]) TO service_role;

-- ─── Import the photos the site already ships with ───

WITH captions(path, caption_en, caption_ko) AS (
  VALUES
    ('/images/economy/1.main.jpg', 'Economy room - main view', '기본 방 - 전체 모습'),
    ('/images/economy/2.desk.jpg', 'Desk', '책상'),
    ('/images/economy/3.right-side-cabinet.jpg', 'Cabinet on the right side', '오른쪽 수납장'),
    ('/images/economy/4.shelf.jpg', 'Shelf', '선반'),
    ('/images/economy/5.ac.jpg', 'Air conditioning', '에어컨'),
    ('/images/economy/6.refrigerator.jpg', 'Mini fridge', '미니 냉장고'),
    ('/images/economy/7.window-room-corner.jpg', 'Window and room corner', '창문과 방 모서리'),
    ('/images/private-shower/1.main.jpg', 'Private shower room - main view', '샤워실 방 - 전체 모습'),
    ('/images/private-shower/2.main-2.jpg', 'Private shower room - alternate angle', '샤워실 방 - 다른 각도'),
    ('/images/private-shower/3.shower-right-side.jpg', 'Private shower', '개인 샤워실'),
    ('/images/private-shower/4.window-and-shower.jpg', 'Window and shower', '창문과 샤워실'),
    ('/images/private-shower/5.bathroom-sink.jpg', 'Bathroom sink', '세면대'),
    ('/images/private-shower/6.ac.jpg', 'Air conditioning', '에어컨'),
    ('/images/private-shower/7.window-day.jpg', 'Window during the day', '낮의 창밖 풍경'),
    ('/images/private-shower/8.window-night.jpg', 'Window at night', '밤의 창밖 풍경'),
    ('/images/private-shower/9.refrigerator.jpg', 'Mini fridge', '미니 냉장고'),
    ('/images/private-toilet-and-shower/1.main.jpg', 'Private shower and toilet room - main view', '샤워실·화장실 방 - 전체 모습'),
    ('/images/private-toilet-and-shower/2.shower.jpg', 'Private shower', '개인 샤워실'),
    ('/images/private-toilet-and-shower/3.sink.png', 'Bathroom sink', '세면대'),
    ('/images/private-toilet-and-shower/4.toilet.jpg', 'Private toilet', '개인 화장실'),
    ('/images/private-toilet-and-shower/4.window.jpg', 'Window', '창문'),
    ('/images/private-toilet-and-shower/5.left-side.jpg', 'Left side of room', '방 왼쪽'),
    ('/images/private-toilet-and-shower/6.left-side-cabinet-shelf.jpg', 'Cabinet and shelf', '수납장과 선반'),
    ('/images/private-toilet-and-shower/7.refrigerator.jpg', 'Mini fridge', '미니 냉장고'),
    ('/images/guides/shared-kitchen/kitchen.jpg', 'Shared Kitchen', '공용 주방'),
    ('/images/common/balcony.jpg', 'Balcony', '발코니'),
    ('/images/common/laundry.png', 'Laundry', '세탁실'),
    ('/images/common/microwave.jpg', 'Microwave', '전자레인지'),
    ('/images/common/rice-cooker.jpg', 'Rice Cooker', '밥솥 (밥 제공)'),
    ('/images/common/filtered-water-dispenser.jpg', 'Filtered Water Dispenser', '정수기'),
    ('/images/guides/shared-kitchen/kimchi-refridgerator.jpg', 'Shared refrigerator for kimchi', '김치 냉장고'),
    ('/images/guides/shared-kitchen/kimchi.jpg', 'Star Kimchi', '스타 김치')
)
INSERT INTO site_photos (source, path, caption_en, caption_ko, created_at)
SELECT 'static', c.path, c.caption_en, c.caption_ko,
       -- Keep the import in a stable order in the library (newest first).
       now() - (row_number() OVER () || ' seconds')::interval
FROM captions c
ON CONFLICT (path) DO NOTHING;

-- Room galleries: same photos and order as room_images.
INSERT INTO site_photo_placements (section, room_id, photo_id, sort_order)
SELECT 'room', ri.room_id, sp.id, ri.sort_order
FROM room_images ri
JOIN site_photos sp ON sp.path = ri.url
ON CONFLICT DO NOTHING;

-- Shared spaces: same photos and order as the old hard-coded list.
INSERT INTO site_photo_placements (section, room_id, photo_id, sort_order)
SELECT 'shared', NULL, sp.id, s.ord
FROM (VALUES
  ('/images/guides/shared-kitchen/kitchen.jpg', 1),
  ('/images/common/balcony.jpg', 2),
  ('/images/common/laundry.png', 3),
  ('/images/common/microwave.jpg', 4),
  ('/images/common/rice-cooker.jpg', 5),
  ('/images/common/filtered-water-dispenser.jpg', 6)
) AS s(path, ord)
JOIN site_photos sp ON sp.path = s.path
ON CONFLICT DO NOTHING;
