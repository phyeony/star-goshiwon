import { NextRequest, NextResponse } from "next/server";
import { verifyPayPalWebhook } from "@/lib/paypal";
import {
  captureApprovedBookingPayment,
  markPaymentFailedByOrderId,
  markPaymentPaidByOrderId,
} from "@/lib/payments";

type PayPalWebhookEvent = {
  event_type?: string;
  resource?: {
    id?: string;
    status?: string;
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
      };
    };
  };
};

function getOrderId(event: PayPalWebhookEvent) {
  return (
    event.resource?.supplementary_data?.related_ids?.order_id ||
    event.resource?.id ||
    null
  );
}

export async function POST(req: NextRequest) {
  const event = (await req.json()) as PayPalWebhookEvent;

  try {
    const verified = await verifyPayPalWebhook({
      auth_algo: req.headers.get("paypal-auth-algo"),
      cert_url: req.headers.get("paypal-cert-url"),
      transmission_id: req.headers.get("paypal-transmission-id"),
      transmission_sig: req.headers.get("paypal-transmission-sig"),
      transmission_time: req.headers.get("paypal-transmission-time"),
      webhook_event: event,
    });

    if (!verified) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
    }

    const orderId = getOrderId(event);
    if (!orderId) return NextResponse.json({ received: true });

    switch (event.event_type) {
      case "CHECKOUT.ORDER.APPROVED":
        await captureApprovedBookingPayment({ orderId });
        break;
      case "PAYMENT.CAPTURE.COMPLETED":
        await markPaymentPaidByOrderId(orderId);
        break;
      case "PAYMENT.CAPTURE.DENIED":
      case "CHECKOUT.PAYMENT-APPROVAL.REVERSED":
        await markPaymentFailedByOrderId(
          orderId,
          event.resource?.status || event.event_type || "PayPal payment failed"
        );
        break;
      case "PAYMENT.CAPTURE.PENDING":
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "webhook_error" },
      { status: 500 }
    );
  }
}
