import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assignRoomUnitToBookingRequest } from "@/lib/queries";
import { getAdminUserOrNull } from "@/lib/supabase-server";

const bodySchema = z.object({
  room_unit_id: z.string().uuid(),
});

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: Context) {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const request = await assignRoomUnitToBookingRequest(
      id,
      parsed.data.room_unit_id
    );
    return NextResponse.json(request);
  } catch (error) {
    console.error("Assign room unit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "assign_failed" },
      { status: 400 }
    );
  }
}
