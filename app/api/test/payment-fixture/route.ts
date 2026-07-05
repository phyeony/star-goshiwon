import { NextRequest, NextResponse } from "next/server";
import {
  createBookingRequest,
  getRoomBySlug,
  updateBookingRequest,
} from "@/lib/queries";
import { calculateEstimate, roomTier } from "@/lib/pricing";
import { sendPaymentLinkEmail } from "@/lib/email";
import { getPaymentReviewUrl, issuePaymentTokenForRequest } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (process.env.E2E_TEST_MODE !== "true") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      expired?: boolean;
      paid?: boolean;
      sendEmail?: boolean;
    };

    const now = new Date();
    const roomSlug = "room-with-private-shower";
    const checkIn = "2026-06-01";
    const checkOut = "2026-06-08";

    // Link the real room so the payment flow's price recalculation
    // (recalculateStoredEstimate) can resolve the nightly rate from the joined
    // room. With room_id null it falls back to $0/night and the paid amount
    // collapses to just the deposit.
    const room = await getRoomBySlug(roomSlug);
    if (!room) throw new Error(`Fixture room not found: ${roomSlug}`);

    const estimate = calculateEstimate(roomTier(room), checkIn, checkOut, {
      beddingPrepaid: false,
    });

    const booking = await createBookingRequest({
      guest_name: "Playwright Guest",
      guest_email: `playwright-${now.getTime()}@example.com`,
      guest_count: 1,
      room_id: room.id,
      room_slug: roomSlug,
      check_in_date: checkIn,
      check_out_date: checkOut,
      estimated_total: estimate.total,
      bedding_prepaid: false,
      notes: "E2E payment fixture",
      status: "approved",
      admin_notes: "",
      payment_status: body.paid ? "paid" : "pending",
      payment_provider: "paypal",
      payment_amount: estimate.total,
      payment_currency: "USD",
      payment_expires_at: new Date(
        now.getTime() + (body.expired ? -60_000 : 48 * 60 * 60 * 1000)
      ).toISOString(),
      payment_paid_at: body.paid ? now.toISOString() : null,
    });

    if (body.expired) {
      await updateBookingRequest(booking.id, {
        status: "approved",
        payment_status: "pending",
      });
    }

    const paymentToken = await issuePaymentTokenForRequest(booking.id);
    const paymentUrl = getPaymentReviewUrl(booking.id, paymentToken);

    if (body.sendEmail) {
      await sendPaymentLinkEmail({
        guest_name: booking.guest_name,
        guest_email: booking.guest_email,
        room_name: "Private Shower Room",
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        guest_count: booking.guest_count,
        estimated_total: booking.estimated_total,
        payment_url: paymentUrl,
        payment_expires_at: booking.payment_expires_at!,
      });
    }

    return NextResponse.json({
      id: booking.id,
      // Actual charged total derived from the room's live DB pricing, so
      // tests can assert refund math without hardcoding rates.
      amountUsd: estimate.total,
      payUrl: paymentUrl,
      unsafePayUrl: `/booking-payment/pay?request_id=${booking.id}`,
      startUrl: `/booking-payment/start?request_id=${booking.id}&payment_token=${encodeURIComponent(paymentToken)}`,
    });
  } catch (error) {
    console.error("Create payment fixture error:", error);
    return NextResponse.json(
      {
        error: "fixture_failed",
        message: error instanceof Error ? error.message : "Unknown fixture error",
      },
      { status: 500 }
    );
  }
}
