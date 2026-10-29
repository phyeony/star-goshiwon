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
  /** YYYY-MM-DD stay dates, when the guest's stay is on our website. */
  stayedFrom?: string;
  stayedTo?: string;
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

// Reviews featured in the home / room-page review sections: the most recent
// ones scoring 8 or higher. A written comment is required too — the cards quote it,
// and a score-only review would render as "left a score without comments".
export const HIGHLIGHT_MIN_SCORE = 8;

export function pickHighlightedReviews(
  reviews: GuestReview[],
  count = 2,
): GuestReview[] {
  return reviews
    .filter(
      (review) =>
        review.score >= HIGHLIGHT_MIN_SCORE && Boolean(review.positive),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
}

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
    ...(review.stay_check_in && review.stay_check_out
      ? { stayedFrom: review.stay_check_in, stayedTo: review.stay_check_out }
      : {}),
  };
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function parseIsoDate(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return { year, month, day };
}

export function stayNights(from: string, to: string): number {
  const a = parseIsoDate(from);
  const b = parseIsoDate(to);
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) -
      Date.UTC(a.year, a.month - 1, a.day)) /
      86_400_000,
  );
}

/** "3 – 30 May 2026", "28 Apr – 2 Jun 2026", "28 Dec 2025 – 2 Jan 2026". */
export function formatStayRange(from: string, to: string): string {
  const a = parseIsoDate(from);
  const b = parseIsoDate(to);
  const end = `${b.day} ${MONTHS[b.month - 1]} ${b.year}`;
  if (a.year !== b.year) {
    return `${a.day} ${MONTHS[a.month - 1]} ${a.year} – ${end}`;
  }
  if (a.month !== b.month) return `${a.day} ${MONTHS[a.month - 1]} – ${end}`;
  return `${a.day} – ${end}`;
}

/** "Stayed 3 – 30 May 2026 · 27 nights", or null when the stay isn't known. */
export function formatStayLabel(review: GuestReview): string | null {
  if (!review.stayedFrom || !review.stayedTo) return null;
  const nights = stayNights(review.stayedFrom, review.stayedTo);
  return `Stayed ${formatStayRange(review.stayedFrom, review.stayedTo)} · ${nights} ${
    nights === 1 ? "night" : "nights"
  }`;
}

export type KnownStay = {
  guestName: string;
  checkIn: string;
  checkOut: string;
};

export function normalizeGuestName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * The guest's stay on our website: matched on the full guest name — at least
 * two words, so a lone first name can't pick up someone else's stay — taking
 * the latest stay that started on or before `onOrBefore` (YYYY-MM-DD).
 */
export function findKnownStay(
  guestName: string,
  onOrBefore: string,
  stays: KnownStay[],
): KnownStay | null {
  const name = normalizeGuestName(guestName);
  if (!name.includes(" ")) return null;
  return (
    stays
      .filter(
        (stay) =>
          normalizeGuestName(stay.guestName) === name &&
          stay.checkIn <= onOrBefore,
      )
      .sort((a, b) => b.checkIn.localeCompare(a.checkIn))[0] ?? null
  );
}

/**
 * Fills in stay dates for reviews that don't carry them (the legacy
 * Booking.com ones, and direct reviews whose invite had none) from stays on
 * our website.
 */
export function attachKnownStays(
  reviews: GuestReview[],
  stays: KnownStay[],
): GuestReview[] {
  return reviews.map((review) => {
    if (review.stayedFrom && review.stayedTo) return review;
    // Review dates are "7 May 2026" strings with no time, so local parts are
    // the calendar date.
    const reviewedOn = new Date(review.date);
    if (Number.isNaN(reviewedOn.getTime())) return review;
    const reviewedIso = [
      reviewedOn.getFullYear(),
      String(reviewedOn.getMonth() + 1).padStart(2, "0"),
      String(reviewedOn.getDate()).padStart(2, "0"),
    ].join("-");
    const match = findKnownStay(review.guest, reviewedIso, stays);
    if (!match) return review;
    return { ...review, stayedFrom: match.checkIn, stayedTo: match.checkOut };
  });
}
