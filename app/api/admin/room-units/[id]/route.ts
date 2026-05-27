import { NextRequest, NextResponse } from "next/server";
import { updateRoomUnit } from "@/lib/queries";
import { roomUnitSchema } from "@/lib/validation";
import { getAdminUserOrNull } from "@/lib/supabase-server";

interface Context {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, context: Context) {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = roomUnitSchema
    .partial()
    .safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const { id } = await context.params;
    const unit = await updateRoomUnit(id, parsed.data);
    return NextResponse.json(unit);
  } catch (error) {
    console.error("Update room unit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "update_failed" },
      { status: 500 }
    );
  }
}
