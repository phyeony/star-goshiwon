import { NextRequest, NextResponse } from "next/server";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { setPhotoSection } from "@/lib/photo-queries";
import { parseSectionKey } from "@/lib/site-photos";

const UUID = /^[0-9a-f-]{36}$/i;
const MAX_PHOTOS_PER_SECTION = 60;

/** Save which photos a section shows, in order.
 * Body: { section: "shared" | "room:<room id>", photoIds: string[] } */
export async function PUT(req: NextRequest) {
  const admin = await getAdminUserOrNull();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | { section?: unknown; photoIds?: unknown }
    | null;
  const target = typeof body?.section === "string" ? parseSectionKey(body.section) : null;
  if (!target) return NextResponse.json({ error: "invalid_section" }, { status: 400 });

  const ids = body?.photoIds;
  if (
    !Array.isArray(ids) ||
    ids.length > MAX_PHOTOS_PER_SECTION ||
    !ids.every((id): id is string => typeof id === "string" && UUID.test(id)) ||
    new Set(ids).size !== ids.length
  ) {
    return NextResponse.json({ error: "invalid_photos" }, { status: 400 });
  }

  try {
    await setPhotoSection(target.section, target.roomId, ids);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Save photo section error:", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }
}
