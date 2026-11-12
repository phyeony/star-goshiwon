import { NextRequest, NextResponse } from "next/server";
import { startBookingPayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const requestId = req.nextUrl.searchParams.get("request_id");
  const paymentToken = req.nextUrl.searchParams.get("payment_token");
  const baseUrl = req.nextUrl.origin;
  const wantsJson =
    req.headers.get("accept")?.includes("application/json") ||
    req.headers.get("x-requested-with") === "fetch";

  if (!requestId || !paymentToken) {
    if (wantsJson) {
      return NextResponse.json({ error: "Missing payment link details" }, { status: 400 });
    }
    return NextResponse.redirect(new URL("/contact", baseUrl));
  }

  try {
    const result = await startBookingPayment(requestId, paymentToken);
    if (wantsJson) {
      return NextResponse.json({ redirectUrl: result.redirectUrl });
    }
    return NextResponse.redirect(result.redirectUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "payment_start_failed";
    if (wantsJson) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const url = new URL("/booking-payment/pay", baseUrl);
    url.searchParams.set("request_id", requestId);
    url.searchParams.set("payment_token", paymentToken);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }
}
