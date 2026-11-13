// Browser-only: shrink a picked photo into the widths the site serves, before
// upload. Phone photos (often 4000px+, several MB) become five small files,
// so uploads are quick and pages stay fast.

import { PHOTO_WIDTHS, resizedDimensions, type PhotoExt } from "./site-photos";

export interface ResizedPhoto {
  ext: PhotoExt;
  width: number;
  height: number;
  variants: { width: number; blob: Blob }[];
}

export class PhotoDecodeError extends Error {}

const WEBP_QUALITY = 0.8;
const JPEG_QUALITY = 0.85;

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    // Browsers apply the photo's EXIF rotation when decoding into an <img>.
    await img.decode();
    if (!img.naturalWidth || !img.naturalHeight) throw new Error("empty image");
    return img;
  } catch {
    throw new PhotoDecodeError(file.name);
  } finally {
    // The decoded bitmap stays usable for drawImage after the URL is revoked.
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function resizeForUpload(file: File): Promise<ResizedPhoto> {
  const img = await loadImage(file);
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;

  // Safari can't encode WebP and silently returns PNG instead. That shows on
  // the first version, and from then on every version is JPEG.
  let ext: PhotoExt = "webp";
  const variants: ResizedPhoto["variants"] = [];

  // Largest first, each drawn from the previous one: stepping down gives
  // sharper small versions than one big jump from a 4000px phone photo.
  let source: CanvasImageSource = img;
  for (const target of [...PHOTO_WIDTHS].reverse()) {
    const { width, height } = resizedDimensions(naturalWidth, naturalHeight, target);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new PhotoDecodeError(file.name);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, width, height);
    source = canvas;

    let blob = ext === "webp" ? await toBlob(canvas, "image/webp", WEBP_QUALITY) : null;
    if (ext === "webp" && blob?.type !== "image/webp") {
      if (variants.length > 0) throw new PhotoDecodeError(file.name);
      ext = "jpg";
      blob = null;
    }
    if (!blob) blob = await toBlob(canvas, "image/jpeg", JPEG_QUALITY);
    if (!blob) throw new PhotoDecodeError(file.name);
    variants.push({ width: target, blob });
  }

  variants.sort((a, b) => a.width - b.width);
  return { ext, width: naturalWidth, height: naturalHeight, variants };
}

/** Builds the form the upload API expects. */
export function buildUploadForm(
  file: File,
  resized: ResizedPhoto,
  captions: { caption_en: string; caption_ko: string },
  roomUnitId: string | null = null
): FormData {
  const form = new FormData();
  form.set("ext", resized.ext);
  form.set("width", String(resized.width));
  form.set("height", String(resized.height));
  form.set("caption_en", captions.caption_en);
  form.set("caption_ko", captions.caption_ko);
  form.set("original_filename", file.name);
  if (roomUnitId) form.set("room_unit_id", roomUnitId);
  for (const v of resized.variants) {
    form.set(`w${v.width}`, v.blob, `${v.width}.${resized.ext}`);
  }
  return form;
}
