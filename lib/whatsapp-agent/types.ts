import { z } from "zod";
import type { BookingStatus } from "@/lib/types";

// What a guest's message is about. The model labels each turn with one or
// more of these; code (decide.ts) turns the labels into send / draft / skip.
export const CATEGORIES = [
  "pricing", // rates, totals for dates, deposit, bedding
  "location", // address, directions, transport, nearby places
  "rules", // house rules, check-in/out, amenities, FAQ / policy content
  "booking_how_to", // how to request a booking, what happens next
  "availability", // "is a room free for these dates?"
  "men_only", // confirming / declining / asking about the men-only rule
  "booking_status", // "is my booking confirmed?", payment received?
  "discount", // anything beyond the published long-stay discount
  "group", // several rooms for a group
  "viewing", // seeing the room before booking
  "short_stay", // fewer than 7 nights — always declined (minimum stay rule)
  "special_request", // early/late/same-day check-in, cash, paying in parts
  "complaint", // problems in the room, noise, broken things
  "residence_document", // residence confirmation for immigration / visa
  "media", // photo, voice note, location, document
  "smalltalk", // greetings, thanks, "ok" — nothing to answer
  "other", // not covered by the knowledge pack
] as const;
export type Category = (typeof CATEGORIES)[number];

export type MenOnlyState = "unasked" | "asked" | "confirmed" | "not_eligible";
export type BotState = "active" | "paused_by_manager" | "off";
export type Mode = "off" | "shadow" | "live";
export type MenOnlySignal = "confirmed" | "declined" | "none";

// Step 1 output: what the guest wants. No reply text here — the reply is
// written in step 2, after code has looked up prices and availability.
export const understandingSchema = z.object({
  categories: z.array(z.enum(CATEGORIES)).min(1),
  needs_human: z.boolean(),
  men_only_signal: z.enum(["confirmed", "declined", "none"]),
  guest_language: z.enum(["en", "ko", "other"]),
  room_slug: z.string().nullable(),
  check_in: z.string().nullable(), // YYYY-MM-DD
  check_out: z.string().nullable(), // YYYY-MM-DD
  reason_ko: z.string(),
  summary_ko: z.string(),
  guest_message_ko: z.string(),
});
export type Understanding = z.infer<typeof understandingSchema>;

export const replySchema = z.object({ reply: z.string() });

export interface LinkedBooking {
  status: BookingStatus;
  check_in_date: string;
  check_out_date: string;
  room_name: string | null;
}

export interface ConversationState {
  menOnlyState: MenOnlyState;
  botState: BotState;
  // No conversation row existed before this message.
  isFirstContact: boolean;
  linkedBooking: LinkedBooking | null;
}

export interface AgentSettings {
  mode: Mode;
  // Per-category switch. A category that is off is always drafted.
  autoSend: Partial<Record<Category, boolean>>;
}

export interface GuestMessage {
  from: "guest" | "bot" | "manager";
  text: string;
  // Only guest messages since the last reply are "pending".
  pending?: boolean;
}
