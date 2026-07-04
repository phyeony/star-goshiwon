import { NextRequest, NextResponse } from "next/server";
import { refundBookingDeposit } from "@/lib/payments";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { getPostHogClient } from "@/lib/posthog-server";

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: Context) {
  try {
    const adminUser = await getAdminUserOrNull();
    if (!adminUser) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const amountUsd =
      body.amount_usd === undefined || body.amount_usd === null
        ? undefined
        : Number(body.amount_usd);

    if (amountUsd !== undefined && !Number.isFinite(amountUsd)) {
      return NextResponse.json(
        { error: "amount_usd must be a number" },
        { status: 400 }
      );
    }

    const result = await refundBookingDeposit({ requestId: id, amountUsd });

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: result.request.guest_email,
      event: "deposit_refunded",
      properties: {
        request_id: id,
        refund_id: result.refundId,
        amount_usd: amountUsd ?? null,
        fully_refunded: result.fullyRefunded,
        room_slug: result.request.room_slug,
      },
    });
    await posthog.shutdown();

    return NextResponse.json({
      status: "success",
      refund_id: result.refundId,
      fully_refunded: result.fullyRefunded,
      refund_amount: result.request.refund_amount,
    });
  } catch (error) {
    console.error("Deposit refund error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
