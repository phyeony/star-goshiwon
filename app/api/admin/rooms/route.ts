import { NextRequest, NextResponse } from "next/server";
import { roomSchema } from "@/lib/validation";
import { createRoom } from "@/lib/queries";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = roomSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", errors: result.error.issues },
        { status: 400 }
      );
    }

    const room = await createRoom(result.data);
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error("Create room error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
