// Guest-facing text that carries the verification link. Deliberately says
// "booking verification", never "passport" or "ID": WhatsApp's Business
// Messaging Policy forbids asking people to share ID in the chat. The page
// behind the link explains what is asked and why.
export function verificationMessage(url: string): string {
  return `To finish your booking request, please complete the booking verification on our website:\n${url}\n\nIt takes about a minute.`;
}

/** For a guest who sent a photo or document in the chat: use the page instead. */
export function linkInsteadMessage(url: string): string {
  return `Thanks! For your privacy, please don't send documents or photos here in the chat. Please use our secure booking verification page instead:\n${url}`;
}
