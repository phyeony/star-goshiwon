import { describe, it, expect } from "vitest";
import {
  parseDate,
  formatDate,
  addDays,
  startOfMonth,
  startOfNextMonth,
  daysBetween,
  getWeeks,
  monthLabel,
} from "./dates";

describe("parseDate / formatDate", () => {
  it("round-trips a YYYY-MM-DD string in UTC", () => {
    expect(formatDate(parseDate("2026-07-04"))).toBe("2026-07-04");
  });

  it("parses at UTC midnight regardless of local timezone", () => {
    expect(parseDate("2026-07-04").toISOString()).toBe(
      "2026-07-04T00:00:00.000Z"
    );
  });
});

describe("addDays", () => {
  it("advances across a month boundary", () => {
    expect(formatDate(addDays(parseDate("2026-07-31"), 1))).toBe("2026-08-01");
  });

  it("goes backwards with a negative count", () => {
    expect(formatDate(addDays(parseDate("2026-03-01"), -1))).toBe("2026-02-28");
  });
});

describe("startOfMonth / startOfNextMonth", () => {
  it("snaps to the first of the month", () => {
    expect(formatDate(startOfMonth(parseDate("2026-07-04")))).toBe("2026-07-01");
  });

  it("advances to the first of next month, wrapping the year", () => {
    expect(formatDate(startOfNextMonth(parseDate("2026-12-15")))).toBe(
      "2027-01-01"
    );
  });
});

describe("daysBetween", () => {
  it("counts nights between two dates", () => {
    expect(daysBetween("2026-07-04", "2026-07-11")).toBe(7);
  });

  it("never returns negative for an inverted range", () => {
    expect(daysBetween("2026-07-11", "2026-07-04")).toBe(0);
  });

  it("is zero for the same day", () => {
    expect(daysBetween("2026-07-04", "2026-07-04")).toBe(0);
  });
});

describe("getWeeks", () => {
  it("pads to whole weeks starting on Sunday and ending on Saturday", () => {
    const { weeks } = getWeeks(parseDate("2026-07-01"));
    // July 1 2026 is a Wednesday, so the grid starts on the prior Sunday.
    expect(weeks[0].days[0]).toBe("2026-06-28");
    for (const week of weeks) {
      expect(week.days).toHaveLength(7);
      expect(parseDate(week.days[0]).getUTCDay()).toBe(0);
      expect(parseDate(week.days[6]).getUTCDay()).toBe(6);
    }
  });

  it("reports the month bounds used to grey out adjacent days", () => {
    const { monthStart, monthEnd } = getWeeks(parseDate("2026-07-01"));
    expect(monthStart).toBe("2026-07-01");
    expect(monthEnd).toBe("2026-08-01");
  });

  it("covers every day of the target month", () => {
    const { weeks } = getWeeks(parseDate("2026-02-01"));
    const all = weeks.flatMap((w) => w.days);
    expect(all).toContain("2026-02-28");
    // 2026 is not a leap year — Feb 29 must not appear.
    expect(all).not.toContain("2026-02-29");
    expect(all).toContain("2026-02-01");
  });

  it("never appends a trailing week that is entirely in the next month", () => {
    // A month ending exactly on Saturday used to get a phantom all-next-month
    // week. The last week must always contain at least one current-month day.
    for (const m of ["2026-02-01", "2026-08-01", "2026-01-01", "2026-05-01"]) {
      const { weeks, monthEnd } = getWeeks(parseDate(m));
      const lastWeek = weeks[weeks.length - 1].days;
      expect(lastWeek.some((d) => d < monthEnd)).toBe(true);
    }
  });
});

describe("monthLabel", () => {
  it("formats the month and year for a locale in UTC", () => {
    expect(monthLabel(parseDate("2026-07-01"), "en-US")).toBe("July 2026");
  });
});
