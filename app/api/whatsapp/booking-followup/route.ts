import { NextRequest, NextResponse } from "next/server";
import { getBookingRequestById } from "@/lib/queries";
import { ENDED_STATUSES } from "@/lib/passport/retention";
import { sendBookingReceived } from "@/lib/whatsapp/booking-received";
import { bookingReceivedDeps, isInternalCall } from "@/lib/whatsapp/runtime";

// Called by the queue consumer in worker.ts 30 minutes after a booking
// request (never by the public). Sends the booking-received template unless
// the guest has written to us meanwhile (lib/whatsapp/booking-received.ts).
export async function POST(req: NextRequest) {
  if (!isInternalCall(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { bookingId } = (await req.json().catch(() => ({}))) as { bookingId?: string };
  if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

  const deps = bookingReceivedDeps();
  if (!deps) return NextResponse.json({ status: "not_configured" });
  const request = await getBookingRequestById(bookingId);
  if (!request) return NextResponse.json({ status: "not_found" });
  if (!request.whatsapp_opt_in || !request.whatsapp_number) return NextResponse.json({ status: "no_opt_in" });
  if (ENDED_STATUSES.includes(request.status)) return NextResponse.json({ status: "request_ended" });

  const plan = await sendBookingReceived(deps, {
    bookingId: request.id,
    guestName: request.guest_name,
    roomName: request.rooms?.name ?? "your room",
    checkIn: request.check_in_date,
    checkOut: request.check_out_date,
    whatsappNumber: request.whatsapp_number,
  });
  return NextResponse.json(plan.send ? { status: "sent", variant: plan.variant } : { status: "skipped", reason: plan.reason });
}
