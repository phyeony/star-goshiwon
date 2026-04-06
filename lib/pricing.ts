import type { Room } from "./types";

export interface PricingBreakdown {
  weeks: number;
  days: number;
  weeklyRate: number;
  discountApplied: boolean;
  subtotal: number;
  discount: number;
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
      weeks: 0,
      days: 0,
      weeklyRate: room.price_weekly,
      discountApplied: false,
      subtotal: 0,
      discount: 0,
      total: 0,
      label: "",
    };
  }

  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  const weeklySubtotal = weeks * room.price_weekly;
  const dailySubtotal = days * room.price_daily;
  const subtotal = weeklySubtotal + dailySubtotal;

  // 15% discount for stays of 4 weeks or longer
  const discountApplied = weeks >= 4;
  const discount = discountApplied ? Math.round(subtotal * 0.15) : 0;
  const total = subtotal - discount;

  const parts: string[] = [];
  if (weeks > 0) parts.push(`${weeks} week${weeks > 1 ? "s" : ""}`);
  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);

  return {
    weeks,
    days,
    weeklyRate: room.price_weekly,
    discountApplied,
    subtotal,
    discount,
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
