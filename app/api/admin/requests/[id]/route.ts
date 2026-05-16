import { NextRequest, NextResponse } from "next/server";
import { updateBookingRequest } from "@/lib/queries";
import type { BookingStatus } from "@/lib/types";

const validStatuses: BookingStatus[] = [
  "new",
  "reviewing",
  "contacted",
  "approved",
  "confirmed",
  "declined",
  "expired",
  "closed",
];

interface Context {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const updates: { status?: BookingStatus; admin_notes?: string } = {};

    if (body.status) {
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (typeof body.admin_notes === "string") {
      updates.admin_notes = body.admin_notes;
    }

    const updated = await updateBookingRequest(id, updates);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
