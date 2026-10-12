import { NextRequest, NextResponse } from "next/server";
import { isRoomUnitNameTaken, updateRoomUnit } from "@/lib/queries";
import { roomUnitSchema } from "@/lib/validation";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { duplicateNameResponse, isUniqueViolation } from "../duplicate-name";

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
    if (parsed.data.name && (await isRoomUnitNameTaken(parsed.data.name, id))) {
      return duplicateNameResponse(parsed.data.name);
    }
    const unit = await updateRoomUnit(id, parsed.data);
    return NextResponse.json(unit);
  } catch (error) {
    if (isUniqueViolation(error) && parsed.data.name) {
      return duplicateNameResponse(parsed.data.name);
    }
    console.error("Update room unit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "update_failed" },
      { status: 500 }
    );
  }
}
