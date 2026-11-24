import { NextRequest, NextResponse } from "next/server";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { deletePassportPhoto, readPassportPhoto } from "@/lib/passport/service";

export const runtime = "nodejs";

interface Context {
  params: Promise<{ id: string }>;
}

// The decrypted passport photo, for the admin request page only. Never cached.
export async function GET(_req: NextRequest, ctx: Context) {
  const admin = await getAdminUserOrNull();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const photo = await readPassportPhoto(id, admin.email ?? "admin");
  if (!photo) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return new NextResponse(photo.bytes, {
    headers: {
      "content-type": photo.contentType,
      "cache-control": "no-store, private",
      "x-robots-tag": "noindex",
      "content-disposition": "inline",
    },
  });
}

export async function DELETE(_req: NextRequest, ctx: Context) {
  const admin = await getAdminUserOrNull();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const deleted = await deletePassportPhoto(id, admin.email ?? "admin");
  return NextResponse.json({ ok: true, deleted });
}
