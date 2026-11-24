import { describe, expect, it } from "vitest";
import { prefillDates } from "./prefill";

describe("prefillDates", () => {
  const today = "2026-11-21";

  it("reads the dates from a pre-filled booking link", () => {
    expect(prefillDates("?check_in=2026-12-01&check_out=2026-12-15", today)).toEqual({
      checkIn: "2026-12-01",
      checkOut: "2026-12-15",
    });
  });

  it("ignores dates the form would reject", () => {
    expect(prefillDates("", today)).toBeNull();
    expect(prefillDates("?check_in=2026-11-01&check_out=2026-11-15", today)).toBeNull(); // past
    expect(prefillDates("?check_in=2026-12-01&check_out=2026-12-04", today)).toBeNull(); // under 7 nights
    expect(prefillDates("?check_in=2026-02-30&check_out=2026-03-15", today)).toBeNull(); // not a date
    expect(prefillDates("?check_in=12/01/2026&check_out=2026-12-15", today)).toBeNull();
  });
});
