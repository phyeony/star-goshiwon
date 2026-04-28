"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Room } from "@/lib/types";
import { formatKRW } from "@/lib/pricing";

type RoomOption = Pick<Room, "name" | "slug" | "price_monthly" | "price_weekly" | "price_daily">;

interface RequestFormProps {
  rooms: RoomOption[];
  preselectedSlug?: string;
  /** When true, hides the room selector (use preselectedSlug to lock the room) */
  singleRoom?: boolean;
}

interface PricingBreakdown {
  weeks: number;
  days: number;
  weeklySubtotal: number;
  dailySubtotal: number;
  subtotal: number;
  discountApplied: boolean;
  discount: number;
  total: number;
  label: string;
}

function calculateClientEstimate(
  room: Pick<Room, "price_monthly" | "price_weekly" | "price_daily">,
  checkIn: string,
  checkOut: string
): PricingBreakdown | null {
  if (!checkIn || !checkOut) return null;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const totalDays = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (totalDays <= 0) return null;

  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  const weeklySubtotal = weeks * room.price_weekly;
  const dailySubtotal = days * room.price_daily;
  const subtotal = weeklySubtotal + dailySubtotal;

  const discountApplied = weeks >= 4;
  const discount = discountApplied ? Math.round(subtotal * 0.15) : 0;

  const parts: string[] = [];
  if (weeks > 0) parts.push(`${weeks} week${weeks > 1 ? "s" : ""}`);
  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);

  return {
    weeks,
    days,
    weeklySubtotal,
    dailySubtotal,
    subtotal,
    discountApplied,
    discount,
    total: subtotal - discount,
    label: parts.join(", "),
  };
}

export function RequestForm({ rooms, preselectedSlug, singleRoom }: RequestFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    guest_name: "",
    guest_email: "",
    guest_count: 1,
    room_slug: preselectedSlug || rooms[0]?.slug || "",
    check_in_date: "",
    check_out_date: "",
    notes: "",
  });

  const selectedRoom = rooms.find((r) => r.slug === form.room_slug);
  const [estimate, setEstimate] = useState<PricingBreakdown | null>(null);

  useEffect(() => {
    if (selectedRoom && form.check_in_date && form.check_out_date) {
      setEstimate(
        calculateClientEstimate(
          selectedRoom,
          form.check_in_date,
          form.check_out_date
        )
      );
    } else {
      setEstimate(null);
    }
  }, [selectedRoom, form.check_in_date, form.check_out_date]);

  function updateField(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          const fieldErrors: Record<string, string> = {};
          for (const err of data.errors) {
            if (err.path?.[0]) {
              fieldErrors[err.path[0]] = err.message;
            }
          }
          setErrors(fieldErrors);
        } else {
          setErrors({ _form: data.error || "Something went wrong" });
        }
        return;
      }

      router.push(`/request-to-book/success?id=${data.id}`);
    } catch {
      setErrors({ _form: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
        <strong className="font-semibold">Men-only property.</strong> This goshiwon accepts male guests only.
      </div>

      <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
        <div className="w-1/2 border-r border-gray-300 p-3 bg-white">
          <label
            htmlFor="check_in_date"
            className="block text-xs font-bold text-gray-700 uppercase"
          >
            Check-in
          </label>
          <input
            type="date"
            id="check_in_date"
            min={today}
            value={form.check_in_date}
            onChange={(e) => updateField("check_in_date", e.target.value)}
            className="w-full mt-1 border-none bg-transparent text-sm focus:ring-0 p-0 text-gray-900 outline-none"
            required
          />
          {errors.check_in_date && (
            <p className="text-xs text-red-600 mt-1">{errors.check_in_date}</p>
          )}
        </div>
        <div className="w-1/2 p-3 bg-white">
          <label
            htmlFor="check_out_date"
            className="block text-xs font-bold text-gray-700 uppercase"
          >
            Check-out
          </label>
          <input
            type="date"
            id="check_out_date"
            min={form.check_in_date || today}
            value={form.check_out_date}
            onChange={(e) => updateField("check_out_date", e.target.value)}
            className="w-full mt-1 border-none bg-transparent text-sm focus:ring-0 p-0 text-gray-900 outline-none"
            required
          />
          {errors.check_out_date && (
            <p className="text-xs text-red-600 mt-1">
              {errors.check_out_date}
            </p>
          )}
        </div>
      </div>

      {!singleRoom && (
        <div className="block w-full border border-gray-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-white">
          <label
            htmlFor="room_slug"
            className="block text-xs font-bold text-gray-700 uppercase"
          >
            Room Type
          </label>
          <select
            id="room_slug"
            value={form.room_slug}
            onChange={(e) => updateField("room_slug", e.target.value)}
            className="mt-1 block w-full border-none bg-transparent text-sm focus:ring-0 p-0 text-gray-900 outline-none"
            required
          >
            {rooms.map((room) => (
              <option key={room.slug} value={room.slug}>
                {room.name} ({formatKRW(room.price_weekly)}/week)
              </option>
            ))}
          </select>
          {errors.room_slug && (
            <p className="text-xs text-red-600 mt-1">{errors.room_slug}</p>
          )}
        </div>
      )}

      <div className="block w-full border border-gray-300 rounded-lg p-3 bg-gray-50">
        <label className="block text-xs font-bold text-gray-700 uppercase">
          Guests
        </label>
        <p className="mt-1 text-sm text-gray-900">1 guest (single occupancy)</p>
      </div>

      <div className="space-y-3 pt-4 border-t border-gray-100 mt-4">
        <div>
          <input
            type="text"
            id="guest_name"
            placeholder="Full Name (as on passport)"
            value={form.guest_name}
            onChange={(e) => updateField("guest_name", e.target.value)}
            className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
          {errors.guest_name && (
            <p className="text-xs text-red-600 mt-1">{errors.guest_name}</p>
          )}
        </div>
        <div>
          <input
            type="email"
            id="guest_email"
            placeholder="Email Address"
            value={form.guest_email}
            onChange={(e) => updateField("guest_email", e.target.value)}
            className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
          {errors.guest_email && (
            <p className="text-xs text-red-600 mt-1">{errors.guest_email}</p>
          )}
        </div>
        <div>
          <textarea
            id="notes"
            placeholder="Special requests or questions?"
            rows={2}
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {errors.notes && (
            <p className="text-xs text-red-600 mt-1">{errors.notes}</p>
          )}
        </div>
      </div>

      {estimate && estimate.total > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mt-4 border border-gray-200">
          {estimate.weeks > 0 && (
            <div className="flex justify-between text-base text-gray-600 mb-2">
              <span>
                {formatKRW(selectedRoom!.price_weekly)} x {estimate.weeks} week
                {estimate.weeks > 1 ? "s" : ""}
              </span>
              <span>{formatKRW(estimate.weeklySubtotal)}</span>
            </div>
          )}
          {estimate.days > 0 && (
            <div className="flex justify-between text-base text-gray-600 mb-2">
              <span>
                {formatKRW(selectedRoom!.price_daily)} x {estimate.days} day
                {estimate.days > 1 ? "s" : ""}
              </span>
              <span>{formatKRW(estimate.dailySubtotal)}</span>
            </div>
          )}
          {estimate.discountApplied && (
            <div className="flex justify-between text-base text-green-600 mb-2">
              <span>Monthly discount (15%)</span>
              <span>-{formatKRW(estimate.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 text-lg border-t border-gray-200 pt-2 mt-2">
            <span>Estimated Total</span>
            <span>{formatKRW(estimate.total)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            + ₩20,000 optional one-time bedding fee
          </p>
        </div>
      )}

      {errors._form && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {errors._form}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm md:py-4 md:text-lg transition duration-150 ease-in-out mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Sending Request..." : "Send Booking Request"}
      </button>
      <p className="text-xs text-center text-gray-500 mt-2">
        This sends a request to the host. Your booking is{" "}
        <strong>not confirmed</strong> until we review and respond via email.
      </p>
    </form>
  );
}
