// Uploaded website photos live in a Cloudflare R2 bucket bound to the worker
// as PHOTOS (see wrangler.jsonc). In `next dev`, the binding is a local
// simulated bucket, so uploads work without touching Cloudflare.

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { DEFAULT_PHOTOS_BASE } from "./site-photos";

/** The subset of the R2 bucket API this app uses. */
export interface PhotoBucket {
  put(
    key: string,
    value: ArrayBuffer | ReadableStream | Blob,
    options?: { httpMetadata?: { contentType?: string; cacheControl?: string } }
  ): Promise<unknown>;
  get(key: string): Promise<{
    body: ReadableStream;
    httpEtag: string;
    size: number;
    httpMetadata?: { contentType?: string };
  } | null>;
  delete(keys: string | string[]): Promise<void>;
}

export const PHOTO_CACHE_CONTROL = "public, max-age=31536000, immutable";

export async function getPhotoBucket(): Promise<PhotoBucket> {
  const { env } = await getCloudflareContext({ async: true });
  const bucket = (env as unknown as { PHOTOS?: PhotoBucket }).PHOTOS;
  if (!bucket) {
    throw new Error("PHOTOS R2 bucket binding is not configured (wrangler.jsonc r2_buckets)");
  }
  return bucket;
}

/** Base URL uploaded photos are served from: a custom domain on the bucket
 * (PHOTOS_PUBLIC_URL, e.g. https://photos.goshiwonseoul.com) when set,
 * otherwise this site's own /media route. */
export function getPhotosBaseUrl(): string {
  const configured = process.env.PHOTOS_PUBLIC_URL?.trim();
  return configured ? configured.replace(/\/+$/, "") : DEFAULT_PHOTOS_BASE;
}
