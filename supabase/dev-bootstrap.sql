-- Goshiwon dev database bootstrap.
--
-- Paste this into the Supabase SQL editor of your NEW dev project
-- (goshiwon-dev) and run it once. It creates the full schema and
-- seeds the rooms + room_images tables with the same data as prod.
-- booking_requests is intentionally left empty so dev submissions
-- don't mix with production data.
--
-- UUIDs are copied from prod so any hardcoded references stay valid.
-- Safe to re-run: the DROPs at the top wipe the public schema first.

-- ============================================================================
-- Clean slate (safe because this script targets a fresh dev project)
-- ============================================================================
DROP TABLE IF EXISTS booking_requests CASCADE;
DROP TABLE IF EXISTS room_images CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TYPE IF EXISTS booking_status;
DROP TYPE IF EXISTS room_status;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- ============================================================================
-- Schema
-- ============================================================================

CREATE TYPE room_status AS ENUM (
  'available',
  'available_soon',
  'limited',
  'unavailable'
);

CREATE TYPE booking_status AS ENUM (
  'new',
  'reviewing',
  'contacted',
  'approved',
  'declined',
  'expired',
  'closed'
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_monthly INTEGER NOT NULL,
  price_weekly INTEGER NOT NULL,
  price_daily INTEGER NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  size_sqm NUMERIC(5,1),
  amenities TEXT[] NOT NULL DEFAULT '{}',
  status room_status NOT NULL DEFAULT 'available',
  available_from DATE,
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE room_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_room_images_room_id ON room_images(room_id);

CREATE TABLE booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  room_slug TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  estimated_total INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  status booking_status NOT NULL DEFAULT 'new',
  admin_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_requests_status ON booking_requests(status);
CREATE INDEX idx_booking_requests_created_at ON booking_requests(created_at DESC);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER booking_requests_updated_at
  BEFORE UPDATE ON booking_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- Seed data (snapshot from prod as of dev bootstrap)
-- ============================================================================

INSERT INTO rooms (id, name, slug, description, price_monthly, price_weekly, price_daily, capacity, size_sqm, amenities, status, available_from, featured, sort_order) VALUES
('ad3eaa2a-0e8e-47c3-819a-7016bd9290a5', 'Economy Room', 'economy-room', 'Our most affordable private room with shared shower and toilet facilities. Perfect for short stays, students, and budget-conscious guests. All rooms include an outside-facing window, fast Wi-Fi, AC/heating, a desk, and a mini fridge.', 340000, 100000, 15000, 1, 5.5, ARRAY['Shared Showers','Shared Toilets','AC / Heat','Fast WiFi','Desk & Chair','Mini Fridge','Shelf & Cabinet','Outside-Facing Window'], 'available', NULL, false, 1),
('5044b1be-9895-48d3-a323-2b15760ebe23', 'Private Shower Room', 'room-with-private-shower', 'A private room with your own shower and access to a shared toilet. With no toilet taking up space, the shower area is larger than in our Private Shower & Toilet Room. A smart choice for guests who want extra convenience at a reasonable price. Includes an outside-facing window, fast Wi-Fi, AC/heating, a desk, and a mini fridge.', 408000, 120000, 18000, 1, 6.5, ARRAY['Private Shower','Bigger Shower Space','Shared Toilet','AC / Heat','Fast WiFi','Desk & Chair','Mini Fridge','Shelf & Cabinet','Outside-Facing Window'], 'available', NULL, true, 2),
('c3e320d5-291f-49b7-84a5-73537bfb95cd', 'Private Shower & Toilet Room', 'room-with-private-shower-and-toilet', 'Our most private room with both your own shower and toilet. Ideal for guests who want the most convenience and privacy during their stay. Includes an outside-facing window, fast Wi-Fi, AC/heating, a desk, and a mini fridge.', 408000, 120000, 18000, 1, 6.5, ARRAY['Private Shower','Private Toilet','AC / Heat','Fast WiFi','Desk & Chair','Mini-fridge','Shelf & Cabinet','Outside-Facing Window'], 'available', NULL, true, 3);

INSERT INTO room_images (id, room_id, url, alt, sort_order) VALUES
-- Economy Room
('88bceee1-32ad-48de-bb34-3c92ba5edb6e', 'ad3eaa2a-0e8e-47c3-819a-7016bd9290a5', '/images/economy/1.main.jpg', 'Economy room - main view', 1),
('0e594b11-b297-4da1-9fd2-db12e1c8971d', 'ad3eaa2a-0e8e-47c3-819a-7016bd9290a5', '/images/economy/2.desk.jpg', 'Desk', 2),
('cf40c127-1f64-4f97-978b-e53e0a118a29', 'ad3eaa2a-0e8e-47c3-819a-7016bd9290a5', '/images/economy/3.right-side-cabinet.jpg', 'Cabinet on the right side', 3),
('f147a076-3756-4baf-a30a-943988792f81', 'ad3eaa2a-0e8e-47c3-819a-7016bd9290a5', '/images/economy/4.shelf.jpg', 'Shelf', 4),
('f9afbc74-dd53-455a-8dc5-86cfaa3523c1', 'ad3eaa2a-0e8e-47c3-819a-7016bd9290a5', '/images/economy/5.ac.jpg', 'Air conditioning', 5),
('3ece1f5e-13a7-4884-8279-2d37a44c7ec7', 'ad3eaa2a-0e8e-47c3-819a-7016bd9290a5', '/images/economy/6.refrigerator.jpg', 'Mini fridge', 6),
('ecf07b97-8db5-4b4f-ac25-9e0efce31230', 'ad3eaa2a-0e8e-47c3-819a-7016bd9290a5', '/images/economy/7.window-room-corner.jpg', 'Window and corner of the room', 7),
-- Private Shower Room
('66bc25de-4195-4f5f-bb6d-75fcc71bad46', '5044b1be-9895-48d3-a323-2b15760ebe23', '/images/private-shower/1.main.jpg', 'Private shower room - main view', 1),
('2009bbeb-3c86-4a3a-8089-2b16d3651ed7', '5044b1be-9895-48d3-a323-2b15760ebe23', '/images/private-shower/2.main-2.jpg', 'Private shower room - alternate angle', 2),
('fba02ebe-f3a0-4bbf-9cab-ea190ea560eb', '5044b1be-9895-48d3-a323-2b15760ebe23', '/images/private-shower/3.shower-right-side.jpg', 'Private shower', 3),
('5e2e1e62-4f7e-4025-8fb5-843bfe9d14b4', '5044b1be-9895-48d3-a323-2b15760ebe23', '/images/private-shower/4.window-and-shower.jpg', 'Window and shower', 4),
('e15495fa-889f-4193-86df-3e833fa6aeb6', '5044b1be-9895-48d3-a323-2b15760ebe23', '/images/private-shower/5.bathroom-sink.jpg', 'Bathroom sink', 5),
('0f483aef-ba1d-40f9-8a53-18b6640dc724', '5044b1be-9895-48d3-a323-2b15760ebe23', '/images/private-shower/6.ac.jpg', 'Air conditioning', 6),
('a415c555-873c-4b75-8906-bce3a8187fff', '5044b1be-9895-48d3-a323-2b15760ebe23', '/images/private-shower/7.window-day.jpg', 'Window during the day', 7),
('b10b9b05-11b6-4ff8-aab4-908dc51fdeb6', '5044b1be-9895-48d3-a323-2b15760ebe23', '/images/private-shower/8.window-night.jpg', 'Window at night', 8),
('b4f09ad1-a182-40fd-b5c8-734d1f545d2f', '5044b1be-9895-48d3-a323-2b15760ebe23', '/images/private-shower/9.refrigerator.jpg', 'Mini fridge', 9),
-- Private Shower & Toilet Room
('a8d3ef78-5439-47a1-8208-6b77834f7b86', 'c3e320d5-291f-49b7-84a5-73537bfb95cd', '/images/private-toilet-and-shower/1.main.jpg', 'Private shower and toilet room - main view', 1),
('86cfa88e-7e26-4a31-a212-9b2bd0937a86', 'c3e320d5-291f-49b7-84a5-73537bfb95cd', '/images/private-toilet-and-shower/2.shower.jpg', 'Private shower', 2),
('74e0e930-b0ac-4307-95ca-1f874178d539', 'c3e320d5-291f-49b7-84a5-73537bfb95cd', '/images/private-toilet-and-shower/3.sink.png', 'Bathroom sink', 3),
('38bbd511-0a83-4bfd-8416-8b63f629ba21', 'c3e320d5-291f-49b7-84a5-73537bfb95cd', '/images/private-toilet-and-shower/4.toilet.jpg', 'Private toilet', 4),
('d06fb658-ef66-4118-b326-a259eec3eeff', 'c3e320d5-291f-49b7-84a5-73537bfb95cd', '/images/private-toilet-and-shower/4.window.jpg', 'Window', 5),
('1657cc00-b2bb-43af-a14b-e909b5e294c1', 'c3e320d5-291f-49b7-84a5-73537bfb95cd', '/images/private-toilet-and-shower/5.left-side.jpg', 'Left side of room', 6),
('cd54ec8f-7041-4486-9061-4827875ffd9d', 'c3e320d5-291f-49b7-84a5-73537bfb95cd', '/images/private-toilet-and-shower/6.left-side-cabinet-shelf.jpg', 'Cabinet and shelf', 7),
('d5f558c7-7927-4a31-a622-082a8603123e', 'c3e320d5-291f-49b7-84a5-73537bfb95cd', '/images/private-toilet-and-shower/7.refrigerator.jpg', 'Mini fridge', 8);

-- ============================================================================
-- Sanity check
-- ============================================================================
-- After running, verify with:
--   SELECT COUNT(*) FROM rooms;          -- expect 3
--   SELECT COUNT(*) FROM room_images;    -- expect 24
--   SELECT COUNT(*) FROM booking_requests; -- expect 0
