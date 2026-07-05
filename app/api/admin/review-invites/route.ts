import { NextRequest, NextResponse } from "next/server";
import {
  createReviewInvite,
  generateReviewToken,
  reviewInviteUrl,
} from "@/lib/review-queries";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { getPostHogClient } from "@/lib/posthog-server";

export async function POST(req: NextRequest) {
  try {
    const adminUser = await getAdminUserOrNull();
    if (!adminUser) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const guestName =
      typeof body.guest_name === "string" ? body.guest_name.trim() : "";
    const roomType =
      typeof body.room_type === "string" ? body.room_type.trim() : "";
    const guestEmail =
      typeof body.guest_email === "string" && body.guest_email.trim().length > 0
        ? body.guest_email.trim().toLowerCase()
        : null;
    const bookingRequestId =
      typeof body.booking_request_id === "string"
        ? body.booking_request_id
        : null;

    if (!roomType) {
      return NextResponse.json(
        { error: "room_type is required" },
        { status: 400 }
      );
    }

    const invite = await createReviewInvite({
      token: generateReviewToken(),
      guest_name: guestName,
      guest_email: guestEmail,
      room_type: roomType,
      booking_request_id: bookingRequestId,
    });

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: adminUser.email ?? "admin",
      event: "review_invite_created",
      properties: {
        invite_id: invite.id,
        room_type: roomType,
        from_booking: Boolean(bookingRequestId),
        has_email: Boolean(guestEmail),
      },
    });
    await posthog.shutdown();

    return NextResponse.json({ invite, url: reviewInviteUrl(invite.token) });
  } catch (error) {
    console.error("Create review invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
