import { NextRequest, NextResponse } from "next/server";
import { refundBookingDeposit } from "@/lib/payments";

export const dynamic = "force-dynamic";

// E2E-only shortcut to exercise the real refund path without admin auth (the
// admin API route is middleware-guarded). 404s outside the Playwright harness.
export async function POST(req: NextRequest) {
  if (process.env.E2E_TEST_MODE !== "true") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      requestId?: string;
      amountUsd?: number;
    };
    if (!body.requestId) {
      return NextResponse.json({ error: "requestId required" }, { status: 400 });
    }

    const result = await refundBookingDeposit({
      requestId: body.requestId,
      amountUsd: body.amountUsd,
    });

    return NextResponse.json({
      refund_id: result.refundId,
      fully_refunded: result.fullyRefunded,
      refund_amount: result.request.refund_amount,
      payment_status: result.request.payment_status,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "refund_failed" },
      { status: 500 }
    );
  }
}
