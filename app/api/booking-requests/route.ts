import { NextResponse } from "next/server";
import { insertBookingRequest } from "@/lib/supabase";
import { formatEstimate, getStayEstimate } from "@/lib/pricing";
import { rooms } from "@/lib/site-data";

type BookingRequestBody = {
  checkIn?: string;
  checkOut?: string;
  email?: string;
  estimatedTotal?: number;
  guests?: number;
  message?: string;
  name?: string;
  nights?: number;
  pricingBasis?: string;
  roomName?: string;
  roomSlug?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as BookingRequestBody;
  const room = rooms.find((entry) => entry.slug === body.roomSlug);

  if (!room) {
    return NextResponse.json({ error: "Selected room was not found." }, { status: 400 });
  }

  if (!body.name || !body.email || !body.checkIn || !body.checkOut || !body.guests) {
    return NextResponse.json({ error: "Missing required booking request fields." }, { status: 400 });
  }

  const estimate = getStayEstimate({
    room,
    checkIn: body.checkIn,
    checkOut: body.checkOut
  });

  if (!estimate.isValid || estimate.total === null) {
    return NextResponse.json({ error: "Invalid stay dates for pricing." }, { status: 400 });
  }

  if (
    body.estimatedTotal !== estimate.total ||
    body.pricingBasis !== estimate.label ||
    body.nights !== estimate.nights
  ) {
    return NextResponse.json(
      {
        error: `Pricing changed during validation. Expected ${formatEstimate(estimate.total)} using ${estimate.label} pricing.`
      },
      { status: 400 }
    );
  }

  try {
    await insertBookingRequest({
      check_in: body.checkIn,
      check_out: body.checkOut,
      email: body.email,
      estimated_total: estimate.total,
      guests: body.guests,
      message: body.message ?? "",
      name: body.name,
      nights: estimate.nights,
      pricing_basis: estimate.label,
      room_name: room.name,
      room_slug: room.slug,
      status: "new"
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown booking request error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
