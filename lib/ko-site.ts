// Copy and helpers for the Korean site (/ko). Korean guests already know what a
// goshiwon is and where 노량진 is, so the page leads with price and rooms.

import { siteConfig, stayTimes } from "./site-data";
import type { RoomStatus, RoomWithImages } from "./types";

export const koSite = {
  name: "스타고시원",
  // The main search keyword (Naver: ~5,500 searches/month, Nov 2026).
  keyword: "노량진 고시원",
  tagline: "노량진 고시원 · 노량진역 15분 · 남성 전용",
  address: "서울 동작구 만양로12가길 64",
  businessNumber: "495-17-00545",
  phone: "02-822-4336",
  phoneHref: "tel:028224336",
  // KakaoTalk is not live yet (Nov 2026): nothing on /ko links to it for now.
  // 1:1 chat with the KakaoTalk channel. Opens the app on phones.
  kakaoChatUrl: `${siteConfig.kakao.replace(/\/$/, "")}/chat`,
  kakaoChannelUrl: siteConfig.kakao,
  naverMapUrl: siteConfig.naverMapUrl,
  // Same Google Maps place embed as the English location page (no API key needed).
  googleMapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.8562384810907!2d126.9483812!3d37.51130870000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357c9f6736793a2b%3A0x7f3263912b31aa4c!2z7Iqk7YOA6rOg7Iuc7JuQc3Rhcmdvc2hpd29u!5e0!3m2!1sko!2s!4v1777449570804!5m2!1sko!2s",
  // Same deposit for every room (set by 현영, Nov 2026).
  depositKrw: 100000,
  minStayMonths: 1,
  maxStayMonths: 12,
};

export const koTransit = [
  { place: "1 · 9호선 노량진역, 학원가", time: "15분" },
  { place: "9호선 노들역", time: "10분" },
  { place: "7호선 상도역", time: "15분" },
];

/** Korean name and one-line feature per room type, keyed by slug. The DB's
 * name_ko is the admin/document name ("기본 방"), which reads oddly to guests. */
const roomCopy: Record<string, { name: string; feature: string; detail: string }> = {
  "economy-room": {
    name: "일반실",
    feature: "샤워실 · 화장실 공용",
    detail:
      "가장 저렴한 방입니다. 샤워실과 화장실은 층마다 있는 공용 시설을 씁니다.",
  },
  "room-with-private-shower": {
    name: "샤워실 포함",
    feature: "방 안 개인 샤워실",
    detail: "방 안에 개인 샤워실이 있습니다. 화장실은 공용입니다.",
  },
  "room-with-private-shower-and-toilet": {
    name: "샤워실 · 화장실 포함",
    feature: "방 안에 샤워실과 화장실",
    detail: "방 안에 샤워실과 화장실이 모두 있어 공용 시설을 쓸 일이 없습니다.",
  },
};

export function koRoomName(room: Pick<RoomWithImages, "slug" | "name" | "name_ko">) {
  return roomCopy[room.slug]?.name ?? room.name_ko ?? room.name;
}

export function koRoomFeature(room: Pick<RoomWithImages, "slug">) {
  return roomCopy[room.slug]?.feature ?? "";
}

export function koRoomDetail(room: Pick<RoomWithImages, "slug">) {
  return roomCopy[room.slug]?.detail ?? "";
}

export const koRoomStatus: Record<RoomStatus, string> = {
  available: "입주 가능",
  limited: "빈 방 적음",
  available_soon: "곧 입주 가능",
  unavailable: "만실",
};

/** 350000 → "35만원", 355000 → "35.5만원", 1200000 → "120만원". */
export function formatManwon(krw: number): string {
  const man = krw / 10000;
  const rounded = Math.round(man * 10) / 10;
  return `${rounded.toLocaleString("ko-KR")}만원`;
}

export function lowestMonthlyKrw(rooms: RoomWithImages[]): number | null {
  const prices = rooms
    .map((r) => r.monthly_rate_krw)
    .filter((p): p is number => typeof p === "number" && p > 0);
  return prices.length ? Math.min(...prices) : null;
}

export function lowestDepositKrw(rooms: RoomWithImages[]): number | null {
  const deposits = rooms
    .map((r) => r.deposit_krw)
    .filter((p): p is number => typeof p === "number" && p >= 0);
  return deposits.length ? Math.min(...deposits) : null;
}

export function sortedImages(room: RoomWithImages) {
  return [...(room.room_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
}

/** The message a guest pastes into the KakaoTalk chat after a booking request. */
export function buildKakaoMessage(input: {
  roomName: string;
  moveInDate: string; // YYYY-MM-DD
  stayMonths: number;
  guestName: string;
  guestPhone: string;
  requestId?: string;
}): string {
  const [, m, d] = input.moveInDate.split("-");
  const lines = [
    "[스타고시원 예약 요청]",
    `방: ${input.roomName}`,
    `입실 희망일: ${Number(m)}월 ${Number(d)}일`,
    `기간: ${input.stayMonths}개월`,
    `이름: ${input.guestName}`,
    `연락처: ${input.guestPhone}`,
  ];
  if (input.requestId) lines.push(`요청 번호: ${input.requestId.slice(0, 8)}`);
  return lines.join("\n");
}

/** Normalises 01012345678 / 010 1234 5678 / 010-1234-5678 to 010-1234-5678.
 * Returns null when it isn't a Korean mobile number. */
export function normalizeKoreanMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const m = digits.match(/^(01[016789])(\d{3,4})(\d{4})$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** Check-out date for a stay of N calendar months from move-in (YYYY-MM-DD). */
export function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

export const koFaqs = [
  {
    q: "보증금은 언제 돌려받나요?",
    a: "퇴실하는 날 방 상태를 확인한 뒤, 문제가 없으면 받은 계좌로 바로 돌려드립니다.",
  },
  {
    q: "결제는 어떻게 하나요?",
    a: "계좌이체로 받습니다. 예약 요청을 남기시면 남겨주신 번호로 입금 계좌와 금액을 안내해 드립니다. 현금영수증 발급이 가능합니다.",
  },
  {
    q: "방을 먼저 볼 수 있나요?",
    a: "네. 전화(02-822-4336)나 예약 요청의 요청 사항에 편한 시간을 남겨주시면 빈 방을 보여드립니다.",
  },
  {
    q: "월 이용료에 무엇이 포함되나요?",
    a: "전기, 수도, 가스, 인터넷이 모두 포함됩니다. 공용 주방에 밥이 준비되어 있습니다.",
  },
  {
    q: "이불이나 베개가 있나요?",
    a: "침구는 제공되지 않습니다. 이불, 베개 등은 직접 챙겨 오세요.",
  },
  {
    q: "입실 · 퇴실 시간이 정해져 있나요?",
    a: `입실은 ${stayTimes.checkInKo}부터, 퇴실은 ${stayTimes.checkOutKo}까지입니다. 시간이 맞지 않으면 미리 말씀해 주세요.`,
  },
  {
    q: "여성도 입실할 수 있나요?",
    a: "죄송하지만 남성 전용 고시원입니다.",
  },
];

/** Public rooms for /ko. Without database credentials outside production it
 * falls back to sample rooms, so the page can be previewed from any checkout. */
export async function getKoRooms(): Promise<RoomWithImages[]> {
  const { getPublicRooms } = await import("./queries");
  if (
    process.env.NODE_ENV !== "production" &&
    (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
  ) {
    const { koSampleRooms } = await import("./ko-sample-rooms");
    return koSampleRooms;
  }
  return getPublicRooms();
}
