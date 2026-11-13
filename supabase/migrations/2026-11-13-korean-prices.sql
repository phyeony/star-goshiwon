-- Korean-site monthly prices (Nov 13, 2026): 일반실 30만원, 샤워실 35만원, 샤워실+화장실 40만원.
UPDATE rooms SET monthly_rate_krw = CASE slug
  WHEN 'economy-room' THEN 300000
  WHEN 'room-with-private-shower' THEN 350000
  WHEN 'room-with-private-shower-and-toilet' THEN 400000
END
WHERE slug IN ('economy-room', 'room-with-private-shower', 'room-with-private-shower-and-toilet');
