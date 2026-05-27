import { NextRequest, NextResponse } from "next/server";
import {
  getBookingRequestById,
  getRoomUnitAvailability,
  getRoomUnitBlockById,
  getRoomUnitById,
  updateBookingRequest,
  updateRoomUnitBlock,
} from "@/lib/queries";
import { roomUnitBlockUpdateSchema } from "@/lib/validation";
import { getAdminUserOrNull } from "@/lib/supabase-server";

interface Context {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, context: Context) {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = roomUnitBlockUpdateSchema.safeParse(
    await req.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const { id } = await context.params;
    const existing = await getRoomUnitBlockById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "예약 차단 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const next = {
      ...existing,
      ...parsed.data,
    };
    if (next.check_out_date <= next.check_in_date) {
      return NextResponse.json(
        { error: "퇴실일은 입실일 이후여야 합니다." },
        { status: 400 }
      );
    }

    if (
      next.status !== "cancelled" &&
      (parsed.data.check_in_date ||
        parsed.data.check_out_date ||
        parsed.data.room_unit_id)
    ) {
      const unit = await getRoomUnitById(next.room_unit_id);
      if (!unit) {
        return NextResponse.json(
          { error: "선택한 객실 번호를 찾을 수 없습니다." },
          { status: 400 }
        );
      }
      if (next.source === "direct" && next.booking_request_id) {
        const request = await getBookingRequestById(next.booking_request_id);
        if (!request) {
          return NextResponse.json(
            { error: "예약 요청을 찾을 수 없습니다." },
            { status: 400 }
          );
        }
        if (request.room_id && unit.room_id !== request.room_id) {
          return NextResponse.json(
            { error: "선택한 객실 번호가 예약 요청의 객실 타입과 다릅니다." },
            { status: 400 }
          );
        }
      }
      const availability = await getRoomUnitAvailability(
        unit.room_id,
        next.check_in_date,
        next.check_out_date
      );
      const selected = availability.find(
        (candidate) => candidate.id === next.room_unit_id
      );
      const hasConflict =
        !selected ||
        selected.room_unit_blocks.some(
          (block) =>
            block.id !== id &&
            (!next.booking_request_id ||
              block.booking_request_id !== next.booking_request_id)
        );
      if (hasConflict) {
        return NextResponse.json(
          { error: "선택한 객실은 해당 날짜에 이미 예약이 있습니다." },
          { status: 400 }
        );
      }
    }

    const block = await updateRoomUnitBlock(id, parsed.data);
    if (
      block.source === "direct" &&
      block.booking_request_id &&
      parsed.data.room_unit_id
    ) {
      await updateBookingRequest(block.booking_request_id, {
        assigned_room_unit_id: parsed.data.room_unit_id,
      });
    }
    return NextResponse.json(block);
  } catch (error) {
    console.error("Update room unit block error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "update_failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: Context) {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const block = await updateRoomUnitBlock(id, { status: "cancelled" });
    return NextResponse.json(block);
  } catch (error) {
    console.error("Cancel room unit block error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "delete_failed" },
      { status: 500 }
    );
  }
}
