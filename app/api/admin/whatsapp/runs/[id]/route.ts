import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { noteRun, rateRun } from "@/lib/whatsapp/admin-queries";

// Either a ✓/✗ rating, or the manager's note (what was wrong, what it
// should have said), or both.
const bodySchema = z
  .object({
    rating: z.enum(["good", "bad"]).nullable().optional(),
    note: z.string().max(2000).optional(),
    betterReply: z.string().max(2000).optional(),
  })
  .refine((b) => b.rating !== undefined || b.note !== undefined || b.betterReply !== undefined);

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUserOrNull())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const { id } = await ctx.params;
  const { rating, note, betterReply } = parsed.data;
  if (rating !== undefined) await rateRun(id, rating);
  if (note !== undefined || betterReply !== undefined) await noteRun(id, note ?? "", betterReply ?? "");
  return NextResponse.json({ ok: true });
}
