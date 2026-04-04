import type { Room } from "./types";

export interface PricingBreakdown {
  months: number;
  weeks: number;
  days: number;
  monthlySubtotal: number;
  weeklySubtotal: number;
  dailySubtotal: number;
  total: number;
  label: string;
}

export function calculateEstimate(
  room: Pick<Room, "price_monthly" | "price_weekly" | "price_daily">,
  checkIn: string,
  checkOut: string
): PricingBreakdown {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const totalDays = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (totalDays <= 0) {
    return {
      months: 0,
      weeks: 0,
      days: 0,
      monthlySubtotal: 0,
      weeklySubtotal: 0,
      dailySubtotal: 0,
      total: 0,
      label: "",
    };
  }

  // Break down into months (30 days), weeks (7 days), days
  const months = Math.floor(totalDays / 30);
  const remainingAfterMonths = totalDays % 30;
  const weeks = Math.floor(remainingAfterMonths / 7);
  const days = remainingAfterMonths % 7;

  const monthlySubtotal = months * room.price_monthly;
  const weeklySubtotal = weeks * room.price_weekly;
  const dailySubtotal = days * room.price_daily;
  const total = monthlySubtotal + weeklySubtotal + dailySubtotal;

  const parts: string[] = [];
  if (months > 0) parts.push(`${months} month${months > 1 ? "s" : ""}`);
  if (weeks > 0) parts.push(`${weeks} week${weeks > 1 ? "s" : ""}`);
  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);

  return {
    months,
    weeks,
    days,
    monthlySubtotal,
    weeklySubtotal,
    dailySubtotal,
    total,
    label: parts.join(", ") || "0 days",
  };
}

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}
