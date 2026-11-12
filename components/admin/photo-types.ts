import { getOptimizedImageSrc } from "@/lib/optimized-images";
import type { PhotoSectionKind, SitePhoto } from "@/lib/site-photos";

export type AdminPhoto = SitePhoto & { src: string };

export interface AdminSection {
  key: string;
  title: string;
  kind: PhotoSectionKind;
  /** The room type, for room galleries. */
  roomId: string | null;
  photoIds: string[];
}

/** A room number (room_units row) photos can be tagged with. */
export interface AdminRoomUnit {
  id: string;
  name: string;
  roomId: string;
  roomTitle: string;
}

export function thumbSrc(photo: AdminPhoto, width = 384): string {
  return getOptimizedImageSrc(photo.src, width);
}
