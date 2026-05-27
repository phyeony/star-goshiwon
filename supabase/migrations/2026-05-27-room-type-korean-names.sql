ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS name_ko TEXT;

UPDATE rooms
SET name_ko = CASE
  WHEN slug = 'economy-room' THEN '기본 방'
  WHEN slug = 'room-with-private-shower' THEN '원룸(샤워)'
  WHEN slug = 'room-with-private-shower-and-toilet' THEN '원룸(샤워&화장실)'
  ELSE name_ko
END
WHERE slug IN (
  'economy-room',
  'room-with-private-shower',
  'room-with-private-shower-and-toilet'
);
