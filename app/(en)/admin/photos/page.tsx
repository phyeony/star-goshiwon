import { getRooms, getRoomUnitsWithRoom } from "@/lib/queries";
import { listPhotoPlacements, listSitePhotos } from "@/lib/photo-queries";
import { getPhotosBaseUrl } from "@/lib/photo-storage";
import { photoSrc, sectionKey } from "@/lib/site-photos";
import { PhotoManager } from "@/components/admin/photo-manager";
import type { AdminRoomUnit, AdminSection } from "@/components/admin/photo-types";

export const dynamic = "force-dynamic";

export default async function AdminPhotosPage() {
  const [photos, placements, rooms, units] = await Promise.all([
    listSitePhotos(),
    listPhotoPlacements(),
    getRooms(),
    getRoomUnitsWithRoom(),
  ]);
  const base = getPhotosBaseUrl();

  const idsFor = (section: "room" | "shared", roomId: string | null) =>
    placements
      .filter((p) => p.section === section && p.room_id === roomId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => p.photo_id);

  const sections: AdminSection[] = [
    ...rooms.map((room) => ({
      key: sectionKey("room", room.id),
      title: room.name_ko || room.name,
      kind: "room" as const,
      roomId: room.id,
      photoIds: idsFor("room", room.id),
    })),
    {
      key: sectionKey("shared", null),
      title: "공용 공간",
      kind: "shared",
      roomId: null,
      photoIds: idsFor("shared", null),
    },
  ];

  // Room numbers grouped in room-type order, then by number.
  const roomOrder = new Map(rooms.map((room, i) => [room.id, i]));
  const roomUnits: AdminRoomUnit[] = units
    .filter((unit) => roomOrder.has(unit.room_id))
    .sort(
      (a, b) =>
        roomOrder.get(a.room_id)! - roomOrder.get(b.room_id)! ||
        a.name.localeCompare(b.name, "ko", { numeric: true })
    )
    .map((unit) => ({
      id: unit.id,
      name: unit.name,
      roomId: unit.room_id,
      roomTitle: unit.rooms?.name_ko || unit.rooms?.name || "",
    }));

  return (
    <PhotoManager
      roomUnits={roomUnits}
      initialPhotos={photos.map((photo) => ({ ...photo, src: photoSrc(photo, base) }))}
      initialSections={sections}
      photosBase={base}
    />
  );
}
