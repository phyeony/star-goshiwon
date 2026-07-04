import type { Metadata } from "next";
import Link from "next/link";
import { GaEvent } from "@/components/analytics/ga-event";
import { captureApprovedBookingPayment } from "@/lib/payments";
import { formatUSD, formatApproxKRW } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Payment Complete",
};

export const dynamic = "force-dynamic";

export default async function BookingPaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ request_id?: string; token?: string }>;
}) {
  const { request_id: requestId, token } = await searchParams;
  let error = "";
  let request:
    | Awaited<ReturnType<typeof captureApprovedBookingPayment>>
    | null = null;

  if (!token) {
    error = "Missing PayPal order token.";
  } else {
    try {
      request = await captureApprovedBookingPayment({
        requestId,
        orderId: token,
      });
    } catch (e) {
      console.error("Payment return capture failed:", e);
      error =
        e instanceof Error
          ? e.message
          : "We could not confirm your payment automatically.";
    }
  }

  if (error || !request) {
    return (
      <PaymentShell title="Payment needs review" tone="warning">
        <p className="text-sm text-gray-600">
          We could not automatically confirm this PayPal payment. If you were
          charged, please email us and we will verify it manually.
        </p>
        <p className="text-xs text-gray-500 mt-3">{error}</p>
        <div className="mt-6">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            Contact us
          </Link>
        </div>
      </PaymentShell>
    );
  }

  return (
    <PaymentShell title="Payment received" tone="success">
      <GaEvent
        event="purchase"
        params={{
          transaction_id: token,
          currency: "USD",
          value: request.estimated_total,
          items: [
            {
              item_id: request.room_slug,
              item_name: request.rooms?.name || request.room_slug,
              item_category: "room",
              price: request.estimated_total,
              quantity: 1,
            },
          ],
        }}
      />
      <p className="text-sm text-gray-600">
        Your booking is confirmed. We sent a confirmation email to{" "}
        <strong>{request.guest_email}</strong>.
      </p>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Room</dt>
          <dd className="font-medium text-gray-900 text-right">
            {request.rooms?.name || request.room_slug}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500">Dates</dt>
          <dd className="font-medium text-gray-900 text-right">
            {request.check_in_date} to {request.check_out_date}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-gray-200 pt-3">
          <dt className="text-gray-500">Paid</dt>
          <dd className="font-bold text-gray-900 text-right">
            {formatUSD(request.estimated_total)}
            <span className="ml-2 font-normal text-gray-500">
              {formatApproxKRW(request.estimated_total)}
            </span>
          </dd>
        </div>
      </dl>
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          Back to home
        </Link>
      </div>
    </PaymentShell>
  );
}

function PaymentShell({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "success" | "warning";
  children: React.ReactNode;
}) {
  const color =
    tone === "success"
      ? "bg-green-100 text-green-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center mx-auto mb-6`}>
        <span className="text-2xl font-bold">{tone === "success" ? "✓" : "!"}</span>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}
