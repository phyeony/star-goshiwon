// Facts and fixed wording the agent may use that are not (yet) on the site.
// Approved by the owner on 2026-11-18, from the manager's own preset messages.
// Keep this list short: anything the site states belongs on the site instead.
export const MANAGER_FACTS = [
  "Check-out is at 11 AM. Late check-out costs 5,000 KRW per 30 minutes after 11 AM.",
  "A lost key costs 10,000 KRW. Three towels are provided; a lost towel costs 5,000 KRW each.",
  "Smoking indoors is strictly prohibited; it incurs a 100,000 KRW cleaning fee.",
  "Please take your shoes off in the hallway and inside the room.",
  "The shared kitchen and washing machine are on the 6th floor. The shared bathroom is on the same floor as your room (except rooms with a private bathroom).",
  "Use Naver Map in Korea: Google Maps often gives wrong directions here.",
  "Non-guests may not enter the building. Residents include people studying for exams, so the building must stay quiet.",
  "Rooms are assigned after the booking is confirmed, so the exact room may differ from the photos. Every room has a window with an outside view.",
  "After submitting a booking request on the website, please send a clear photo of your passport here on WhatsApp. Once we've verified it, we email a PayPal payment link.",
  "Payment is due at least 5 days before check-in.",
  "A residence confirmation document (for immigration / visa purposes) can be issued for confirmed guests.",
];

// Asked of every new contact, including guests who ticked the men-only box
// on the booking form. Appended by code, never paraphrased by the model.
export const MEN_ONLY_CHECK =
  "Just to check before anything else: Star Goshiwon is a men-only residence at the moment. Is the stay for a man?";

// Sent when the guest's reply means the men-only rule rules them out.
export const DECLINE_TEXT =
  "Thanks for letting us know, and sorry — Star Goshiwon is men-only at the moment. We're working on a separate floor for women, but it isn't open yet. We hope you find a great place in Seoul!";

// Sent to a confirmed guest who asks for a residence confirmation. The
// manager checks the filled-in document on the admin page and sends it.
export const RESIDENCE_DOCUMENT_PENDING =
  "Sure — we'll prepare your residence confirmation and send it to you shortly.";

// How the agent describes itself when asked whether it is a bot.
export const ASSISTANT_DISCLOSURE =
  "I'm Star Goshiwon's assistant: I answer common questions any time, and the manager personally handles bookings and anything special.";
