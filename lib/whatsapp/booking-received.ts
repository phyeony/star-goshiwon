// The one message we send first: right after a booking request, to guests
// who gave a WhatsApp number and ticked the opt-in (spec §1.1).
//
// It leaves out what the chat already covers: the passport line once the
// guest has sent a photo or file, the men-only question once they've said
// they're male. A guest who has written in the last 24 hours gets it as a
// normal (free) text; everyone else gets one of four Meta "utility"
// templates, whose text must be approved in WhatsApp Manager first. Until
// WHATSAPP_BOOKING_TEMPLATE names the approved base template, nothing is sent.
//
// The chat is created already linked to the booking, with the men-only
// question marked as asked when it was in the message, so the agent reads
// the guest's reply in context.

import type { MenOnlyState } from "@/lib/whatsapp-agent/types";

const INTRO =
  "Hi {{1}}, thanks for your booking request at Star Goshiwon! We received it for {{2}}, {{3}} to {{4}}.";
const PASSPORT = "To decide on your request, the manager needs a clear photo of your passport. Please send it here.";
const MEN_ONLY = "One quick question: Star Goshiwon is for men only at the moment. Could you confirm you're male?";
const QUESTIONS = "You can also reply here with any questions.";
const BASIC = "The manager will review it and get back to you here. You can also reply with any questions.";

export type BookingVariant = "full" | "no_passport" | "no_men_only" | "basic";

/**
 * Text to submit in WhatsApp Manager for each variant (category Utility,
 * language English). {{1}} guest name, {{2}} room, {{3}} check-in, {{4}}
 * check-out. Kept here so the stored chat history shows what the guest got.
 */
export const BOOKING_RECEIVED_TEXTS: Record<BookingVariant, string> = {
  full: `${INTRO}\n\n${PASSPORT}\n\n${MEN_ONLY} ${QUESTIONS}`,
  no_passport: `${INTRO}\n\n${MEN_ONLY} ${QUESTIONS}`,
  no_men_only: `${INTRO}\n\n${PASSPORT} ${QUESTIONS}`,
  basic: `${INTRO}\n\n${BASIC}`,
};

/** The full message, as first submitted. */
export const BOOKING_RECEIVED_TEMPLATE_TEXT = BOOKING_RECEIVED_TEXTS.full;

/** booking_received, booking_received_no_passport, … */
export function templateNameFor(base: string, variant: BookingVariant): string {
  return variant === "full" ? base : `${base}_${variant}`;
}

/** What the chat for this number already shows; null when there's no chat. */
export interface ChatSoFar {
  menOnlyState: MenOnlyState;
  /** The guest has sent a photo or a file (taken to be the passport). */
  sentPhotoOrFile: boolean;
  /** ISO time of the guest's latest message, or null. */
  lastGuestMessageAt: string | null;
}

// Meta's window is 24 h from the guest's last message; keep a margin so a
// send that takes a moment doesn't land just after it closes.
const FREE_TEXT_WINDOW_MS = 24 * 60 * 60 * 1000 - 10 * 60 * 1000;

export type BookingPlan =
  | { send: false; reason: "not_eligible" }
  | { send: true; variant: BookingVariant; as: "text" | "template"; asksMenOnly: boolean };

export function planBookingReceived(chat: ChatSoFar | null, now: Date): BookingPlan {
  if (chat?.menOnlyState === "not_eligible") return { send: false, reason: "not_eligible" };
  const askPassport = !chat?.sentPhotoOrFile;
  const askMenOnly = chat?.menOnlyState !== "confirmed";
  const variant: BookingVariant =
    askPassport && askMenOnly ? "full" : askMenOnly ? "no_passport" : askPassport ? "no_men_only" : "basic";
  const last = chat?.lastGuestMessageAt ? Date.parse(chat.lastGuestMessageAt) : NaN;
  const inWindow = !Number.isNaN(last) && now.getTime() - last < FREE_TEXT_WINDOW_MS;
  return { send: true, variant, as: inWindow ? "text" : "template", asksMenOnly: askMenOnly };
}

export interface BookingReceivedInput {
  bookingId: string;
  guestName: string;
  roomName: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string;
  whatsappNumber: string; // E.164, "+447700900123"
}

export interface BookingReceivedDeps {
  /** Base template name; the other variants add _no_passport etc. */
  templateName: string;
  language: string;
  chatSoFar(waPhone: string): Promise<ChatSoFar | null>;
  send(to: string, template: { name: string; language: string; bodyParams: string[] }): Promise<string>;
  sendText(to: string, text: string): Promise<string>;
  /** Links the chat to the booking and stores the sent message. */
  record(args: {
    waPhone: string;
    bookingId: string;
    waMessageId: string;
    body: string;
    messageType: "template" | "text";
    asksMenOnly: boolean;
    sentAt: Date;
  }): Promise<void>;
}

/** "2026-12-01" → "1 Dec 2026". */
export function formatStayDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

// Meta rejects parameters with newlines, tabs or more than 4 spaces in a row.
function param(value: string, max = 60): string {
  const clean = value.replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim();
  return clean.slice(0, max) || "-";
}

export function bookingReceivedParams(input: BookingReceivedInput): string[] {
  return [
    param(input.guestName.trim().split(/\s+/)[0] ?? "", 40),
    param(input.roomName),
    formatStayDate(input.checkIn),
    formatStayDate(input.checkOut),
  ];
}

export function renderBookingReceived(params: string[], variant: BookingVariant = "full"): string {
  return BOOKING_RECEIVED_TEXTS[variant].replace(/\{\{(\d)\}\}/g, (_, n: string) => params[Number(n) - 1] ?? "");
}

export async function sendBookingReceived(
  deps: BookingReceivedDeps,
  input: BookingReceivedInput,
  now = new Date(),
): Promise<BookingPlan> {
  const to = input.whatsappNumber.replace(/^\+/, "");
  const plan = planBookingReceived(await deps.chatSoFar(to), now);
  if (!plan.send) return plan;

  const params = bookingReceivedParams(input);
  const body = renderBookingReceived(params, plan.variant);
  const waMessageId =
    plan.as === "text"
      ? await deps.sendText(to, body)
      : await deps.send(to, {
          name: templateNameFor(deps.templateName, plan.variant),
          language: deps.language,
          bodyParams: params,
        });
  await deps.record({
    waPhone: to,
    bookingId: input.bookingId,
    waMessageId,
    body,
    messageType: plan.as,
    asksMenOnly: plan.asksMenOnly,
    sentAt: now,
  });
  return plan;
}
