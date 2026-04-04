import { NextRequest, NextResponse } from "next/server";
import { roomSchema } from "@/lib/validation";
import { updateRoom, deleteRoom } from "@/lib/queries";

interface Context {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const result = roomSchema.partial().safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", errors: result.error.issues },
        { status: 400 }
      );
    }

    const room = await updateRoom(id, result.data);
    return NextResponse.json(room);
  } catch (error) {
    console.error("Update room error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    await deleteRoom(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete room error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
