export const OPTIMIZED_IMAGE_WIDTHS = [384, 640, 960, 1280, 1600] as const;

const OPTIMIZED_PREFIX = "/images/optimized";

// Uploaded photos (R2) are named "…/photos/<uuid>-<width>.<ext>". Kept inline
// here (not imported from site-photos.ts) to avoid a circular import.
const UPLOADED_PHOTO_PATTERN = /^(.*\/photos\/[0-9a-f-]{36})-\d{3,4}\.(webp|jpg)$/;

export function getOptimizedImageSrc(src: string, width: number) {
  const path = src.split("?")[0];

  const uploaded = path.match(UPLOADED_PHOTO_PATTERN);
  if (uploaded) return `${uploaded[1]}-${width}.${uploaded[2]}`;

  const match = path.match(/^\/images\/(.+)\.[^.\/]+$/);

  if (!match) return src;

  return `${OPTIMIZED_PREFIX}/${match[1]}-${width}.webp`;
}

export function getOptimizedImageSrcSet(src: string) {
  return OPTIMIZED_IMAGE_WIDTHS.map(
    (width) => `${getOptimizedImageSrc(src, width)} ${width}w`
  ).join(", ");
}
