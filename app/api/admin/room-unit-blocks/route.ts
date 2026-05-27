import { NextRequest, NextResponse } from "next/server";
import {
  createRoomUnitBlock,
  getRoomUnitAvailability,
  getRoomUnitById,
  isRoomUnitAvailableForBooking,
} from "@/lib/queries";
import { roomUnitBlockSchema } from "@/lib/validation";
import { getAdminUserOrNull } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = roomUnitBlockSchema.safeParse(
    await req.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const unit = await getRoomUnitById(parsed.data.room_unit_id);
    if (!unit) {
      return NextResponse.json(
        { error: "선택한 객실 번호를 찾을 수 없습니다." },
        { status: 400 }
      );
    }
    const availability = await getRoomUnitAvailability(
      unit.room_id,
      parsed.data.check_in_date,
      parsed.data.check_out_date
    );
    const selected = availability.find((candidate) => candidate.id === unit.id);
    if (!selected || !isRoomUnitAvailableForBooking(selected)) {
      return NextResponse.json(
        { error: "선택한 객실은 해당 날짜에 이미 예약이 있습니다." },
        { status: 400 }
      );
    }

    const block = await createRoomUnitBlock(parsed.data);
    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    console.error("Create room unit block error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "create_failed" },
      { status: 500 }
    );
  }
}
