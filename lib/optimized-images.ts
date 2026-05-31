export const OPTIMIZED_IMAGE_WIDTHS = [384, 640, 960, 1280, 1600] as const;

const OPTIMIZED_PREFIX = "/images/optimized";

export function getOptimizedImageSrc(src: string, width: number) {
  const path = src.split("?")[0];
  const match = path.match(/^\/images\/(.+)\.[^.\/]+$/);

  if (!match) return src;

  return `${OPTIMIZED_PREFIX}/${match[1]}-${width}.webp`;
}

export function getOptimizedImageSrcSet(src: string) {
  return OPTIMIZED_IMAGE_WIDTHS.map(
    (width) => `${getOptimizedImageSrc(src, width)} ${width}w`
  ).join(", ");
}
