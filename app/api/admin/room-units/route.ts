import { NextRequest, NextResponse } from "next/server";
import { createRoomUnit, isRoomUnitNameTaken } from "@/lib/queries";
import { roomUnitSchema } from "@/lib/validation";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { duplicateNameResponse, isUniqueViolation } from "./duplicate-name";

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = roomUnitSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    if (await isRoomUnitNameTaken(parsed.data.name)) {
      return duplicateNameResponse(parsed.data.name);
    }
    const unit = await createRoomUnit(parsed.data);
    return NextResponse.json(unit, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return duplicateNameResponse(parsed.data.name);
    }
    console.error("Create room unit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "create_failed" },
      { status: 500 }
    );
  }
}
