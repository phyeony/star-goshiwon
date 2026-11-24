import { NextRequest, NextResponse } from "next/server";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { markPassportChecked } from "@/lib/passport/service";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUserOrNull();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await markPassportChecked(id, admin.email ?? "admin");
  return NextResponse.json({ ok: true });
}
