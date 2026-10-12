import { describe, expect, it } from "vitest";
import {
  dbReviewToGuestReview,
  guestReviews,
  pickHighlightedReviews,
  type GuestReview,
} from "./reviews";
import type { Review } from "./types";

const dbReview: Review = {
  id: "r1",
  invite_id: "i1",
  guest_name: "Direct Guest",
  country: "US",
  room_type: "Economy Room",
  score: 9,
  title: "Great value",
  positive: "Loved the view",
  negative: null,
  basic_categories: [{ label: "Staff", score: 10 }],
  additional_categories: [],
  status: "approved",
  submitted_at: "2026-07-06T09:30:00.000Z",
  reviewed_at: "2026-07-06T10:00:00.000Z",
};

describe("dbReviewToGuestReview", () => {
  it("maps a DB review onto the GuestReview display shape", () => {
    const review = dbReviewToGuestReview(dbReview);
    expect(review).toEqual({
      id: "r1",
      date: "6 Jul 2026",
      score: 9,
      title: "Great value",
      guest: "Direct Guest",
      country: "US",
      roomType: "Economy Room",
      basicCategories: [{ label: "Staff", score: 10 }],
      additionalCategories: [],
      positive: "Loved the view",
      negative: undefined,
      source: "direct",
    });
  });

  it("falls back to a generic title and empty country", () => {
    const review = dbReviewToGuestReview({
      ...dbReview,
      title: null,
      country: null,
      positive: null,
    });
    expect(review.title).toBe("Review from a verified direct stay");
    expect(review.country).toBe("");
    expect(review.positive).toBeUndefined();
  });
});

describe("pickHighlightedReviews", () => {
  const review = (
    id: string,
    date: string,
    score: number,
    { quotable = true } = {}
  ): GuestReview => ({
    id,
    date,
    score,
    positive: quotable ? "Great stay" : undefined,
    title: id,
    guest: "Guest",
    country: "US",
    roomType: "Economy Room",
  });

  it("returns the most recent reviews scoring 8 or higher, newest first", () => {
    const picked = pickHighlightedReviews([
      review("old-10", "1 Jan 2026", 10),
      review("new-9", "6 Jul 2026", 9),
      review("mid-10", "22 Apr 2026", 10),
    ]);
    expect(picked.map((r) => r.id)).toEqual(["new-9", "mid-10"]);
  });

  it("includes a score of exactly 8 and excludes anything below", () => {
    const picked = pickHighlightedReviews([
      review("seven", "7 Jul 2026", 7),
      review("eight", "6 Jul 2026", 8),
      review("nine", "1 Jan 2026", 9),
    ]);
    expect(picked.map((r) => r.id)).toEqual(["eight", "nine"]);
  });

  it("skips high scores without a written comment to quote", () => {
    const picked = pickHighlightedReviews([
      review("silent-10", "6 Jul 2026", 10, { quotable: false }),
      review("quoted-9", "1 Jan 2026", 9),
    ]);
    expect(picked.map((r) => r.id)).toEqual(["quoted-9"]);
  });

  it("picks the two newest quotable legacy reviews when there are no direct ones", () => {
    expect(pickHighlightedReviews(guestReviews).map((r) => r.id)).toEqual([
      "booking-2026-04-22",
      "booking-2026-01-22",
    ]);
  });
});
