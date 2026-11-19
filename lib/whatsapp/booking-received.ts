// The one message we send first: right after a booking request, to guests
// who gave a WhatsApp number and ticked the opt-in (spec §1.1). It is a Meta
// "utility" template, so its text must be approved in WhatsApp Manager first;
// until WHATSAPP_BOOKING_TEMPLATE names the approved template, nothing is sent.
//
// The chat is created already linked to the booking, with the men-only
// question marked as asked, so the agent reads the guest's reply in context.

/**
 * Text to submit in WhatsApp Manager (category Utility, language English).
 * {{1}} guest name, {{2}} room, {{3}} check-in, {{4}} check-out.
 * Kept here so the stored chat history shows what the guest received.
 */
export const BOOKING_RECEIVED_TEMPLATE_TEXT =
  "Hi {{1}}, thanks for your booking request at Star Goshiwon! We received it for {{2}}, {{3}} to {{4}}.\n\n" +
  "The manager will check availability and get back to you soon.\n\n" +
  "One quick question: Star Goshiwon is for men only at the moment. Could you confirm you're male? " +
  "You can also reply here with any questions.";

export interface BookingReceivedInput {
  bookingId: string;
  guestName: string;
  roomName: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string;
  whatsappNumber: string; // E.164, "+447700900123"
}

export interface BookingReceivedDeps {
  templateName: string;
  language: string;
  send(to: string, template: { name: string; language: string; bodyParams: string[] }): Promise<string>;
  /** Links the chat to the booking and stores the sent message. */
  record(args: { waPhone: string; bookingId: string; waMessageId: string; body: string; sentAt: Date }): Promise<void>;
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

export function renderBookingReceived(params: string[]): string {
  return BOOKING_RECEIVED_TEMPLATE_TEXT.replace(/\{\{(\d)\}\}/g, (_, n: string) => params[Number(n) - 1] ?? "");
}

export async function sendBookingReceived(deps: BookingReceivedDeps, input: BookingReceivedInput, now = new Date()) {
  const params = bookingReceivedParams(input);
  const to = input.whatsappNumber.replace(/^\+/, "");
  const waMessageId = await deps.send(to, { name: deps.templateName, language: deps.language, bodyParams: params });
  await deps.record({
    waPhone: to,
    bookingId: input.bookingId,
    waMessageId,
    body: renderBookingReceived(params),
    sentAt: now,
  });
}
