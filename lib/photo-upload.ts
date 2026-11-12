// Validation for photo uploads from admin → 사진 관리. The browser resizes each
// photo into PHOTO_WIDTHS versions and sends them as form fields "w384",
// "w640", … together with the original size and captions.

import { PHOTO_WIDTHS, type PhotoExt } from "./site-photos";

export const MAX_VARIANT_BYTES = 8 * 1024 * 1024;
export const MAX_CAPTION_LENGTH = 200;

export interface ParsedPhotoUpload {
  ext: PhotoExt;
  width: number;
  height: number;
  caption_en: string;
  caption_ko: string;
  original_filename: string | null;
  variants: { width: number; bytes: ArrayBuffer }[];
}

export type ParseResult =
  | { ok: true; value: ParsedPhotoUpload }
  | { ok: false; error: string };

export function contentTypeFor(ext: PhotoExt): string {
  return ext === "jpg" ? "image/jpeg" : "image/webp";
}

/** Checks the file really is the format it claims (by its first bytes). */
export function hasImageSignature(bytes: Uint8Array, ext: PhotoExt): boolean {
  if (ext === "jpg") {
    return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  return bytes.length > 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
}

export function cleanCaption(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim().slice(0, MAX_CAPTION_LENGTH) : "";
}

function positiveInt(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^\d{1,5}$/.test(value)) return null;
  const n = Number(value);
  return n > 0 ? n : null;
}

export async function parsePhotoUpload(form: FormData): Promise<ParseResult> {
  const ext = form.get("ext");
  if (ext !== "webp" && ext !== "jpg") return { ok: false, error: "invalid_format" };

  const width = positiveInt(form.get("width"));
  const height = positiveInt(form.get("height"));
  if (!width || !height) return { ok: false, error: "invalid_size" };

  const variants: ParsedPhotoUpload["variants"] = [];
  for (const w of PHOTO_WIDTHS) {
    const file = form.get(`w${w}`);
    if (!(file instanceof Blob) || file.size === 0) {
      return { ok: false, error: `missing_variant_${w}` };
    }
    if (file.size > MAX_VARIANT_BYTES) return { ok: false, error: "file_too_large" };
    const bytes = await file.arrayBuffer();
    if (!hasImageSignature(new Uint8Array(bytes, 0, Math.min(16, bytes.byteLength)), ext)) {
      return { ok: false, error: "invalid_image" };
    }
    variants.push({ width: w, bytes });
  }

  const filename = form.get("original_filename");
  return {
    ok: true,
    value: {
      ext,
      width,
      height,
      caption_en: cleanCaption(form.get("caption_en")),
      caption_ko: cleanCaption(form.get("caption_ko")),
      original_filename:
        typeof filename === "string" && filename.trim() ? filename.trim().slice(0, 200) : null,
      variants,
    },
  };
}
