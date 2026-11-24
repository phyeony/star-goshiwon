// Dates passed to a room page as ?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD
// (the WhatsApp agent's pre-filled booking link). Anything the booking form
// would reject is ignored, so a stale or edited link just opens an empty form.

import { MIN_STAY_NIGHTS } from "./validation";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function parse(iso: string): number | null {
  if (!ISO_DATE.test(iso)) return null;
  const t = Date.parse(`${iso}T00:00:00Z`);
  return Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== iso ? null : t;
}

/** today: YYYY-MM-DD in the guest's own calendar. */
export function prefillDates(search: string, today: string): { checkIn: string; checkOut: string } | null {
  const p = new URLSearchParams(search);
  const checkIn = p.get("check_in") ?? "";
  const checkOut = p.get("check_out") ?? "";
  const inT = parse(checkIn);
  const outT = parse(checkOut);
  const todayT = parse(today);
  if (inT === null || outT === null || todayT === null) return null;
  if (inT < todayT) return null;
  if ((outT - inT) / DAY_MS < MIN_STAY_NIGHTS) return null;
  return { checkIn, checkOut };
}
