"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  parseDate,
  formatDate,
  addDays,
  startOfMonth,
  daysBetween,
  getWeeks,
  monthLabel,
} from "@/lib/dates";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface DateRangePickerProps {
  /** "" or "YYYY-MM-DD" */
  checkIn: string;
  checkOut: string;
  /** Minimum nights between check-in and check-out (default 7). */
  minNights?: number;
  onChange: (checkIn: string, checkOut: string) => void;
  error?: string;
}

function displayDate(value: string) {
  if (!value) return "";
  return parseDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function longDate(value: string) {
  return parseDate(value).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function DateRangePicker({
  checkIn,
  checkOut,
  minNights = 7,
  onChange,
  error,
}: DateRangePickerProps) {
  const today = formatDate(new Date());
  const [open, setOpen] = useState(false);
  // While a range is being picked, only the start is known; `pendingStart`
  // holds it until a valid check-out click (or restart) completes the range.
  const [pendingStart, setPendingStart] = useState<string | null>(
    checkIn && !checkOut ? checkIn : null,
  );
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(parseDate(checkIn || today)),
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const monthStart = startOfMonth(viewMonth);
  const minMonth = startOfMonth(parseDate(today));
  const canGoPrev = formatDate(monthStart) > formatDate(minMonth);

  function moveMonth(direction: -1 | 1) {
    setViewMonth((current) =>
      startOfMonth(
        new Date(
          Date.UTC(
            current.getUTCFullYear(),
            current.getUTCMonth() + direction,
            1,
          ),
        ),
      ),
    );
  }

  // The range currently drawn on the calendar: either the committed
  // check-in/out, or the pending start plus a live hover preview.
  const drawStart = pendingStart ?? checkIn;
  const drawEnd = pendingStart
    ? hoverDate && hoverDate > pendingStart
      ? hoverDate
      : ""
    : checkOut;
  const nights = drawStart && drawEnd ? daysBetween(drawStart, drawEnd) : 0;

  function minCheckout(start: string) {
    return formatDate(addDays(parseDate(start), minNights));
  }

  function isDisabled(date: string) {
    if (date < today) return true;
    // Choosing a check-out: block anything that would be shorter than the
    // minimum stay (dates at/after the start but before start + minNights).
    if (
      pendingStart &&
      date > pendingStart &&
      date < minCheckout(pendingStart)
    ) {
      return true;
    }
    if (pendingStart && date === pendingStart) return true;
    return false;
  }

  function selectDate(date: string) {
    if (isDisabled(date)) return;
    // Fresh selection (nothing pending, or a complete range already exists):
    // start over with this date as check-in and clear the old check-out.
    if (pendingStart === null || date <= pendingStart) {
      setPendingStart(date);
      onChange(date, "");
      return;
    }
    // Second, valid click completes the range.
    onChange(pendingStart, date);
    setPendingStart(null);
    setHoverDate(null);
    setOpen(false);
  }

  const headline =
    nights > 0
      ? `${nights} night${nights > 1 ? "s" : ""}`
      : pendingStart
        ? "Select your check-out date"
        : "Select your dates";

  const subhead = drawStart
    ? drawEnd
      ? `${displayDate(drawStart)} – ${displayDate(drawEnd)}`
      : `${displayDate(drawStart)} – …`
    : `Minimum ${minNights} nights`;

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={`flex rounded-lg border ${
          error ? "border-red-400" : "border-gray-300"
        } overflow-hidden ${
          open ? "ring-2 ring-indigo-500 border-indigo-500" : ""
        }`}
      >
        <TriggerField
          label="Check-in"
          value={checkIn}
          expanded={open}
          onOpen={() => setOpen(true)}
        />
        <div className="w-px bg-gray-300" />
        <TriggerField
          label="Check-out"
          value={checkOut}
          expanded={open}
          onOpen={() => setOpen(true)}
        />
      </div>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

      {open && (
        <div
          role="dialog"
          aria-label="Choose check-in and check-out dates"
          className="absolute -right-2 top-full z-30 mt-2 w-[19rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl sm:w-[38rem]"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-bold leading-tight text-gray-900">
                {headline}
              </p>
              <p className="text-xs text-gray-500">{subhead}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                disabled={!canGoPrev}
                aria-label="Previous month"
                className="rounded-full border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
              >
                <Chevron dir="left" />
              </button>
              <button
                type="button"
                onClick={() => moveMonth(1)}
                aria-label="Next month"
                className="rounded-full border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-50"
              >
                <Chevron dir="right" />
              </button>
            </div>
          </div>

          <div className="flex gap-6">
            <MonthGrid
              monthStart={monthStart}
              today={today}
              drawStart={drawStart}
              drawEnd={drawEnd}
              isDisabled={isDisabled}
              onSelect={selectDate}
              onHover={setHoverDate}
            />
            <div className="hidden flex-1 sm:block">
              <MonthGrid
                monthStart={startOfMonth(
                  new Date(
                    Date.UTC(
                      monthStart.getUTCFullYear(),
                      monthStart.getUTCMonth() + 1,
                      1,
                    ),
                  ),
                )}
                today={today}
                drawStart={drawStart}
                drawEnd={drawEnd}
                isDisabled={isDisabled}
                onSelect={selectDate}
                onHover={setHoverDate}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => {
                setPendingStart(null);
                setHoverDate(null);
                onChange("", "");
              }}
              className="text-sm font-medium text-gray-600 underline hover:text-gray-900"
            >
              Clear dates
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {checkIn && checkOut ? "Done" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TriggerField({
  label,
  value,
  expanded,
  onOpen,
}: {
  label: string;
  value: string;
  expanded: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      className="w-1/2 bg-white p-3 text-left transition hover:bg-gray-50"
    >
      <span className="block text-xs font-bold uppercase text-gray-700">
        {label}
      </span>
      <span
        className={`mt-1 block text-sm ${
          value ? "text-gray-900" : "text-gray-400"
        }`}
      >
        {value ? displayDate(value) : "Add date"}
      </span>
    </button>
  );
}

function MonthGrid({
  monthStart,
  today,
  drawStart,
  drawEnd,
  isDisabled,
  onSelect,
  onHover,
}: {
  monthStart: Date;
  today: string;
  drawStart: string;
  drawEnd: string;
  isDisabled: (date: string) => boolean;
  onSelect: (date: string) => void;
  onHover: (date: string | null) => void;
}) {
  const calendar = useMemo(() => getWeeks(monthStart), [monthStart]);

  return (
    <div className="flex-1">
      <p className="mb-2 text-center text-sm font-semibold text-gray-900">
        {monthLabel(monthStart, "en-US")}
      </p>
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-gray-400">
        {WEEKDAY_LABELS.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calendar.weeks.flatMap((week) =>
          week.days.map((date) => {
            const day = parseDate(date);
            const inMonth =
              calendar.monthStart <= date && date < calendar.monthEnd;
            if (!inMonth) {
              return <div key={date} className="h-10" aria-hidden="true" />;
            }

            const disabled = isDisabled(date);
            const isStart = Boolean(drawStart) && date === drawStart;
            const isEnd = Boolean(drawEnd) && date === drawEnd;
            const isMiddle =
              Boolean(drawStart) &&
              Boolean(drawEnd) &&
              drawStart < date &&
              date < drawEnd;

            const cell = ["relative h-10 text-sm transition"];
            if (isStart || isEnd) {
              cell.push("bg-indigo-600 font-semibold text-white");
              if (isStart && isEnd) cell.push("rounded-lg");
              else cell.push(isStart ? "rounded-l-full" : "rounded-r-full");
            } else if (isMiddle) {
              cell.push("bg-indigo-100 text-indigo-900");
            } else if (disabled) {
              cell.push("text-gray-300 line-through");
            } else {
              cell.push(
                "text-gray-900 hover:rounded-full hover:bg-gray-100 hover:ring-1 hover:ring-inset hover:ring-indigo-400",
              );
            }
            if (date === today && !isStart && !isEnd) {
              cell.push("font-bold");
            }

            return (
              <button
                key={date}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(date)}
                onMouseEnter={() => onHover(date)}
                onMouseLeave={() => onHover(null)}
                aria-label={longDate(date)}
                aria-disabled={disabled}
                className={cell.join(" ")}
              >
                {day.getUTCDate()}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {dir === "left" ? (
        <path d="M15 18l-6-6 6-6" />
      ) : (
        <path d="M9 18l6-6-6-6" />
      )}
    </svg>
  );
}
