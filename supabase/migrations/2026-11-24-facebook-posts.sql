-- Facebook group posting tracker (admin → 페이스북 홍보).
--
-- facebook_groups: the groups the owner posts in (name + link to open).
-- facebook_posts: ready-to-paste post texts, each with photos from the
--   site photo library (photo_ids → site_photos.id, in display order).
-- facebook_post_log: one row each time a post was put up in a group, so the
--   admin page can show "posted this week" and "last posted".
--
-- Posting itself is manual: Facebook does not allow automated group posts.

CREATE TABLE IF NOT EXISTS facebook_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS facebook_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  photo_ids UUID[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS facebook_post_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES facebook_groups(id) ON DELETE CASCADE,
  post_id UUID REFERENCES facebook_posts(id) ON DELETE SET NULL,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facebook_post_log_group
  ON facebook_post_log (group_id, posted_at DESC);

-- Only the server (service role) reads and writes these.
ALTER TABLE facebook_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_post_log ENABLE ROW LEVEL SECURITY;

-- Starter posts (2026-11-24 prices: economy $15/night, private $20/night,
-- 40% off 4+ weeks). Edit them on the admin page when prices change.
INSERT INTO facebook_posts (title, body, photo_ids, sort_order)
SELECT '가격 중심 (학생·저예산 그룹)', $post$Looking for a cheap private room in Seoul? 🏠

I run Star Goshiwon in Dongjak-gu (Noryangjin area). Every room is private, with its own door, bed, desk, mini fridge, AC/heating and a window facing outside.

• Economy room: $105 (~₩155,000) for 1 week, or $252 (~₩373,000) for 4 weeks
• Private shower rooms: $140 (~₩207,000) per week, or $336 (~₩497,000) for 4 weeks
• 4+ weeks = 40% off. Minimum stay is 1 week.
• Utilities and Wi-Fi included, plus free rice and kimchi in the shared kitchen

No year-long lease and no big key money, just a $70 (~₩100,000) refundable deposit.

Booking is in English: goshiwonseoul.com/request-to-book (requesting is free, we reply within 24 hours).
Men-only residence.$post$,
  COALESCE((SELECT array_agg(sp.id ORDER BY array_position(ARRAY['photos/c59f65a3-a884-4004-aaf3-ab63b4ac738c','/images/guides/shared-kitchen/kitchen.jpg'], sp.path)) FROM site_photos sp WHERE sp.path = ANY(ARRAY['photos/c59f65a3-a884-4004-aaf3-ab63b4ac738c','/images/guides/shared-kitchen/kitchen.jpg'])), '{}'),
  1
WHERE NOT EXISTS (SELECT 1 FROM facebook_posts WHERE title = '가격 중심 (학생·저예산 그룹)');

INSERT INTO facebook_posts (title, body, photo_ids, sort_order)
SELECT '위치·교통 (외국인·신규 이주 그룹)', $post$Moving to Seoul and need somewhere to land for a few weeks?

Star Goshiwon is a 5-minute walk from Sangdo Station (Line 7), 10 minutes from Noryangjin (Lines 1 and 9) and 12 minutes from Sindaebang (Line 2). Four subway lines nearby makes getting across the city easy, and the neighbourhood itself is quiet and residential.

Private furnished rooms from $15/night, with 40% off when you stay 4 weeks or more ($252 for 4 weeks in an economy room). Utilities, Wi-Fi, shared kitchen and laundry are all included.

Happy to answer questions in English here or on WhatsApp.
Request a room: goshiwonseoul.com/request-to-book
(Men-only residence.)$post$,
  COALESCE((SELECT array_agg(sp.id ORDER BY array_position(ARRAY['/images/private-shower/7.window-day.jpg','photos/c59f65a3-a884-4004-aaf3-ab63b4ac738c'], sp.path)) FROM site_photos sp WHERE sp.path = ANY(ARRAY['/images/private-shower/7.window-day.jpg','photos/c59f65a3-a884-4004-aaf3-ab63b4ac738c'])), '{}'),
  2
WHERE NOT EXISTS (SELECT 1 FROM facebook_posts WHERE title = '위치·교통 (외국인·신규 이주 그룹)');

INSERT INTO facebook_posts (title, body, photo_ids, sort_order)
SELECT '학생 (대학·교환학생 그룹)', $post$Exchange students and language school students: still sorting out housing for next semester? 📚

Star Goshiwon is a quiet goshiwon in Noryangjin, a neighbourhood known for people studying for exams, so the building stays quiet (quiet hours 11 PM to 6 AM). Every room has a desk and chair, fast Wi-Fi and its own outside window.

• Stay from 1 week, no 12-month contract
• 4 weeks from $252 (~₩373,000) with the long-stay discount
• Confirmed guests can get a residence confirmation document for immigration/visa paperwork
• Rice and kimchi provided in the shared kitchen

Booking and check-in are all in English: goshiwonseoul.com
Men-only residence.$post$,
  COALESCE((SELECT array_agg(sp.id ORDER BY array_position(ARRAY['photos/e566f02a-9c57-43a7-bfb3-30f17c29e3b1','photos/46e919fb-faa1-45be-b2ad-3e7b564b73b2'], sp.path)) FROM site_photos sp WHERE sp.path = ANY(ARRAY['photos/e566f02a-9c57-43a7-bfb3-30f17c29e3b1','photos/46e919fb-faa1-45be-b2ad-3e7b564b73b2'])), '{}'),
  3
WHERE NOT EXISTS (SELECT 1 FROM facebook_posts WHERE title = '학생 (대학·교환학생 그룹)');

INSERT INTO facebook_posts (title, body, photo_ids, sort_order)
SELECT '개인 욕실 (호스텔에 지친 사람)', $post$Done with hostel dorms? Here's a private room with your own bathroom in Seoul for $20/night.

Our Private Shower & Toilet Room has its own shower and toilet, plus a bed, desk, mini fridge, AC/heating and an outside window. Stay 4 weeks and it's $336 (~₩497,000) in total, which works out to $12/night.

We also have a Private Shower Room (own shower, shared toilet, bigger shower area) at the same price, and an Economy room from $15/night if you're fine with shared bathrooms.

No lounge and no parties: it's a calm, clean place to sleep and work.
Star Goshiwon, Dongjak-gu (men-only residence).
goshiwonseoul.com/request-to-book$post$,
  COALESCE((SELECT array_agg(sp.id ORDER BY array_position(ARRAY['photos/f130d64a-ba1e-47db-88b3-d3c20bb07fb8','photos/7b237a1f-5492-495c-b922-f64237028e77'], sp.path)) FROM site_photos sp WHERE sp.path = ANY(ARRAY['photos/f130d64a-ba1e-47db-88b3-d3c20bb07fb8','photos/7b237a1f-5492-495c-b922-f64237028e77'])), '{}'),
  4
WHERE NOT EXISTS (SELECT 1 FROM facebook_posts WHERE title = '개인 욕실 (호스텔에 지친 사람)');

INSERT INTO facebook_posts (title, body, photo_ids, sort_order)
SELECT '고시원이란? (설명형)', $post$Ever wondered what a goshiwon is? 🇰🇷

It's a Korean style of housing: a small private furnished room, with a shared kitchen and laundry. They started out for students studying for exams and are now a popular way to stay in Seoul without signing a year-long lease or paying a big deposit.

At Star Goshiwon (Noryangjin, Dongjak-gu) you get:
• Your own room with a bed, desk, mini fridge, AC/heating and a window
• Utilities and Wi-Fi included
• Shared kitchen with free rice and kimchi, plus a washing machine
• Weekly or monthly stays, from $105/week or $252 for 4 weeks

Rooms are small (about 5.5 to 6.5 m²), so it's best for people who want privacy at a low price rather than space. Happy to answer any questions in the comments!
goshiwonseoul.com (men-only residence)$post$,
  COALESCE((SELECT array_agg(sp.id ORDER BY array_position(ARRAY['photos/1b01e4b4-ad01-46f6-8cca-d45a956606cc','/images/guides/shared-kitchen/kitchen.jpg','/images/common/rice-cooker.jpg'], sp.path)) FROM site_photos sp WHERE sp.path = ANY(ARRAY['photos/1b01e4b4-ad01-46f6-8cca-d45a956606cc','/images/guides/shared-kitchen/kitchen.jpg','/images/common/rice-cooker.jpg'])), '{}'),
  5
WHERE NOT EXISTS (SELECT 1 FROM facebook_posts WHERE title = '고시원이란? (설명형)');

INSERT INTO facebook_posts (title, body, photo_ids, sort_order)
SELECT '짧은 버전', $post$Private rooms in Seoul, by the week or month 🙂

Star Goshiwon, near Noryangjin and Sangdo stations. From $15/night, $252 for 4 weeks. Utilities, Wi-Fi, kitchen and laundry included. English-speaking booking, 1-week minimum. Men-only.

Request a room (free, reply within 24h): goshiwonseoul.com/request-to-book$post$,
  COALESCE((SELECT array_agg(sp.id ORDER BY array_position(ARRAY['photos/46e919fb-faa1-45be-b2ad-3e7b564b73b2'], sp.path)) FROM site_photos sp WHERE sp.path = ANY(ARRAY['photos/46e919fb-faa1-45be-b2ad-3e7b564b73b2'])), '{}'),
  6
WHERE NOT EXISTS (SELECT 1 FROM facebook_posts WHERE title = '짧은 버전');
