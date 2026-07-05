"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { trackGaEvent } from "@/lib/ga";
import type { Room } from "@/lib/types";
import { DateRangePicker } from "@/components/date-range-picker";
import { MIN_STAY_NIGHTS } from "@/lib/validation";
import {
  calculateEstimate,
  formatUSD,
  formatApproxKRW,
  roomTier,
  BEDDING_FEE_USD,
  DEPOSIT_USD,
  type PricingBreakdown,
} from "@/lib/pricing";

type RoomOption = Pick<
  Room,
  "name" | "slug" | "nightly_rate_usd" | "long_stay_discount"
>;

interface RequestFormProps {
  rooms: RoomOption[];
  preselectedSlug?: string;
  /** When true, hides the room selector (use preselectedSlug to lock the room) */
  singleRoom?: boolean;
}

export function RequestForm({
  rooms,
  preselectedSlug,
  singleRoom,
}: RequestFormProps) {
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
    bedding_prepaid: false,
    policies_accepted: false,
    men_only_acknowledged: false,
  });

  const selectedRoom = rooms.find((r) => r.slug === form.room_slug);
  const [estimate, setEstimate] = useState<PricingBreakdown | null>(null);
  // Once-per-form-session funnel markers (started / saw a price)
  const formStarted = useRef(false);
  const estimateViewed = useRef(false);

  useEffect(() => {
    if (selectedRoom && form.check_in_date && form.check_out_date) {
      const breakdown = calculateEstimate(
        roomTier(selectedRoom),
        form.check_in_date,
        form.check_out_date,
        { beddingPrepaid: form.bedding_prepaid },
      );
      setEstimate(breakdown);
      if (!estimateViewed.current && breakdown.total > 0) {
        estimateViewed.current = true;
        posthog.capture("price_estimate_viewed", {
          room_slug: selectedRoom.slug,
          check_in_date: form.check_in_date,
          check_out_date: form.check_out_date,
          nights: breakdown.nights,
          estimated_total: breakdown.total,
        });
      }
    } else {
      setEstimate(null);
    }
  }, [
    selectedRoom,
    form.check_in_date,
    form.check_out_date,
    form.bedding_prepaid,
  ]);

  function updateField(field: string, value: string | number | boolean) {
    if (!formStarted.current) {
      formStarted.current = true;
      posthog.capture("booking_form_started", {
        room_slug: form.room_slug,
        embedded_on_room_page: Boolean(singleRoom),
        first_field: field,
      });
    }
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  // The date-range picker sets both dates together (check-out is cleared to ""
  // while a new range is mid-selection). Mirror updateField's funnel marker and
  // clear both date errors at once.
  function handleDateChange(checkIn: string, checkOut: string) {
    if (!formStarted.current) {
      formStarted.current = true;
      posthog.capture("booking_form_started", {
        room_slug: form.room_slug,
        embedded_on_room_page: Boolean(singleRoom),
        first_field: "check_in_date",
      });
    }
    setForm((prev) => ({
      ...prev,
      check_in_date: checkIn,
      check_out_date: checkOut,
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.check_in_date;
      delete next.check_out_date;
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
        posthog.capture("booking_request_failed", {
          room_slug: form.room_slug,
          error: data.error || "validation_error",
        });
        if (data.errors) {
          const fieldErrors: Record<string, string> = {};
          for (const err of data.errors) {
            if (err.path?.[0]) {
              fieldErrors[err.path[0]] = err.message;
            }
          }
          posthog.capture("booking_form_validation_error", {
            room_slug: form.room_slug,
            fields: Object.keys(fieldErrors),
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ _form: data.error || "Something went wrong" });
        }
        return;
      }

      posthog.identify(form.guest_email, { name: form.guest_name });
      posthog.capture("booking_request_submitted", {
        room_slug: form.room_slug,
        check_in_date: form.check_in_date,
        check_out_date: form.check_out_date,
        bedding_prepaid: form.bedding_prepaid,
        estimated_total: estimate?.total,
        request_id: data.id,
      });
      // GA4 recommended lead event — mark as a Key Event in the GA UI
      trackGaEvent("generate_lead", {
        currency: "USD",
        value: estimate?.total,
      });
      router.push(`/request-to-book/success?id=${data.id}`);
    } catch {
      posthog.capture("booking_request_failed", {
        room_slug: form.room_slug,
        error: "network_error",
      });
      setErrors({ _form: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const selectedUsd = selectedRoom ? roomTier(selectedRoom) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <DateRangePicker
        checkIn={form.check_in_date}
        checkOut={form.check_out_date}
        minNights={MIN_STAY_NIGHTS}
        onChange={handleDateChange}
        error={errors.check_in_date || errors.check_out_date}
      />

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
            {rooms.map((room) => {
              const usd = roomTier(room);
              return (
                <option key={room.slug} value={room.slug}>
                  {room.name} ({formatUSD(usd.nightly)}/night)
                </option>
              );
            })}
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

        <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
          <input
            type="checkbox"
            checked={form.bedding_prepaid}
            onChange={(e) => updateField("bedding_prepaid", e.target.checked)}
            className="mt-0.5 h-4 w-4 min-h-4 min-w-4 flex-none rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm">
            <span className="font-semibold text-gray-900">
              Add bedding set — {formatUSD(BEDDING_FEE_USD)} prepaid
            </span>
            <span className="block text-xs text-gray-500 mt-0.5">
              Optional. Includes a pillow, blanket, towels, and shampoo. If you
              don&rsquo;t add it, bedding is not provided.
            </span>
          </span>
        </label>
      </div>

      {estimate && estimate.total > 0 && selectedUsd && (
        <div className="bg-gray-50 rounded-lg p-4 mt-4 border border-gray-200">
          {estimate.nights > 0 && (
            <div className="flex justify-between text-base text-gray-600 mb-2">
              <span>
                {estimate.nights} night{estimate.nights > 1 ? "s" : ""} ×{" "}
                {formatUSD(estimate.nightlyRate)}
              </span>
              <span>{formatUSD(estimate.nightsSubtotal)}</span>
            </div>
          )}
          {estimate.totalSaving > 0 && (
            <div className="flex justify-between text-base text-green-600 mb-2">
              <span>{estimate.savingLabel}</span>
              <span>-{formatUSD(estimate.totalSaving)}</span>
            </div>
          )}
          {estimate.beddingFee > 0 && (
            <div className="flex justify-between text-base text-gray-600 mb-2">
              <span>Bedding set</span>
              <span>{formatUSD(estimate.beddingFee)}</span>
            </div>
          )}
          {estimate.deposit > 0 && (
            <div className="flex justify-between text-base text-gray-600 mb-2">
              <span>Refundable deposit</span>
              <span>{formatUSD(estimate.deposit)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 text-lg border-t border-gray-200 pt-2 mt-2">
            <span>Total</span>
            <span>
              {formatUSD(estimate.total)}
              <span className="ml-2 text-sm font-normal text-gray-500">
                {formatApproxKRW(estimate.total)}
              </span>
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Billed per night. 28+ nights stays get a better nightly rate.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Includes a {formatUSD(DEPOSIT_USD)} refundable deposit, returned via
            PayPal at the end of your stay if the room is left undamaged.
          </p>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
        <p className="text-sm font-semibold text-gray-900 mb-2">
          Before you submit, please note:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
          <li>Up-front payment via PayPal (USD).</li>
        </ul>
        <label className="flex items-start gap-2.5 cursor-pointer mt-3 pt-3 border-t border-gray-200">
          <input
            type="checkbox"
            checked={form.men_only_acknowledged}
            onChange={(e) =>
              updateField("men_only_acknowledged", e.target.checked)
            }
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            required
          />
          <span className="text-sm text-gray-900">
            I understand this goshiwon is for men only.
          </span>
        </label>
        {errors.men_only_acknowledged && (
          <p className="text-sm text-red-600 mt-2">
            {errors.men_only_acknowledged}
          </p>
        )}
        <label className="flex items-start gap-2.5 cursor-pointer mt-3 pt-3 border-t border-gray-200">
          <input
            type="checkbox"
            checked={form.policies_accepted}
            onChange={(e) => updateField("policies_accepted", e.target.checked)}
            className="mt-0.5 h-4 w-4 min-h-4 min-w-4 flex-none rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            required
          />
          <span className="text-sm text-gray-900">
            I have read and agree to the{" "}
            <a
              href="/policies"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline font-medium"
            >
              booking &amp; house policies
            </a>
            .
          </span>
        </label>
        {errors.policies_accepted && (
          <p className="text-sm text-red-600 mt-2">
            {errors.policies_accepted}
          </p>
        )}
      </div>

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
