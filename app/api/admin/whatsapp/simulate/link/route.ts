import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { setLinkedBooking } from "@/lib/whatsapp/admin-queries";
import { isSimulatedPhone, simulatorEnabled } from "@/lib/whatsapp/simulator";
import { conversationPhone } from "@/lib/whatsapp/store";

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  bookingRequestId: z.string().uuid().nullable(),
});

// Links a test chat to a booking request, as the booking form's WhatsApp
// number would for a real guest. Then approving or declining that request
// in /admin/requests changes what the agent knows about the guest.
export async function POST(req: NextRequest) {
  if (!simulatorEnabled()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!(await getAdminUserOrNull())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const { conversationId, bookingRequestId } = parsed.data;

  const chat = await conversationPhone(conversationId);
  if (!chat || !isSimulatedPhone(chat.waPhone)) {
    return NextResponse.json({ error: "not_a_test_chat" }, { status: 404 });
  }
  await setLinkedBooking(conversationId, bookingRequestId);
  return NextResponse.json({ ok: true });
}
