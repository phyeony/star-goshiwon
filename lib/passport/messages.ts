// Guest-facing text that carries the verification link. Deliberately says
// "booking verification", never "passport" or "ID": WhatsApp's Business
// Messaging Policy forbids asking people to share ID in the chat. The page
// behind the link explains what is asked and why.
export function verificationMessage(url: string): string {
  return `To finish your booking request, please complete the booking verification on our website:\n${url}\n\nIt takes about a minute.`;
}
