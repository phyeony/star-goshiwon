// Approval waits for the guest's booking verification (owner's choice,
// 2026-11-26): the manager checks the ID photo, including the sex shown on
// it, before sending the payment link. Korean-site requests don't use the
// photo check. The manager can still approve without it, explicitly.

export interface GateInput {
  locale?: string | null;
  passport_checked_at?: string | null;
}

export function needsVerification(r: GateInput): boolean {
  return r.locale !== "ko" && !r.passport_checked_at;
}
