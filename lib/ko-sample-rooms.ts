// Sample rooms for working on /ko locally without database credentials
// (e.g. a cloud checkout with no .env). Never used in production.

import type { RoomWithImages } from "./types";

const base = {
  description: "",
  nightly_rate_usd: 0,
  long_stay_discount: 0,
  capacity: 1,
  size_sqm: null,
  amenities: [],
  status: "available" as const,
  available_from: null,
  featured: false,
  created_at: "",
  updated_at: "",
};

function images(roomId: string, urls: string[]) {
  return urls.map((url, i) => ({
    id: `${roomId}-${i}`,
    room_id: roomId,
    url,
    alt: "",
    sort_order: i + 1,
    created_at: "",
  }));
}

export const koSampleRooms: RoomWithImages[] = [
  {
    ...base,
    id: "sample-economy",
    name: "Economy Room",
    name_ko: "기본 방",
    slug: "economy-room",
    sort_order: 1,
    monthly_rate_krw: 380000,
    deposit_krw: 100000,
    room_images: images("sample-economy", [
      "/images/economy/1.main.jpg",
      "/images/economy/2.desk.jpg",
      "/images/economy/7.window-room-corner.jpg",
    ]),
  },
  {
    ...base,
    id: "sample-shower",
    name: "Private Shower Room",
    name_ko: "원룸(샤워)",
    slug: "room-with-private-shower",
    sort_order: 2,
    status: "limited",
    monthly_rate_krw: 500000,
    deposit_krw: 100000,
    room_images: images("sample-shower", [
      "/images/private-shower/2.main-2.jpg",
      "/images/private-shower/1.main.jpg",
      "/images/private-shower/7.window-day.jpg",
    ]),
  },
  {
    ...base,
    id: "sample-toilet",
    name: "Private Shower & Toilet Room",
    name_ko: "원룸(샤워&화장실)",
    slug: "room-with-private-shower-and-toilet",
    sort_order: 3,
    monthly_rate_krw: 500000,
    deposit_krw: 100000,
    room_images: images("sample-toilet", [
      "/images/private-toilet-and-shower/1.main.jpg",
      "/images/private-toilet-and-shower/2.shower.jpg",
      "/images/private-toilet-and-shower/4.window.jpg",
    ]),
  },
];
