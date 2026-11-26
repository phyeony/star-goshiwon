// The one message we send first: 30 minutes after a booking request, to
// guests who gave a WhatsApp number, ticked the opt-in and haven't written
// to us (spec §1.1; owner's choice 2026-11-26).
//
// It never asks for ID: WhatsApp's Business Messaging Policy forbids asking
// people to share ID on WhatsApp (an earlier version asked for a passport
// photo and the account was disabled). Identity checks go through a secure
// link on the website. The men-only question is left out once the chat has
// recorded the answer. A guest who has written in the last 24 hours gets
// nothing (they're already talking to us); everyone else gets a Meta
// "utility" template, whose text must be approved in WhatsApp Manager first.
// The booking route queues it (runtime.ts, scheduleBookingFollowup). Until
// WHATSAPP_BOOKING_TEMPLATE names the approved base template, nothing is sent.
//
// The chat is created already linked to the booking, with the men-only
// question marked as asked when it was in the message, so the agent reads
// the guest's reply in context.

import type { MenOnlyState } from "@/lib/whatsapp-agent/types";

const INTRO =
  "Hi {{1}}, thanks for your booking request at Star Goshiwon! We received it for {{2}}, {{3}} to {{4}}.";
const NEXT = "The manager will review it and get back to you here.";
const MEN_ONLY = "One quick question: Star Goshiwon is for men only at the moment. Could you confirm you're male?";
const QUESTIONS = "You can also reply with any questions.";

export type BookingVariant = "basic" | "ask_men_only";

/**
 * Text to submit in WhatsApp Manager for each variant (category Utility,
 * language English). {{1}} guest name, {{2}} room, {{3}} check-in, {{4}}
 * check-out. Kept here so the stored chat history shows what the guest got.
 */
export const BOOKING_RECEIVED_TEXTS: Record<BookingVariant, string> = {
  basic: `${INTRO}\n\n${NEXT} ${QUESTIONS}`,
  ask_men_only: `${INTRO}\n\n${NEXT}\n\n${MEN_ONLY} ${QUESTIONS}`,
};

/** booking_request_received, booking_request_received_ask_men_only */
export function templateNameFor(base: string, variant: BookingVariant): string {
  return variant === "basic" ? base : `${base}_${variant}`;
}

/** What the chat for this number already shows; null when there's no chat. */
export interface ChatSoFar {
  menOnlyState: MenOnlyState;
  /** ISO time of the guest's latest message, or null. */
  lastGuestMessageAt: string | null;
}

// How long after the booking request we look at the chat (owner's choice,
// 2026-11-26): a guest who wrote to us by then doesn't need the template.
export const BOOKING_FOLLOWUP_DELAY_SECONDS = 30 * 60;

// Meta's window is 24 h from the guest's last message. A guest who wrote
// inside it is already talking to us, and the manager can reply for free.
const RECENT_CHAT_MS = 24 * 60 * 60 * 1000;

export type BookingPlan =
  | { send: false; reason: "not_eligible" | "guest_messaged" }
  | { send: true; variant: BookingVariant; asksMenOnly: boolean };

export function planBookingReceived(chat: ChatSoFar | null, now: Date): BookingPlan {
  if (chat?.menOnlyState === "not_eligible") return { send: false, reason: "not_eligible" };
  const last = chat?.lastGuestMessageAt ? Date.parse(chat.lastGuestMessageAt) : NaN;
  if (!Number.isNaN(last) && now.getTime() - last < RECENT_CHAT_MS) return { send: false, reason: "guest_messaged" };
  const askMenOnly = chat?.menOnlyState !== "confirmed";
  return { send: true, variant: askMenOnly ? "ask_men_only" : "basic", asksMenOnly: askMenOnly };
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
  /** Base template name; the men-only variant adds _ask_men_only. */
  templateName: string;
  language: string;
  chatSoFar(waPhone: string): Promise<ChatSoFar | null>;
  send(to: string, template: { name: string; language: string; bodyParams: string[] }): Promise<string>;
  /** Links the chat to the booking and stores the sent message. */
  record(args: {
    waPhone: string;
    bookingId: string;
    waMessageId: string;
    body: string;
    messageType: "template";
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

export function renderBookingReceived(params: string[], variant: BookingVariant = "basic"): string {
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
  const waMessageId = await deps.send(to, {
    name: templateNameFor(deps.templateName, plan.variant),
    language: deps.language,
    bodyParams: params,
  });
  await deps.record({
    waPhone: to,
    bookingId: input.bookingId,
    waMessageId,
    body,
    messageType: "template",
    asksMenOnly: plan.asksMenOnly,
    sentAt: now,
  });
  return plan;
}
