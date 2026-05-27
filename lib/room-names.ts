import type { Room } from "@/lib/types";

type RoomNameSource = Pick<Room, "name" | "slug" | "name_ko">;

const ROOM_NAME_KO_BY_SLUG: Record<string, string> = {
  "economy-room": "기본 방",
  "room-with-private-shower": "원룸(샤워)",
  "room-with-private-shower-and-toilet": "원룸(샤워&화장실)",
};

const ROOM_NAME_KO_BY_NAME: Record<string, string> = {
  "Economy Room": "기본 방",
  "Private Shower Room": "원룸(샤워)",
  "Shower Room": "원룸(샤워)",
  "Private Shower & Toilet Room": "원룸(샤워&화장실)",
  "Shower & toilet room": "원룸(샤워&화장실)",
  "Shower & Toilet Room": "원룸(샤워&화장실)",
};

export function roomNameKo(room: RoomNameSource | null | undefined) {
  if (!room) return "객실 타입";
  return (
    room.name_ko ||
    ROOM_NAME_KO_BY_SLUG[room.slug] ||
    ROOM_NAME_KO_BY_NAME[room.name] ||
    room.name
  );
}
