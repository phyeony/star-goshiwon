import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { rateRun } from "@/lib/whatsapp/admin-queries";

const bodySchema = z.object({ rating: z.enum(["good", "bad"]).nullable() });

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUserOrNull())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const { id } = await ctx.params;
  await rateRun(id, parsed.data.rating);
  return NextResponse.json({ ok: true });
}
