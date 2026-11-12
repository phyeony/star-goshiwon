import { NextRequest, NextResponse } from "next/server";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { getPhotoBucket } from "@/lib/photo-storage";
import {
  deleteSitePhotoRow,
  getSitePhoto,
  updateSitePhoto,
  type SitePhotoPatch,
} from "@/lib/photo-queries";
import { MAX_CAPTION_LENGTH, UUID_PATTERN } from "@/lib/photo-upload";
import { r2VariantKeys } from "@/lib/site-photos";

interface Context {
  params: Promise<{ id: string }>;
}

const UUID = UUID_PATTERN;

function caption(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, MAX_CAPTION_LENGTH) : "";
}

/** Update a photo's captions and/or room number. Only the fields sent change;
 * room_unit_id: null clears the room number. */
export async function PATCH(req: NextRequest, context: Context) {
  const admin = await getAdminUserOrNull();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await context.params;
  if (!UUID.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as
    | { caption_en?: unknown; caption_ko?: unknown; room_unit_id?: unknown }
    | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const patch: SitePhotoPatch = {};
  if ("caption_en" in body) patch.caption_en = caption(body.caption_en);
  if ("caption_ko" in body) patch.caption_ko = caption(body.caption_ko);
  if ("room_unit_id" in body) {
    const unit = body.room_unit_id;
    if (unit !== null && !(typeof unit === "string" && UUID.test(unit))) {
      return NextResponse.json({ error: "invalid_room_unit" }, { status: 400 });
    }
    patch.room_unit_id = unit;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const photo = await updateSitePhoto(id, patch);
    if (!photo) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(photo);
  } catch (error) {
    if ((error as { code?: string }).code === "23503") {
      return NextResponse.json({ error: "invalid_room_unit" }, { status: 400 });
    }
    console.error("Update photo error:", error);
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
