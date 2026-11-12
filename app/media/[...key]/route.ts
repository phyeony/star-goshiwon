import { NextRequest } from "next/server";
import { getPhotoBucket, PHOTO_CACHE_CONTROL } from "@/lib/photo-storage";
import { isServablePhotoKey } from "@/lib/site-photos";

// Serves uploaded website photos from R2. Each file name is unique and never
// changes, so responses are cached for a year at Cloudflare's edge (Cache API)
// and in the browser.

interface Context {
  params: Promise<{ key: string[] }>;
}

type EdgeCache = {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
};

function edgeCache(): EdgeCache | null {
  const store = (globalThis as { caches?: { default?: EdgeCache } }).caches;
  return store?.default ?? null;
}

export async function GET(req: NextRequest, context: Context) {
  const { key: parts } = await context.params;
  const key = parts.join("/");
  if (!isServablePhotoKey(key)) {
    return new Response("Not found", { status: 404 });
  }

  const cache = edgeCache();
  const cacheKey = new Request(req.url, { method: "GET" });
  const cached = await cache?.match(cacheKey);
  if (cached) return cached;

  const bucket = await getPhotoBucket();
  const object = await bucket.get(key);
  if (!object) {
    return new Response("Not found", {
      status: 404,
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }

  const response = new Response(object.body, {
    headers: {
      "Content-Type":
        object.httpMetadata?.contentType ??
        (key.endsWith(".jpg") ? "image/jpeg" : "image/webp"),
      "Content-Length": String(object.size),
      "Cache-Control": PHOTO_CACHE_CONTROL,
      ETag: object.httpEtag,
    },
  });

  if (cache) {
    try {
      await cache.put(cacheKey, response.clone());
    } catch (error) {
      console.error("media cache put failed:", error);
    }
  }
  return response;
}
