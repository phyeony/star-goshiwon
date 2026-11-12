import { NextRequest, NextResponse } from "next/server";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { getPhotoBucket } from "@/lib/photo-storage";
import { deleteSitePhotoRow, getSitePhoto, updatePhotoCaptions } from "@/lib/photo-queries";
import { MAX_CAPTION_LENGTH } from "@/lib/photo-upload";
import { r2VariantKeys } from "@/lib/site-photos";

interface Context {
  params: Promise<{ id: string }>;
}

const UUID = /^[0-9a-f-]{36}$/i;

function caption(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, MAX_CAPTION_LENGTH) : "";
}

/** Update a photo's English/Korean captions. */
export async function PATCH(req: NextRequest, context: Context) {
  const admin = await getAdminUserOrNull();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as
    | { caption_en?: unknown; caption_ko?: unknown }
    | null;
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  try {
    const photo = await updatePhotoCaptions(id, {
      caption_en: caption(body.caption_en),
      caption_ko: caption(body.caption_ko),
    });
    if (!photo) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(photo);
  } catch (error) {
    console.error("Update photo captions error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

/** Remove a photo from the library and from every section it is used in.
 * Uploaded files are deleted from R2; photos shipped with the site stay in
 * the code and only leave the library. */
export async function DELETE(_req: NextRequest, context: Context) {
  const admin = await getAdminUserOrNull();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  try {
    const photo = await getSitePhoto(id);
    if (!photo) return NextResponse.json({ error: "not_found" }, { status: 404 });

    await deleteSitePhotoRow(id);

    if (photo.source === "r2" && photo.ext) {
      try {
        const bucket = await getPhotoBucket();
        await bucket.delete(r2VariantKeys(photo.path, photo.ext));
      } catch (error) {
        // The photo is already gone from the site; leftover files are harmless.
        console.error("Photo file delete error:", error);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete photo error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
