import { DEFAULT_PHOTOS_BASE, photoSrc, type SitePhoto } from "./site-photos";

type DownloadablePhoto = Pick<SitePhoto, "source" | "path" | "ext" | "original_filename" | "caption_ko" | "caption_en">;

/**
 * Same-origin URL of the largest stored version of a photo. Uploads always go
 * through /media (not the public R2 domain) so the browser can read the bytes
 * without CORS. Static photos are the original files under /public.
 */
export function photoDownloadUrl(photo: Pick<SitePhoto, "source" | "path" | "ext">): string {
  return photoSrc(photo, DEFAULT_PHOTOS_BASE);
}

function extensionOf(photo: Pick<SitePhoto, "source" | "path" | "ext">): string {
  if (photo.source === "r2") return photo.ext ?? "jpg";
  const match = /\.([a-z0-9]+)$/i.exec(photo.path);
  return match ? match[1].toLowerCase() : "jpg";
}

function clean(text: string): string {
  return text
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/** A readable file name: "<room number>호 <caption or original name>.<ext>". */
export function photoDownloadName(photo: DownloadablePhoto, roomNumber?: string | null): string {
  const original = photo.original_filename?.replace(/\.[^.]+$/, "") ?? "";
  const fromPath = photo.path.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";
  const label = clean(photo.caption_ko || photo.caption_en || original || fromPath) || "photo";
  const prefix = roomNumber ? `${clean(roomNumber)}호 ` : "";
  return `${prefix}${label}.${extensionOf(photo)}`;
}

/** Makes names unique by adding " (2)", " (3)"… before the extension. */
export function uniqueNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const key = name.toLowerCase();
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count === 1) return name;
    const dot = name.lastIndexOf(".");
    const candidate = dot > 0 ? `${name.slice(0, dot)} (${count})${name.slice(dot)}` : `${name} (${count})`;
    seen.set(candidate.toLowerCase(), 1);
    return candidate;
  });
}
