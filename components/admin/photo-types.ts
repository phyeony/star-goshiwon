import { getOptimizedImageSrc } from "@/lib/optimized-images";
import type { PhotoSectionKind, SitePhoto } from "@/lib/site-photos";

export type AdminPhoto = SitePhoto & { src: string };

export interface AdminSection {
  key: string;
  title: string;
  kind: PhotoSectionKind;
  photoIds: string[];
}

export function thumbSrc(photo: AdminPhoto, width = 384): string {
  return getOptimizedImageSrc(photo.src, width);
}
