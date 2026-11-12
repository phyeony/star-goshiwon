import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PayPalStartButton } from "@/components/booking-payment/paypal-start-button";
import { getBookingRequestById } from "@/lib/queries";
import { isValidPaymentToken, markPaymentExpired } from "@/lib/payments";
import {
  DEPOSIT_USD,
  calculateEstimate,
  formatApproxKRW,
  formatUSD,
  roomTier,
} from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Review and Pay",
};

export const dynamic = "force-dynamic";

export default async function BookingPaymentPayPage({
  searchParams,
}: {
  searchParams: Promise<{ request_id?: string; payment_token?: string }>;
}) {
  const { request_id: requestId, payment_token: paymentToken } =
    await searchParams;
  if (!requestId) notFound();

  let request = await getBookingRequestById(requestId);
  if (!request) notFound();
  if (!isValidPaymentToken(request, paymentToken)) notFound();

  let breakdown: ReturnType<typeof calculateEstimate> | null = null;
  try {
    if (request.rooms) {
      breakdown = calculateEstimate(
        roomTier(request.rooms),
        request.check_in_date,
        request.check_out_date,
        { beddingPrepaid: request.bedding_prepaid },
      );
    }
  } catch {
    breakdown = null;
  }

  const expiresAt = request.payment_expires_at
    ? new Date(request.payment_expires_at)
    : null;
  const isExpired = Boolean(expiresAt && expiresAt.getTime() <= Date.now());
  if (isExpired && request.payment_status === "pending") {
    request = await markPaymentExpired(request);
  }
  const isPayable = request.payment_status === "pending" && !isExpired;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-2">
          Review and pay securely
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Check your booking details before continuing to PayPal. Your booking
          is confirmed only after payment is completed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Booking summary
          </h2>
          <dl className="space-y-3">
            <SummaryRow label="Guest" value={request.guest_name} />
            <SummaryRow
              label="Room"
              value={request.rooms?.name || request.room_slug}
            />
            <SummaryRow label="Check-in" value={request.check_in_date} />
            <SummaryRow label="Check-out" value={request.check_out_date} />
            <SummaryRow label="Guests" value={`${request.guest_count}`} />
          </dl>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Payment details
            </h3>
            <dl className="space-y-3">
              {breakdown && breakdown.nights > 0 && (
                <SummaryRow
                  label={`${breakdown.nights} night${breakdown.nights > 1 ? "s" : ""} × ${formatUSD(breakdown.nightlyRate)}`}
                  value={formatUSD(breakdown.nightsSubtotal)}
                />
              )}
              {breakdown && breakdown.totalSaving > 0 && (
                <SummaryRow
                  label={breakdown.savingLabel}
                  value={`-${formatUSD(breakdown.totalSaving)}`}
                  valueClassName="text-green-700"
                />
              )}
              {request.bedding_prepaid && (
                <SummaryRow label="Bedding set" value="$15 prepaid" />
              )}
              <SummaryRow
                label="Refundable deposit"
                value={`${formatUSD(DEPOSIT_USD)} prepaid`}
              />
              <div className="flex justify-between gap-4 border-t border-gray-200 pt-3">
                <dt className="text-sm font-semibold text-gray-900">
                  Total to prepay
                </dt>
                <dd className="text-sm font-bold text-gray-900 text-right">
                  {formatUSD(request.estimated_total)}
                  <span className="ml-2 font-normal text-gray-500">
                    {formatApproxKRW(request.estimated_total)}
                  </span>
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-gray-500">
              The {formatUSD(DEPOSIT_USD)} deposit is refunded via PayPal at the
              end of your stay if the room is left undamaged.
            </p>
          </div>
        </div>

        <aside className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit">
          <h2 className="text-lg font-semibold text-gray-900">
            Payment status
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Current status:{" "}
            <span className="font-semibold text-gray-900">
              {request.payment_status}
            </span>
          </p>
          {expiresAt && (
            <p className="mt-2 text-sm text-gray-600">
              Pay by{" "}
              <span className="font-semibold text-gray-900">
                {expiresAt.toLocaleString("en-US", {
                  timeZone: "Asia/Seoul",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZoneName: "short",
                })}
              </span>
            </p>
          )}

          {request.payment_status === "paid" && (
            <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-800">
              This booking is already paid and confirmed.
            </div>
          )}

          {isExpired && request.payment_status !== "paid" && (
            <div className="mt-5 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-3 text-sm text-yellow-800">
              This payment link has expired. Please contact us and we can resend
              a fresh link.
            </div>
          )}

          {!isPayable && request.payment_status !== "paid" && !isExpired && (
            <div className="mt-5 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-3 text-sm text-yellow-800">
              This request is not ready for payment yet. Please contact us if
              you expected to pay now.
            </div>
          )}

          {isPayable && (
            <>
              <PayPalStartButton
                href={`/booking-payment/start?request_id=${request.id}&payment_token=${encodeURIComponent(paymentToken!)}`}
              />
              <p className="mt-3 text-xs text-gray-500">
                PayPal may offer card checkout without a PayPal account,
                depending on your location, account settings, and PayPal risk
                checks.
              </p>
            </>
          )}

          <Link
            href="/contact"
            className="mt-5 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Need help?
          </Link>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName = "text-gray-900",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className={`text-sm font-medium text-right ${valueClassName}`}>
        {value}
      </dd>
    </div>
  );
}
