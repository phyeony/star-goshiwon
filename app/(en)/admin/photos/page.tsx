import { getRooms } from "@/lib/queries";
import { listPhotoPlacements, listSitePhotos } from "@/lib/photo-queries";
import { getPhotosBaseUrl } from "@/lib/photo-storage";
import { photoSrc, sectionKey } from "@/lib/site-photos";
import { PhotoManager } from "@/components/admin/photo-manager";
import type { AdminSection } from "@/components/admin/photo-types";

export const dynamic = "force-dynamic";

export default async function AdminPhotosPage() {
  const [photos, placements, rooms] = await Promise.all([
    listSitePhotos(),
    listPhotoPlacements(),
    getRooms(),
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
      photoIds: idsFor("room", room.id),
    })),
    {
      key: sectionKey("shared", null),
      title: "공용 공간",
      kind: "shared",
      photoIds: idsFor("shared", null),
    },
  ];

  return (
    <PhotoManager
      initialPhotos={photos.map((photo) => ({ ...photo, src: photoSrc(photo, base) }))}
      initialSections={sections}
      photosBase={base}
    />
  );
}
