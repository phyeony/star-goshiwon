import type { Review } from "./types";

export type GuestReview = {
  id: string;
  date: string;
  score: number;
  title: string;
  guest: string;
  country: string;
  roomType: string;
  basicCategories?: ReviewCategoryScore[];
  additionalCategories?: ReviewCategoryScore[];
  positive?: string;
  negative?: string;
  language?: "en" | "ja" | "de";
  source?: "booking" | "direct";
};

export type ReviewCategoryScore = {
  label: string;
  score: number;
};

export const bookingReviewSummary = {
  source:
    "Guest reviews from verified Booking.com stays in 2025-2026. Our property is not currently listed on Booking.com, so new bookings are handled directly.",
  scoreLabel: "Booking.com review score",
  scoredStayCount: 6,
  averageScore: 7.5,
  weightedCalculationSince: "23 Jan 2025",
  scoreCounts: {
    superb: 3,
    good: 1,
    average: 0,
    poor: 2,
    veryPoor: 0,
  },
};

export const basicReviewCategories: ReviewCategoryScore[] = [
  { label: "Cleanliness", score: 6.7 },
  { label: "Comfort", score: 7.3 },
  { label: "Staff", score: 8.0 },
  { label: "Facilities", score: 6.8 },
  { label: "Location", score: 8.6 },
  { label: "Value for money", score: 8.7 },
];

export const additionalReviewCategories: ReviewCategoryScore[] = [
  { label: "Room view", score: 10 },
  { label: "WiFi", score: 10 },
  { label: "Bed rating", score: 8.8 },
];

export const guestReviews: GuestReview[] = [
  {
    id: "booking-2026-05-07",
    date: "7 May 2026",
    score: 10,
    title: "Perfect score from a solo guest",
    guest: "Mateusz Brzoza",
    country: "GB",
    roomType: "Private Shower Room",
    basicCategories: [
      { label: "Staff", score: 10 },
      { label: "Cleanliness", score: 10 },
      { label: "Location", score: 10 },
      { label: "Facilities", score: 10 },
      { label: "Comfort", score: 10 },
      { label: "Value for money", score: 10 },
    ],
  },
  {
    id: "booking-2026-04-22",
    date: "22 Apr 2026",
    score: 10,
    title: "Not the Ritz Carlton but a beautiful view",
    guest: "Andrew OBrien",
    country: "US",
    roomType: "Private Shower Room",
    basicCategories: [
      { label: "Staff", score: 10 },
      { label: "Cleanliness", score: 7.5 },
      { label: "Location", score: 10 },
      { label: "Facilities", score: 7.5 },
      { label: "Comfort", score: 7.5 },
      { label: "Value for money", score: 10 },
    ],
    additionalCategories: [
      { label: "WiFi", score: 10 },
      { label: "Bed rating", score: 7.5 },
      { label: "Room view", score: 10 },
    ],
    positive:
      "Lovely goshiwon in a quiet neighborhood with cheap food and scenic parks nearby. The view makes it feel like a luxury penthouse :) comfortable chair and desk for working.",
    negative:
      "It’s a goshiwon so occasional noise is to be expected, shared bathroom as expected. No problem for me.",
    language: "en",
  },
  {
    id: "booking-2026-03-05",
    date: "5 Mar 2026",
    score: 7,
    title: "Good value for money",
    guest: "Leonardo Feijo Sampaio",
    country: "BR",
    roomType: "Economy Room",
    basicCategories: [
      { label: "Staff", score: 7.5 },
      { label: "Cleanliness", score: 7.5 },
      { label: "Location", score: 7.5 },
      { label: "Facilities", score: 7.5 },
      { label: "Comfort", score: 7.5 },
      { label: "Value for money", score: 10 },
    ],
  },
  {
    id: "booking-2026-01-25",
    date: "25 Jan 2026",
    score: 3,
    title: "Low facilities and comfort score",
    guest: "Yerminson Velarde",
    country: "CO",
    roomType: "Economy Room",
    basicCategories: [
      { label: "Staff", score: 5 },
      { label: "Cleanliness", score: 5 },
      { label: "Location", score: 5 },
      { label: "Facilities", score: 2.5 },
      { label: "Comfort", score: 2.5 },
      { label: "Value for money", score: 5 },
    ],
  },
  {
    id: "booking-2026-01-22",
    date: "22 Jan 2026",
    score: 9,
    title: "The view from the window is amazing",
    guest: "Tatsuru Nitta",
    country: "JP",
    roomType: "Private Shower Room",
    basicCategories: [
      { label: "Staff", score: 10 },
      { label: "Cleanliness", score: 5 },
      { label: "Location", score: 10 },
      { label: "Facilities", score: 7.5 },
      { label: "Comfort", score: 10 },
      { label: "Value for money", score: 10 },
    ],
    additionalCategories: [{ label: "Bed rating", score: 10 }],
    positive:
      "The view from our room on the 7th floor was absolutely stunning. If you do not mind the boys-only dormitory-like atmosphere, it is a comfortable place.",
    negative: "It is true that it lacks cleanliness, but it feels relaxed.",
    language: "ja",
  },
  {
    id: "booking-2025-04-21",
    date: "21 Apr 2025",
    score: 4,
    title: "Nice location, mixed stay",
    guest: "Jules Dion",
    country: "DE",
    roomType: "Private Shower Room",
    basicCategories: [
      { label: "Staff", score: 2.5 },
      { label: "Cleanliness", score: 2.5 },
      { label: "Location", score: 10 },
      { label: "Facilities", score: 5 },
      { label: "Comfort", score: 5 },
      { label: "Value for money", score: 5 },
    ],
    positive:
      "The location was very good. The soups were fine. The rice cookers were quite worn out.",
    negative:
      "The bathrooms and showers were dirty and disgusting. There is no soap in the bathroom and the toilets, it seems, are never cleaned.",
    language: "de",
  },
];

export const highlightedGuestReviews = guestReviews.filter((review) =>
  ["booking-2026-04-22", "booking-2026-01-22"].includes(review.id),
);

// Maps an approved DB review (submitted via an admin-minted invite link) onto
// the display shape the legacy hardcoded Booking.com reviews use. The date
// format matches the legacy strings so parseReviewDate sorting keeps working.
export function dbReviewToGuestReview(review: Review): GuestReview {
  return {
    id: review.id,
    date: new Date(review.submitted_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Seoul",
    }),
    score: review.score,
    title: review.title ?? "Review from a verified direct stay",
    guest: review.guest_name,
    country: review.country ?? "",
    roomType: review.room_type,
    basicCategories: review.basic_categories,
    additionalCategories: review.additional_categories,
    positive: review.positive ?? undefined,
    negative: review.negative ?? undefined,
    source: "direct",
  };
}
