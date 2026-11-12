// Shared (client-safe) types and helpers for the website photo library.
// Server-only database access lives in photo-queries.ts, R2 access in
// photo-storage.ts.

import { OPTIMIZED_IMAGE_WIDTHS } from "./optimized-images";

export type PhotoSource = "static" | "r2";
export type PhotoExt = "webp" | "jpg";
export type PhotoSectionKind = "room" | "shared";

export interface SitePhoto {
  id: string;
  source: PhotoSource;
  /** static: "/images/…" under /public. r2: object key prefix "photos/<uuid>". */
  path: string;
  ext: PhotoExt | null;
  width: number | null;
  height: number | null;
  caption_en: string;
  caption_ko: string;
  original_filename: string | null;
  /** Room number (room_units row) the photo was taken in, if tagged. */
  room_unit_id: string | null;
  created_at: string;
}

export interface SitePhotoPlacement {
  id: string;
  section: PhotoSectionKind;
  room_id: string | null;
  photo_id: string;
  sort_order: number;
}

/** A photo as the public pages need it. */
export interface DisplayPhoto {
  id: string;
  /** Pass to <OptimizedPhoto src>; it derives the resized versions. */
  src: string;
  caption_en: string;
  caption_ko: string;
}

/** Widths every upload is stored at (the same ones static photos use). */
export const PHOTO_WIDTHS = OPTIMIZED_IMAGE_WIDTHS;
export const LARGEST_PHOTO_WIDTH = PHOTO_WIDTHS[PHOTO_WIDTHS.length - 1];

/** Where uploaded photos are served from when PHOTOS_PUBLIC_URL is unset. */
export const DEFAULT_PHOTOS_BASE = "/media";

const R2_KEY_PATTERN = /^photos\/[0-9a-f-]{36}-\d{3,4}\.(webp|jpg)$/;

export function r2PhotoPrefix(id: string): string {
  return `photos/${id}`;
}

export function r2VariantKey(prefix: string, width: number, ext: PhotoExt): string {
  return `${prefix}-${width}.${ext}`;
}

export function r2VariantKeys(prefix: string, ext: PhotoExt): string[] {
  return PHOTO_WIDTHS.map((w) => r2VariantKey(prefix, w, ext));
}

/** True for an object key the public /media route is allowed to serve. */
export function isServablePhotoKey(key: string): boolean {
  return R2_KEY_PATTERN.test(key);
}

/** The URL used as a photo's `src` (and in Open Graph / JSON-LD). */
export function photoSrc(
  photo: Pick<SitePhoto, "source" | "path" | "ext">,
  base: string = DEFAULT_PHOTOS_BASE
): string {
  if (photo.source === "static") return photo.path;
  const root = base.replace(/\/+$/, "");
  return `${root}/${r2VariantKey(photo.path, LARGEST_PHOTO_WIDTH, photo.ext ?? "webp")}`;
}

/** Size of one resized version: never wider than the original. */
export function resizedDimensions(
  naturalWidth: number,
  naturalHeight: number,
  targetWidth: number
): { width: number; height: number } {
  const width = Math.min(targetWidth, naturalWidth);
  const height = Math.max(1, Math.round((naturalHeight * width) / naturalWidth));
  return { width, height };
}

export const ROOM_SECTION_PREFIX = "room:";
export const SHARED_SECTION_KEY = "shared";

/** UI/API key for a section: "shared" or "room:<room id>". */
export function sectionKey(section: PhotoSectionKind, roomId: string | null): string {
  return section === "shared" ? SHARED_SECTION_KEY : `${ROOM_SECTION_PREFIX}${roomId}`;
}

export function parseSectionKey(
  key: string
): { section: PhotoSectionKind; roomId: string | null } | null {
  if (key === SHARED_SECTION_KEY) return { section: "shared", roomId: null };
  if (key.startsWith(ROOM_SECTION_PREFIX)) {
    const roomId = key.slice(ROOM_SECTION_PREFIX.length);
    if (/^[0-9a-f-]{36}$/i.test(roomId)) return { section: "room", roomId };
  }
  return null;
}

/** Shared spaces as they were before the library existed. Used when the
 * database is not reachable (local preview without credentials). */
export const FALLBACK_SHARED_PHOTOS: DisplayPhoto[] = [
  { id: "kitchen", src: "/images/guides/shared-kitchen/kitchen.jpg", caption_en: "Shared Kitchen", caption_ko: "공용 주방" },
  { id: "balcony", src: "/images/common/balcony.jpg", caption_en: "Balcony", caption_ko: "발코니" },
  { id: "laundry", src: "/images/common/laundry.png", caption_en: "Laundry", caption_ko: "세탁실" },
  { id: "microwave", src: "/images/common/microwave.jpg", caption_en: "Microwave", caption_ko: "전자레인지" },
  { id: "rice-cooker", src: "/images/common/rice-cooker.jpg", caption_en: "Rice Cooker", caption_ko: "밥솥 (밥 제공)" },
  { id: "water", src: "/images/common/filtered-water-dispenser.jpg", caption_en: "Filtered Water Dispenser", caption_ko: "정수기" },
];
