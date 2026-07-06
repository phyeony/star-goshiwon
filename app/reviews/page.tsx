import type { Metadata } from "next";
import Link from "next/link";
import { TrackEvent } from "@/components/analytics/track-event";
import {
  ReviewControlsAndList,
  ReviewScoreBreakdown,
} from "@/components/guest-reviews";
import {
  bookingReviewSummary,
  dbReviewToGuestReview,
  guestReviews,
} from "@/lib/reviews";
import { getApprovedReviews } from "@/lib/review-queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guest Reviews",
  description:
    "Booking.com guest review score and recent guest feedback for Star Goshiwon in Seoul.",
  alternates: { canonical: "/reviews" },
};

export default async function ReviewsPage() {
  const approved = await getApprovedReviews();
  const directReviews = approved.map(dbReviewToGuestReview);
  const allReviews = [...directReviews, ...guestReviews];
  const directAverage =
    directReviews.length > 0
      ? directReviews.reduce((sum, r) => sum + r.score, 0) /
        directReviews.length
      : null;

  return (
    <>
      <TrackEvent event="reviews_viewed" />
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-indigo-600 transition">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Guest Reviews</span>
          </nav>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Verified guest reviews
              </p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-gray-900">
                Guest Reviews
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-gray-600">
                Every review on this page comes from a verified stay. We now
                collect reviews directly from our guests after checkout through
                personal one-time review links — each one is marked
                &ldquo;Verified direct stay&rdquo;. Earlier reviews are from our
                guests&rsquo; verified Booking.com stays in 2025&ndash;2026.
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-gray-500">
                Guests rate location, value for money, room view, and WiFi
                highly. {bookingReviewSummary.source}
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                <p className="text-sm font-medium text-gray-500">
                  {bookingReviewSummary.scoreLabel}
                </p>
                <p className="mt-2 text-5xl font-extrabold text-gray-900">
                  {bookingReviewSummary.averageScore.toFixed(1)}
                  <span className="text-xl font-semibold text-gray-500">
                    /10
                  </span>
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Based on {bookingReviewSummary.scoredStayCount} reviews.
                </p>
              </div>
              {directAverage !== null && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                  <p className="text-sm font-medium text-gray-500">
                    Direct guest reviews
                  </p>
                  <p className="mt-2 text-5xl font-extrabold text-gray-900">
                    {directAverage.toFixed(1)}
                    <span className="text-xl font-semibold text-gray-500">
                      /10
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Based on {directReviews.length} verified direct{" "}
                    {directReviews.length === 1 ? "stay" : "stays"}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ReviewScoreBreakdown />

          <div className="mt-6">
            <ReviewControlsAndList reviews={allReviews} />
          </div>
        </div>
      </div>
    </>
  );
}
