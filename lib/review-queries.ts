import { getSupabaseServiceClient } from "./supabase";
import { siteConfig } from "./site-data";
import {
  attachKnownStays,
  dbReviewToGuestReview,
  findKnownStay,
  guestReviews,
  pickHighlightedReviews,
  type GuestReview,
  type KnownStay,
} from "./reviews";
import type {
  Review,
  ReviewInsert,
  ReviewInvite,
  ReviewInviteInsert,
  ReviewStatus,
} from "./types";

// 32 hex chars of Web-Crypto randomness; fine on Cloudflare Workers.
export function generateReviewToken(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

export function reviewInviteUrl(token: string): string {
  return `${siteConfig.url}/review/${token}`;
}

export function isReviewInviteOpen(
  invite: ReviewInvite,
  now: Date = new Date()
): boolean {
  return !invite.used_at && new Date(invite.expires_at) > now;
}

export async function createReviewInvite(
  insert: ReviewInviteInsert
): Promise<ReviewInvite> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("review_invites")
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return data as ReviewInvite;
}

export async function getReviewInviteById(
  id: string
): Promise<ReviewInvite | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("review_invites")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as ReviewInvite) ?? null;
}

export async function getReviewInviteByToken(
  token: string
): Promise<ReviewInvite | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("review_invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  return (data as ReviewInvite) ?? null;
}

export async function getReviewInvites(): Promise<ReviewInvite[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("review_invites")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ReviewInvite[]) ?? [];
}

export async function deleteReviewInvite(id: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("review_invites").delete().eq("id", id);
  if (error) throw error;
}

export async function markReviewInviteUsed(id: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("review_invites")
    .update({ used_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function createReview(insert: ReviewInsert): Promise<Review> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("reviews")
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return data as Review;
}

export async function getReviews(): Promise<Review[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data as Review[]) ?? [];
}

export async function getApprovedReviews(): Promise<Review[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("status", "approved")
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data as Review[]) ?? [];
}

export async function updateReviewStatus(
  id: string,
  status: ReviewStatus
): Promise<Review> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("reviews")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Review;
}

/**
 * Guest stays on our website: room availability blocks plus confirmed or paid
 * booking requests. Used to date reviews that don't carry their own stay.
 */
export async function getKnownStays(): Promise<KnownStay[]> {
  const supabase = getSupabaseServiceClient();
  const [blocks, bookings] = await Promise.all([
    supabase
      .from("room_unit_blocks")
      .select("guest_name, check_in_date, check_out_date")
      .neq("status", "cancelled"),
    supabase
      .from("booking_requests")
      .select("guest_name, check_in_date, check_out_date")
      .or("status.eq.confirmed,payment_status.eq.paid"),
  ]);
  if (blocks.error) throw blocks.error;
  if (bookings.error) throw bookings.error;
  type StayRow = {
    guest_name: string;
    check_in_date: string;
    check_out_date: string;
  };
  return [...(blocks.data ?? []), ...(bookings.data ?? [])]
    .filter(
      (row: StayRow) =>
        row.guest_name && row.check_in_date && row.check_out_date
    )
    .map((row: StayRow) => ({
      guestName: row.guest_name,
      checkIn: row.check_in_date,
      checkOut: row.check_out_date,
    }));
}

/**
 * Approved direct reviews plus the legacy Booking.com ones. Direct reviews
 * whose invite had no stay dates get them from stays on our website; the
 * Booking.com ones are left as they are. A failed stay lookup only drops the
 * stay dates, never the reviews.
 */
export async function getPublicGuestReviews(): Promise<GuestReview[]> {
  const approved = await getApprovedReviews();
  let direct = approved.map(dbReviewToGuestReview);
  if (direct.some((review) => !review.stayedFrom)) {
    try {
      direct = attachKnownStays(direct, await getKnownStays());
    } catch (error) {
      console.error("Guest reviews: stay lookup failed", error);
    }
  }
  return [...direct, ...guestReviews];
}

/**
 * Finds the stay a review invite is for, when the admin didn't enter one: the
 * booking it was made from, else the guest's latest confirmed/paid booking by
 * email, else a room availability block under the guest's full name.
 */
export async function findStayForInvite({
  bookingRequestId,
  guestEmail,
  guestName,
}: {
  bookingRequestId: string | null;
  guestEmail: string | null;
  guestName: string;
}): Promise<{ stay_check_in: string; stay_check_out: string } | null> {
  const supabase = getSupabaseServiceClient();
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Seoul",
  });

  if (bookingRequestId) {
    const { data, error } = await supabase
      .from("booking_requests")
      .select("check_in_date, check_out_date")
      .eq("id", bookingRequestId)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      return {
        stay_check_in: data.check_in_date,
        stay_check_out: data.check_out_date,
      };
    }
  }

  if (guestEmail) {
    const { data, error } = await supabase
      .from("booking_requests")
      .select("check_in_date, check_out_date")
      .ilike("guest_email", guestEmail)
      .or("status.eq.confirmed,payment_status.eq.paid")
      .lte("check_in_date", today)
      .order("check_in_date", { ascending: false })
      .limit(1);
    if (error) throw error;
    if (data?.[0]) {
      return {
        stay_check_in: data[0].check_in_date,
        stay_check_out: data[0].check_out_date,
      };
    }
  }

  const match = findKnownStay(guestName, today, await getKnownStays());
  return match
    ? { stay_check_in: match.checkIn, stay_check_out: match.checkOut }
    : null;
}

/** A current or recent guest the admin can pick when making a review link. */
export type ReviewableGuest = {
  key: string;
  bookingRequestId: string | null;
  guestName: string;
  guestEmail: string | null;
  roomType: string;
  checkIn: string;
  checkOut: string;
  /** Checked in and not yet checked out. */
  current: boolean;
};

// Review links last 90 days, so guests who left longer ago aren't offered.
const REVIEWABLE_DAYS_AFTER_CHECKOUT = 90;

/**
 * Guests staying now or who checked out in the last 90 days: confirmed or
 * paid booking requests, plus off-platform guests from room availability
 * blocks (blocks tied to a booking are covered by the booking). Current
 * guests first, then most recent check-out.
 */
export async function getReviewableGuests(): Promise<ReviewableGuest[]> {
  const supabase = getSupabaseServiceClient();
  const now = new Date();
  const today = now.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const since = new Date(
    now.getTime() - REVIEWABLE_DAYS_AFTER_CHECKOUT * 86_400_000
  ).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

  const [bookings, blocks] = await Promise.all([
    supabase
      .from("booking_requests")
      .select(
        "id, guest_name, guest_email, room_slug, check_in_date, check_out_date, rooms(name)"
      )
      .or("status.eq.confirmed,payment_status.eq.paid")
      .lte("check_in_date", today)
      .gte("check_out_date", since),
    supabase
      .from("room_unit_blocks")
      .select(
        "id, guest_name, check_in_date, check_out_date, room_units(rooms(name))"
      )
      .is("booking_request_id", null)
      .neq("status", "cancelled")
      .neq("guest_name", "")
      .lte("check_in_date", today)
      .gte("check_out_date", since),
  ]);
  if (bookings.error) throw bookings.error;
  if (blocks.error) throw blocks.error;

  // Supabase types embedded rows loosely; normalise one-or-many to one.
  const one = <T,>(value: T | T[] | null | undefined): T | null =>
    Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

  const guests: ReviewableGuest[] = [
    ...(bookings.data ?? []).map((row) => ({
      key: `booking:${row.id}`,
      bookingRequestId: row.id as string,
      guestName: row.guest_name as string,
      guestEmail: (row.guest_email as string) || null,
      roomType:
        one(row.rooms as { name: string } | { name: string }[] | null)?.name ??
        (row.room_slug as string),
      checkIn: row.check_in_date as string,
      checkOut: row.check_out_date as string,
      current: false,
    })),
    ...(blocks.data ?? []).map((row) => {
      const unit = one(
        row.room_units as
          | { rooms: { name: string } | { name: string }[] | null }
          | { rooms: { name: string } | { name: string }[] | null }[]
          | null
      );
      return {
        key: `block:${row.id}`,
        bookingRequestId: null,
        guestName: row.guest_name as string,
        guestEmail: null,
        roomType: one(unit?.rooms)?.name ?? "",
        checkIn: row.check_in_date as string,
        checkOut: row.check_out_date as string,
        current: false,
      };
    }),
  ];

  return guests
    .map((guest) => ({ ...guest, current: guest.checkOut > today }))
    .sort((a, b) =>
      a.current !== b.current
        ? Number(b.current) - Number(a.current)
        : b.checkOut.localeCompare(a.checkOut)
    );
}

/**
 * Highlights for the home and room-page review sections, drawn from approved
 * direct reviews plus the legacy Booking.com ones. Falls back to the legacy
 * set alone if the DB read fails, so a reviews outage can't take down the
 * home page.
 */
export async function getHighlightedGuestReviews(
  count = 2
): Promise<GuestReview[]> {
  let reviews: GuestReview[] = guestReviews;
  try {
    reviews = await getPublicGuestReviews();
  } catch (error) {
    console.error("Highlighted reviews: falling back to legacy reviews", error);
  }
  return pickHighlightedReviews(reviews, count);
}
