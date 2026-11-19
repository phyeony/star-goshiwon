import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { updateAdminSettings } from "@/lib/whatsapp/admin-queries";
import { SWITCHABLE } from "@/lib/whatsapp/admin-labels";

const bodySchema = z.object({
  mode: z.enum(["off", "live"]).optional(),
  autoSend: z.record(z.enum(SWITCHABLE as [string, ...string[]]), z.boolean()).optional(),
});

export async function PATCH(req: NextRequest) {
  if (!(await getAdminUserOrNull())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  await updateAdminSettings(parsed.data as Parameters<typeof updateAdminSettings>[0]);
  return NextResponse.json({ ok: true });
}
