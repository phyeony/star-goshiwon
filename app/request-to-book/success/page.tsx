import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingRequestById } from "@/lib/queries";
import {
  formatUSD,
  formatApproxKRW,
  DEPOSIT_USD,
  calculateEstimate,
  getUsdPrices,
} from "@/lib/pricing";
import { siteConfig } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Request Sent",
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) notFound();

  const request = await getBookingRequestById(id);
  if (!request) notFound();

  // Recompute price breakdown from stored room slug + dates + bedding flag.
  // Wrapped in try/catch so older requests with retired room slugs still render.
  let breakdown: ReturnType<typeof calculateEstimate> | null = null;
  try {
    breakdown = calculateEstimate(
      getUsdPrices(request.room_slug),
      request.check_in_date,
      request.check_out_date,
      { beddingPrepaid: request.bedding_prepaid }
    );
  } catch {
    breakdown = null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-xl mx-auto text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
          Request Sent!
        </h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-left mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Request Summary
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Room</dt>
              <dd className="text-sm font-medium text-gray-900">
                {request.rooms?.name || request.room_slug}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Check-in</dt>
              <dd className="text-sm font-medium text-gray-900">
                {request.check_in_date}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Check-out</dt>
              <dd className="text-sm font-medium text-gray-900">
                {request.check_out_date}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Guests</dt>
              <dd className="text-sm font-medium text-gray-900">
                {request.guest_count}
              </dd>
            </div>
            {breakdown && breakdown.weeks > 0 && (
              <div className="flex justify-between border-t border-gray-100 pt-3">
                <dt className="text-sm text-gray-500">
                  {formatUSD(breakdown.weeklyRate)} × {breakdown.weeks} week
                  {breakdown.weeks > 1 ? "s" : ""}
                </dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatUSD(breakdown.weeklySubtotal)}
                </dd>
              </div>
            )}
            {breakdown && breakdown.days > 0 && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">
                  {formatUSD(breakdown.dailyRate)} × {breakdown.days} day
                  {breakdown.days > 1 ? "s" : ""}
                </dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatUSD(breakdown.dailySubtotal)}
                </dd>
              </div>
            )}
            {breakdown?.discountApplied && (
              <div className="flex justify-between">
                <dt className="text-sm text-green-700">
                  Long-stay discount (15%)
                </dt>
                <dd className="text-sm font-medium text-green-700">
                  −{formatUSD(breakdown.discount)}
                </dd>
              </div>
            )}
            {request.bedding_prepaid && (
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Bedding set</dt>
                <dd className="text-sm font-medium text-gray-900">
                  $15 prepaid
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Refundable deposit</dt>
              <dd className="text-sm font-medium text-gray-900">
                {formatUSD(DEPOSIT_USD)} prepaid
              </dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3">
              <dt className="text-sm font-semibold text-gray-900">
                Total to prepay
              </dt>
              <dd className="text-sm font-bold text-gray-900">
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

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>This is not a confirmed booking.</strong> We will review
            availability and contact you via email at{" "}
            <strong>{request.guest_email}</strong> within{" "}
            {siteConfig.responseTime}.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out"
          >
            Back to Home
          </Link>
          <Link
            href="/rooms"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition duration-150 ease-in-out"
          >
            Browse More Rooms
          </Link>
        </div>
      </div>
    </div>
  );
}
