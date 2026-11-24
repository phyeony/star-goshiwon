import {
  BEDDING_FEE_USD,
  calculateEstimate,
  formatUSD,
} from "@/lib/pricing";
import { MIN_STAY_NIGHTS } from "@/lib/validation";
import type { Room, RoomUnitWithBlocks } from "@/lib/types";

// Read-only lookups the agent's reply may rely on. They are run by code
// (not called by the model) once step 1 has pulled a room and dates out of
// the guest's message, so every price a guest sees comes from
// calculateEstimate.

export type QuoteRoom = Pick<
  Room,
  "name" | "slug" | "nightly_rate_usd" | "long_stay_discount"
>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type Quote =
  | {
      ok: true;
      room: string;
      checkIn: string;
      checkOut: string;
      nights: number;
      nightlyUsd: number;
      roomTotalUsd: number;
      longStayDiscountUsd: number;
      depositUsd: number;
      beddingUsd: number;
      totalUsd: number;
      text: string;
    }
  | { ok: false; reason: "unknown_room" | "bad_dates" | "past" | "too_short" };

export function getQuote(
  rooms: QuoteRoom[],
  slug: string,
  checkIn: string,
  checkOut: string,
  today: string,
): Quote {
  const room = rooms.find((r) => r.slug === slug);
  if (!room) return { ok: false, reason: "unknown_room" };
  if (!ISO_DATE.test(checkIn) || !ISO_DATE.test(checkOut)) {
    return { ok: false, reason: "bad_dates" };
  }
  if (checkIn < today) return { ok: false, reason: "past" };
  const est = calculateEstimate(
    { nightly: room.nightly_rate_usd, discount: room.long_stay_discount },
    checkIn,
    checkOut,
  );
  if (est.nights <= 0) return { ok: false, reason: "bad_dates" };
  if (est.nights < MIN_STAY_NIGHTS) return { ok: false, reason: "too_short" };

  const roomTotal = est.nightsSubtotal - est.discount;
  // USD only and short: the manager found the KRW figures made quotes hard
  // to read (2026-11-21 feedback). The final total leads.
  const lines = [
    `${room.name}, ${checkIn} to ${checkOut} (${est.label}):`,
    `Total ${formatUSD(est.total)}, prepaid via PayPal.`,
    `That's ${formatUSD(roomTotal)} for the room` +
      (est.discountApplied
        ? ` (after the ${Math.round(Number(room.long_stay_discount) * 100)}% long-stay discount)`
        : ` (${formatUSD(est.nightlyRate)} per night)`) +
      ` + a ${formatUSD(est.deposit)} deposit, refunded after check-out.`,
    `Optional bedding set: +${formatUSD(BEDDING_FEE_USD)}.`,
  ];
  return {
    ok: true,
    room: room.name,
    checkIn,
    checkOut,
    nights: est.nights,
    nightlyUsd: est.nightlyRate,
    roomTotalUsd: roomTotal,
    longStayDiscountUsd: est.discount,
    depositUsd: est.deposit,
    beddingUsd: BEDDING_FEE_USD,
    totalUsd: est.total,
    text: lines.join("\n"),
  };
}

export interface AvailabilityCount {
  room: string;
  slug: string;
  free: number;
}

// Counts only — unit names (room numbers) never leave this function.
export async function checkAvailability(
  rooms: (QuoteRoom & { id: string })[],
  getUnits: (
    roomId: string,
    checkIn: string,
    checkOut: string,
  ) => Promise<RoomUnitWithBlocks[]>,
  checkIn: string,
  checkOut: string,
): Promise<AvailabilityCount[]> {
  return Promise.all(
    rooms.map(async (room) => {
      const units = await getUnits(room.id, checkIn, checkOut);
      return {
        room: room.name,
        slug: room.slug,
        free: units.filter((u) => u.room_unit_blocks.length === 0).length,
      };
    }),
  );
}

/**
 * The room page, or the general request page. With dates (from a quote that
 * passed), the room page's form opens with those dates already picked.
 * The guest's number is deliberately not in the link: page URLs go to analytics.
 */
export function bookingLink(
  siteUrl: string,
  slug?: string | null,
  dates?: { checkIn: string; checkOut: string } | null,
): string {
  const base = siteUrl.replace(/\/$/, "");
  if (!slug) return `${base}/request-to-book`;
  if (!dates) return `${base}/rooms/${slug}`;
  return `${base}/rooms/${slug}?check_in=${dates.checkIn}&check_out=${dates.checkOut}#book`;
}
