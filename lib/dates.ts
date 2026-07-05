// Pure, dependency-free date helpers shared by the admin availability calendar
// and the public booking date-range picker. All dates are handled as UTC
// "YYYY-MM-DD" strings so the same day is rendered regardless of the viewer's
// timezone (a booking day is a calendar day, not an instant).

export const DAY_MS = 24 * 60 * 60 * 1000;

export type CalendarWeek = {
  start: string;
  end: string;
  days: string[];
};

export function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function startOfNextMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

export function startOfCalendarGrid(monthStart: Date) {
  return addDays(monthStart, -monthStart.getUTCDay());
}

export function endOfCalendarGrid(monthEnd: Date) {
  // Saturday of the week containing the month's last day. Basing this on the
  // last day (not monthEnd) avoids appending a trailing week that is entirely
  // in the next month.
  const lastDay = addDays(monthEnd, -1);
  return addDays(lastDay, 6 - lastDay.getUTCDay());
}

export function daysBetween(start: string, end: string) {
  return Math.max(
    0,
    Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / DAY_MS)
  );
}

// Full 6-week (max) grid for a month, padded to whole weeks so the calendar is
// always rectangular. `monthStart`/`monthEnd` bound the "current month" days so
// callers can grey out the leading/trailing days from adjacent months.
export function getWeeks(monthStart: Date) {
  const monthEnd = startOfNextMonth(monthStart);
  const gridStart = startOfCalendarGrid(monthStart);
  const gridEnd = endOfCalendarGrid(monthEnd);
  const weeks: CalendarWeek[] = [];

  for (let start = gridStart; start <= gridEnd; start = addDays(start, 7)) {
    const days = Array.from({ length: 7 }, (_, index) =>
      formatDate(addDays(start, index))
    );
    weeks.push({
      start: formatDate(start),
      end: formatDate(addDays(start, 7)),
      days,
    });
  }

  return {
    monthStart: formatDate(monthStart),
    monthEnd: formatDate(monthEnd),
    weeks,
  };
}

export function monthLabel(date: Date, locale: string) {
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}
