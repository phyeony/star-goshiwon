// Encrypted passport photos live in a private R2 bucket bound as PASSPORTS
// (wrangler.jsonc). It has no public domain and no /media route; the only way
// to read an image is the admin route, which decrypts it. In `next dev` the
// binding is a local simulated bucket.

import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface PassportBucket {
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>;
  delete(keys: string | string[]): Promise<void>;
}

export async function getPassportBucket(): Promise<PassportBucket> {
  const { env } = await getCloudflareContext({ async: true });
  const bucket = (env as unknown as { PASSPORTS?: PassportBucket }).PASSPORTS;
  if (!bucket) {
    throw new Error("PASSPORTS R2 bucket binding is not configured (wrangler.jsonc r2_buckets)");
  }
  return bucket;
}
