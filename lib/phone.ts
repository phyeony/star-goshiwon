// Phone numbers as WhatsApp knows them: E.164, "+" then 8–15 digits.
// Guests type numbers every way ("+44 7700 900123", "0044…", "010-1234-5678"),
// so the booking form's WhatsApp number is normalised before it is stored.
// A chat is linked to a booking when Meta's sender number (digits only)
// equals the stored number without the "+".

/**
 * Returns the number as "+<digits>", or null when it can't be one.
 * Without "+" or "00", only Korean numbers starting with 0 are accepted
 * (010-1234-5678 → +821012345678); anything else needs its country code.
 */
export function normalizeE164(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/[^\d+\s\-().]/.test(trimmed)) return null;

  let digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.indexOf("+") > 0 || (digits.match(/\+/g) ?? []).length > 1) return null;

  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `82${digits.slice(1)}`;
  else return null;

  // Some people keep the trunk 0 after the country code: +82 010… → +8210…
  if (digits.startsWith("820")) digits = `82${digits.slice(3)}`;

  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
}
