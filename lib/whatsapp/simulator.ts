// Test chats that never touch WhatsApp. On staging and in `next dev` the
// admin can type as a guest; the message goes through the same agent,
// guard and admin pages, and replies are saved but not sent.
//
// A simulated chat's number starts with "sim-" (real numbers are digits
// only), and its message ids start with "sim.". graph.ts checks both, so
// nothing addressed to a test chat can ever reach Meta, on any environment.

export const SIM_PHONE_PREFIX = "sim-";
const SIM_ID_PREFIX = "sim.";

export function simulatorEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.STAGING === "true" || env.NODE_ENV === "development";
}

export function isSimulatedPhone(waPhone: string): boolean {
  return waPhone.startsWith(SIM_PHONE_PREFIX);
}

export function isSimulatedMessageId(waMessageId: string): boolean {
  return waMessageId.startsWith(SIM_ID_PREFIX);
}

export function simMessageId(): string {
  return `${SIM_ID_PREFIX}${crypto.randomUUID()}`;
}

/** "Test 3" → "sim-test-3". Keeps letters, digits and dashes. */
export function simPhoneFor(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  return `${SIM_PHONE_PREFIX}${slug || "guest"}`;
}
