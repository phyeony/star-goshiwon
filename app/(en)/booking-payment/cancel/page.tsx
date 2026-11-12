import type { Metadata } from "next";
import Link from "next/link";
import { getBookingRequestById } from "@/lib/queries";
import { isPaymentExpired, isValidPaymentToken, markPaymentExpired } from "@/lib/payments";

export const metadata: Metadata = {
  title: "Payment Cancelled",
};

export const dynamic = "force-dynamic";

export default async function BookingPaymentCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ request_id?: string; payment_token?: string }>;
}) {
  const { request_id: requestId, payment_token: paymentToken } = await searchParams;
  let request = requestId ? await getBookingRequestById(requestId) : null;
  if (request && !isValidPaymentToken(request, paymentToken)) {
    request = null;
  }
  if (request && isPaymentExpired(request)) {
    request = await markPaymentExpired(request);
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
          Payment cancelled
        </h1>
        <p className="text-sm text-gray-600">
          Your booking is not confirmed yet. You can return to the payment link
          from your approval email, or contact us if you need help.
        </p>
        {request?.payment_status === "pending" && (
          <div className="mt-6">
            <Link
              href={`/booking-payment/pay?request_id=${request.id}&payment_token=${encodeURIComponent(paymentToken!)}`}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              Review and try again
            </Link>
          </div>
        )}
        <div className="mt-4">
          <Link
            href="/contact"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
