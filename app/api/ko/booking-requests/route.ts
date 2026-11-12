import { NextRequest, NextResponse } from "next/server";
import { koBookingRequestSchema } from "@/lib/validation";
import { getRoomBySlug, createBookingRequest } from "@/lib/queries";
import { sendKoAdminNotification } from "@/lib/email";
import { getPostHogClient } from "@/lib/posthog-server";
import {
  addMonths,
  koRoomName,
  normalizeKoreanMobile,
} from "@/lib/ko-site";

/**
 * Booking request from the Korean site. Saves the request (locale 'ko', phone
 * number, no email) and alerts the admin by email, like the English site.
 * The guest is answered by phone/SMS; no guest email is sent.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = koBookingRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "입력 내용을 확인해 주세요", errors: result.error.issues },
        { status: 400 }
      );
    }
    const data = result.data;
    const phone = normalizeKoreanMobile(data.guest_phone);
    if (!phone) {
      return NextResponse.json(
        {
          error: "휴대폰 번호를 확인해 주세요",
          errors: [{ path: ["guest_phone"], message: "휴대폰 번호를 확인해 주세요" }],
        },
        { status: 400 }
      );
    }

    const room = await getRoomBySlug(data.room_slug);
    if (!room || room.status === "unavailable") {
      return NextResponse.json(
        { error: "선택한 방을 찾을 수 없습니다" },
        { status: 400 }
      );
    }

    const request = await createBookingRequest({
      guest_name: data.guest_name,
      guest_email: "",
      guest_phone: phone,
      locale: "ko",
      stay_months: data.stay_months,
      guest_count: 1,
      room_id: room.id,
      room_slug: room.slug,
      check_in_date: data.move_in_date,
      check_out_date: addMonths(data.move_in_date, data.stay_months),
      // estimated_total is USD for the English/PayPal flow. Korean stays are
      // paid by bank transfer in KRW and quoted on KakaoTalk, so leave it 0.
      estimated_total: 0,
      notes: data.notes,
      status: "new",
      admin_notes: "",
    });

    const roomName = koRoomName(room);
    try {
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: `ko-request-${request.id}`,
        event: "booking_request_created",
        properties: {
          locale: "ko",
          room_slug: room.slug,
          check_in_date: data.move_in_date,
          stay_months: data.stay_months,
          request_id: request.id,
        },
      });
      await posthog.shutdown();
    } catch (err) {
      console.error("PostHog capture failed:", err);
    }
    try {
      await sendKoAdminNotification({
        request_id: request.id,
        guest_name: data.guest_name,
        guest_phone: phone,
        room_name: roomName,
        move_in_date: data.move_in_date,
        stay_months: data.stay_months,
        monthly_rate_krw: room.monthly_rate_krw ?? null,
        notes: data.notes,
      });
    } catch (err) {
      console.error("Korean admin notification failed:", err);
    }

    return NextResponse.json(
      {
        id: request.id,
        status: "success",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Korean booking request error:", error);
    return NextResponse.json(
      { error: "잠시 후 다시 시도해 주세요" },
      { status: 500 }
    );
  }
}
