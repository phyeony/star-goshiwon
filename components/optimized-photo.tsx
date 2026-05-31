import {
  getOptimizedImageSrc,
  getOptimizedImageSrcSet,
} from "@/lib/optimized-images";

interface OptimizedPhotoProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
}

export function OptimizedPhoto({
  src,
  alt,
  sizes,
  className,
  loading = "lazy",
  fetchPriority = "auto",
}: OptimizedPhotoProps) {
  return (
    <img
      src={getOptimizedImageSrc(src, 960)}
      srcSet={getOptimizedImageSrcSet(src)}
      sizes={sizes}
      alt={alt}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      className={className}
    />
  );
}
