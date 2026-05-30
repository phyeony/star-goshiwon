"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  additionalReviewCategories,
  basicReviewCategories,
  bookingReviewSummary,
  guestReviews,
  highlightedGuestReviews,
  type GuestReview,
  type ReviewCategoryScore,
} from "@/lib/reviews";

function ScoreBadge({ score }: { score: number }) {
  return (
    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-indigo-600 text-2xl font-bold text-white">
      {score.toFixed(score % 1 === 0 ? 0 : 1)}
    </div>
  );
}

function formatScore(score: number) {
  return score.toFixed(score % 1 === 0 ? 0 : 1);
}

function scoreBarColor(score: number) {
  if (score >= 8) return "bg-[#43a047]";
  if (score >= 7) return "bg-[#a5d6a7]";
  return "bg-[#f6c343]";
}

function CategorySlider({
  category,
  color = "score",
}: {
  category: ReviewCategoryScore;
  color?: "score" | "primary";
}) {
  const width = `${Math.max(0, Math.min(category.score, 10)) * 10}%`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-base font-medium text-[#1a1a1a]">
          {category.label}
        </span>
        <span className="text-base font-medium text-[#1a1a1a]">
          {formatScore(category.score)}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-sm bg-[#f2f2f2]">
        <div
          className={`h-full rounded-sm ${
            color === "primary"
              ? "bg-indigo-600"
              : scoreBarColor(category.score)
          }`}
          style={{ width }}
        />
      </div>
    </div>
  );
}

function ReviewCard({
  review,
  compact = false,
}: {
  review: GuestReview;
  compact?: boolean;
}) {
  const quote =
    review.positive ?? "This guest left a score without written comments.";

  return (
    <article className="h-full rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">{review.title}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {review.guest}, {review.country} · {review.date}
          </p>
          <p className="mt-1 text-sm font-medium text-gray-700">
            {review.roomType}
          </p>
        </div>
        <ScoreBadge score={review.score} />
      </div>
      <p
        lang={review.language}
        className={
          compact
            ? "text-sm leading-6 text-gray-600"
            : "text-base leading-7 text-gray-600"
        }
      >
        &ldquo;{quote}&rdquo;
      </p>
    </article>
  );
}

function CommentBlock({
  label,
  children,
  tone,
}: {
  label: string;
  children: React.ReactNode;
  tone: "positive" | "negative";
}) {
  const isPositive = tone === "positive";

  return (
    <div
      className={
        isPositive
          ? "rounded-lg border border-green-100 bg-green-50/70 p-4"
          : "rounded-lg border border-red-100 bg-red-50/70 p-4"
      }
    >
      <p
        className={
          isPositive
            ? "text-xs font-bold uppercase tracking-wide text-green-700"
            : "text-xs font-bold uppercase tracking-wide text-red-700"
        }
      >
        {label}
      </p>
      <p className="mt-2 text-base leading-7 text-gray-700">{children}</p>
    </div>
  );
}

function InlineCategoryScores({
  title,
  categories,
}: {
  title: string;
  categories: ReviewCategoryScore[];
}) {
  return (
    <div>
      <p className="text-xl font-bold text-[#1a1a1a]">{title}</p>
      <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-3">
        {categories.map((category) => (
          <CategorySlider
            key={category.label}
            category={category}
            color="primary"
          />
        ))}
      </div>
    </div>
  );
}

function CategoryGrid({
  categories,
  compact = false,
}: {
  categories: ReviewCategoryScore[];
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2"
          : "grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-3"
      }
    >
      {categories.map((category) => (
        <CategorySlider key={category.label} category={category} />
      ))}
    </div>
  );
}

export function GuestReviews({
  variant = "full",
}: {
  variant?: "full" | "compact" | "bottom";
}) {
  if (variant === "compact") {
    const review = highlightedGuestReviews[0];

    return (
      <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-gray-900">Guest review</p>
            <p className="text-xs text-gray-500">Booking.com stay</p>
          </div>
          <ScoreBadge score={review.score} />
        </div>
        <p className="text-sm leading-6 text-gray-700">
          &ldquo;{review.positive}&rdquo;
        </p>
        <p className="mt-3 text-xs text-gray-500">
          {bookingReviewSummary.source}
        </p>
      </div>
    );
  }

  if (variant === "bottom") {
    return (
      <section className="mt-12 border-t border-gray-200 pt-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Booking.com reviews
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">
              Guest Reviews
            </h2>
            <p className="mt-2 max-w-2xl text-base text-gray-500">
              A quick snapshot of recent guest feedback before you request a
              room.
            </p>
          </div>
          <Link
            href="/reviews"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            View all reviews
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              {bookingReviewSummary.scoreLabel}
            </p>
            <p className="mt-2 text-4xl font-extrabold text-gray-900">
              {bookingReviewSummary.averageScore.toFixed(1)}
              <span className="text-lg font-semibold text-gray-500">/10</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Based on {bookingReviewSummary.scoredStayCount} reviews
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {highlightedGuestReviews.map((review) => (
              <ReviewCard key={review.id} review={review} compact />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-16 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Booking.com feedback
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
              Guest Reviews
            </h2>
            <p className="mt-2 text-base text-gray-500">
              Booking.com guests rate the location and value highly, with the
              strongest feedback on the view, WiFi, and nearby food options.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-stretch">
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-2xl font-extrabold text-gray-900">
                {bookingReviewSummary.averageScore.toFixed(1)}
                <span className="text-base font-semibold text-gray-500">
                  /10
                </span>
              </p>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Booking.com score
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-2xl font-extrabold text-gray-900">
                {bookingReviewSummary.scoredStayCount}
              </p>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Guest reviews
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {highlightedGuestReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
            <h3 className="text-base font-bold text-gray-900">
              What to expect
            </h3>
            <p className="mt-3 text-base leading-7 text-gray-600">
              This is a goshiwon: rooms are private and practical, while
              kitchens, laundry, and some bathrooms are shared. Occasional noise
              and shared facility tradeoffs are part of the low-cost setup.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              {bookingReviewSummary.source}
            </p>
            <Link
              href="/reviews"
              className="mt-4 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              View all reviews
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ReviewScoreBreakdown() {
  return (
    <div className="rounded-sm border border-[#d9d9d9] bg-white px-5 py-6 md:px-7">
      <div>
        <h2 className="text-xl font-bold text-[#1a1a1a]">Basic categories</h2>

        <div className="mt-4">
          <CategoryGrid categories={basicReviewCategories} compact />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold text-[#1a1a1a]">
          Additional categories
        </h2>

        <div className="mt-4">
          <CategoryGrid categories={additionalReviewCategories} compact />
        </div>
      </div>
    </div>
  );
}

type SortOption = "newest" | "highest" | "lowest";

function parseReviewDate(date: string) {
  return new Date(date).getTime();
}

export function ReviewControlsAndList() {
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  const sortedReviews = useMemo(() => {
    return guestReviews.slice().sort((a, b) => {
      if (sortOption === "highest") return b.score - a.score;
      if (sortOption === "lowest") return a.score - b.score;
      return parseReviewDate(b.date) - parseReviewDate(a.date);
    });
  }, [sortOption]);

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <div className="w-full sm:w-auto">
          <label className="sr-only" htmlFor="review-sort">
            Sort reviews
          </label>
          <select
            id="review-sort"
            value={sortOption}
            onChange={(event) =>
              setSortOption(event.target.value as SortOption)
            }
            className="h-12 rounded-sm border border-[#d9d9d9] bg-white px-4 text-base text-[#1a1a1a]"
          >
            <option value="newest">Newest first</option>
            <option value="highest">Highest score first</option>
            <option value="lowest">Lowest score first</option>
          </select>
        </div>
      </div>

      <ReviewList reviews={sortedReviews} />
    </div>
  );
}

export function ReviewList({
  reviews = guestReviews,
}: {
  reviews?: GuestReview[];
}) {
  return (
    <div className="space-y-5">
      {reviews.map((review) => (
        <article
          key={review.id}
          className="rounded-sm border border-[#d9d9d9] bg-white px-5 py-6 shadow-sm md:px-8"
        >
          <div className="grid gap-5 border-b border-[#e6e6e6] pb-6 md:grid-cols-[auto_1fr_auto] md:items-start">
            <ScoreBadge score={review.score} />
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-[#1a1a1a]">
                {review.guest}, {review.country.toLowerCase()}
              </h2>
              <p className="mt-2 text-base font-semibold text-[#6b6b6b]">
                {review.roomType}
              </p>
            </div>
            <time className="text-base text-[#6b6b6b]" dateTime={review.date}>
              {review.date}
            </time>
          </div>

          <div className="mt-7 space-y-7">
            <InlineCategoryScores
              title="Basic categories"
              categories={review.basicCategories}
            />
            {review.additionalCategories &&
              review.additionalCategories.length > 0 && (
                <InlineCategoryScores
                  title="Additional categories"
                  categories={review.additionalCategories}
                />
              )}
          </div>

          {review.positive || review.negative ? (
            <div className="mt-7 space-y-3">
              <h3 className="text-lg font-bold text-[#1a1a1a]">
                {review.title}
              </h3>
              {review.positive && (
                <CommentBlock label="Liked" tone="positive">
                  {review.positive}
                </CommentBlock>
              )}
              {review.negative && (
                <CommentBlock label="Did not like" tone="negative">
                  {review.negative}
                </CommentBlock>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-gray-500">
              This guest left category scores without written comments.
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
