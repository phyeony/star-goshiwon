import { describe, expect, it } from "vitest";
import { validateReviewSubmission } from "./review-validation";

const base = {
  guest_name: "Test Guest",
  country: "GB",
  score: 9,
  title: "Great stay",
  positive: "Nice view",
  negative: null,
  basic_categories: [{ label: "Staff", score: 10 }],
  additional_categories: [{ label: "WiFi", score: 7.5 }],
};

describe("validateReviewSubmission", () => {
  it("accepts a full valid submission", () => {
    const result = validateReviewSubmission(base);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.score).toBe(9);
      expect(result.value.basic_categories).toEqual([
        { label: "Staff", score: 10 },
      ]);
    }
  });

  it("accepts score-only submissions (everything else optional)", () => {
    const result = validateReviewSubmission({
      guest_name: "Min Guest",
      score: 8,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        guest_name: "Min Guest",
        country: null,
        score: 8,
        title: null,
        positive: null,
        negative: null,
        basic_categories: [],
        additional_categories: [],
      });
    }
  });

  it("trims strings and turns empty strings into null", () => {
    const result = validateReviewSubmission({
      ...base,
      country: "  ",
      title: " Great stay ",
      positive: "",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.country).toBeNull();
      expect(result.value.title).toBe("Great stay");
      expect(result.value.positive).toBeNull();
    }
  });

  it("rejects a missing or blank guest name", () => {
    expect(validateReviewSubmission({ ...base, guest_name: "  " }).ok).toBe(false);
    expect(validateReviewSubmission({ ...base, guest_name: undefined }).ok).toBe(false);
  });

  it("rejects non-integer or out-of-range scores", () => {
    for (const score of [0, 11, 7.5, "9", NaN, undefined]) {
      expect(validateReviewSubmission({ ...base, score }).ok).toBe(false);
    }
  });

  it("requires a comment when the score is 3 or lower", () => {
    const low = { ...base, score: 3, positive: null, negative: null, title: null };
    const rejected = validateReviewSubmission(low);
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) expect(rejected.error).toMatch(/comment/i);
    expect(
      validateReviewSubmission({ ...low, negative: "Too noisy" }).ok
    ).toBe(true);
  });

  it("rejects unknown category labels and off-scale category scores", () => {
    expect(
      validateReviewSubmission({
        ...base,
        basic_categories: [{ label: "Vibes", score: 10 }],
      }).ok
    ).toBe(false);
    expect(
      validateReviewSubmission({
        ...base,
        basic_categories: [{ label: "Staff", score: 6 }],
      }).ok
    ).toBe(false);
    expect(
      validateReviewSubmission({
        ...base,
        additional_categories: [{ label: "Staff", score: 10 }],
      }).ok
    ).toBe(false); // Staff is a basic label, not an additional one
  });

  it("rejects duplicate category labels", () => {
    expect(
      validateReviewSubmission({
        ...base,
        basic_categories: [
          { label: "Staff", score: 10 },
          { label: "Staff", score: 5 },
        ],
      }).ok
    ).toBe(false);
  });

  it("rejects over-length fields", () => {
    expect(
      validateReviewSubmission({ ...base, guest_name: "x".repeat(81) }).ok
    ).toBe(false);
    expect(
      validateReviewSubmission({ ...base, title: "x".repeat(121) }).ok
    ).toBe(false);
    expect(
      validateReviewSubmission({ ...base, positive: "x".repeat(2001) }).ok
    ).toBe(false);
  });
});
