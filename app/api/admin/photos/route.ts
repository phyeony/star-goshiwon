import { NextRequest, NextResponse } from "next/server";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { getPhotoBucket, PHOTO_CACHE_CONTROL } from "@/lib/photo-storage";
import { insertUploadedPhoto } from "@/lib/photo-queries";
import { contentTypeFor, parsePhotoUpload } from "@/lib/photo-upload";
import { r2PhotoPrefix, r2VariantKey, r2VariantKeys } from "@/lib/site-photos";

/** Upload one photo (already resized in the browser) to the library. */
export async function POST(req: NextRequest) {
  const admin = await getAdminUserOrNull();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const parsed = await parsePhotoUpload(form);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const upload = parsed.value;

  const id = crypto.randomUUID();
  const prefix = r2PhotoPrefix(id);
  const bucket = await getPhotoBucket();

  try {
    await Promise.all(
      upload.variants.map((variant) =>
        bucket.put(r2VariantKey(prefix, variant.width, upload.ext), variant.bytes, {
          httpMetadata: {
            contentType: contentTypeFor(upload.ext),
            cacheControl: PHOTO_CACHE_CONTROL,
          },
        })
      )
    );

    const photo = await insertUploadedPhoto({
      id,
      path: prefix,
      ext: upload.ext,
      width: upload.width,
      height: upload.height,
      caption_en: upload.caption_en,
      caption_ko: upload.caption_ko,
      original_filename: upload.original_filename,
    });
    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Photo upload error:", error);
    // Don't leave files behind for a photo that isn't in the library.
    await bucket.delete(r2VariantKeys(prefix, upload.ext)).catch(() => {});
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
