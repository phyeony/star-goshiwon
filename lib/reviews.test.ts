import { describe, expect, it } from "vitest";
import { dbReviewToGuestReview } from "./reviews";
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
