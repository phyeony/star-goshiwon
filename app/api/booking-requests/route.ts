import { NextRequest, NextResponse } from "next/server";
import { bookingRequestSchema } from "@/lib/validation";
import { getRoomBySlug, createBookingRequest } from "@/lib/queries";
import { calculateEstimate, roomTier } from "@/lib/pricing";
import { sendGuestConfirmation, sendAdminNotification } from "@/lib/email";
import { getPostHogClient } from "@/lib/posthog-server";
import { sendBookingReceived } from "@/lib/whatsapp/booking-received";
import { bookingReceivedDeps } from "@/lib/whatsapp/runtime";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const result = bookingRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", errors: result.error.issues },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify room exists
    const room = await getRoomBySlug(data.room_slug);
    if (!room) {
      return NextResponse.json(
        { error: "Selected room not found" },
        { status: 400 }
      );
    }

    // Server-side price calculation in USD. Never trust the client total —
    // we recompute from the room's stored nightly rate + discount and the
    // bedding flag.
    const estimate = calculateEstimate(
      roomTier(room),
      data.check_in_date,
      data.check_out_date,
      { beddingPrepaid: data.bedding_prepaid }
    );

    // Store booking request (estimated_total is USD post-cutover)
    const bookingRequest = await createBookingRequest({
      guest_name: data.guest_name,
      guest_email: data.guest_email,
      guest_count: data.guest_count,
      room_id: room.id,
      room_slug: room.slug,
      check_in_date: data.check_in_date,
      check_out_date: data.check_out_date,
      estimated_total: estimate.total,
      bedding_prepaid: data.bedding_prepaid,
      notes: data.notes,
      whatsapp_number: data.whatsapp_number,
      whatsapp_opt_in: data.whatsapp_opt_in,
      status: "new",
      admin_notes: "",
    });

    const emailData = {
      guest_name: data.guest_name,
      guest_email: data.guest_email,
      room_name: room.name,
      check_in_date: data.check_in_date,
      check_out_date: data.check_out_date,
      guest_count: data.guest_count,
      estimated_total: estimate.total,
      bedding_prepaid: data.bedding_prepaid,
      notes: data.notes,
      breakdown: estimate,
    };

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: data.guest_email,
      event: "booking_request_created",
      properties: {
        room_slug: data.room_slug,
        check_in_date: data.check_in_date,
        check_out_date: data.check_out_date,
        estimated_total: estimate.total,
        bedding_prepaid: data.bedding_prepaid,
        request_id: bookingRequest.id,
      },
    });
    // Only to guests who ticked the opt-in, and only once the template is
    // approved and configured (WHATSAPP_BOOKING_TEMPLATE).
    const whatsappDeps = data.whatsapp_opt_in ? bookingReceivedDeps() : null;
    const results = await Promise.allSettled([
      sendGuestConfirmation(emailData),
      sendAdminNotification(emailData),
      posthog.shutdown(),
      whatsappDeps
        ? sendBookingReceived(whatsappDeps, {
            bookingId: bookingRequest.id,
            guestName: data.guest_name,
            roomName: room.name,
            checkIn: data.check_in_date,
            checkOut: data.check_out_date,
            whatsappNumber: data.whatsapp_number,
          })
        : Promise.resolve(),
    ]);
    for (const r of results) {
      if (r.status === "rejected") console.error("Booking notification failed:", r.reason);
    }

    return NextResponse.json(
      { id: bookingRequest.id, status: "success" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
