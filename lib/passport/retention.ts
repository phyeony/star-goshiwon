// When a guest's passport photo must be deleted, and when the upload link
// still works. Pure functions so the rules are unit-tested.
//
// Rule (agreed with the owner, 2026-11-24): kept until the guest's check-out
// day, then deleted; if the request is declined, expires or is closed first,
// deleted 7 days after that.

import type { BookingStatus } from "@/lib/types";

export const ENDED_STATUSES: readonly BookingStatus[] = ["declined", "expired", "closed"];
export const ENDED_GRACE_DAYS = 7;

export interface RetentionInput {
  status: BookingStatus;
  check_out_date: string; // YYYY-MM-DD, Seoul date
  /** ISO; when the status last changed (set by a DB trigger). */
  status_changed_at?: string | null;
  /** Fallback for rows from before status_changed_at existed. */
  updated_at: string;
}

export type DeleteReason = "checked_out" | "request_ended";

/** Today's date in Seoul as YYYY-MM-DD. */
export function seoulToday(now = new Date()): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function deleteReason(r: RetentionInput, now = new Date()): DeleteReason | null {
  if (r.check_out_date <= seoulToday(now)) return "checked_out";
  if (ENDED_STATUSES.includes(r.status)) {
    const ended = Date.parse(r.status_changed_at || r.updated_at);
    if (!Number.isNaN(ended) && now.getTime() - ended >= ENDED_GRACE_DAYS * 86_400_000) {
      return "request_ended";
    }
  }
  return null;
}

/** Whether the guest may (still) upload through their link. */
export function canUpload(r: Pick<RetentionInput, "status" | "check_out_date">, now = new Date()): boolean {
  return !ENDED_STATUSES.includes(r.status) && r.check_out_date > seoulToday(now);
}
