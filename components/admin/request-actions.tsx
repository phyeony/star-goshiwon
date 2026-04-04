"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingRequestWithRoom, BookingStatus } from "@/lib/types";
import { BOOKING_STATUS_LABELS } from "@/lib/types";

const statusTransitions: BookingStatus[] = [
  "new",
  "reviewing",
  "contacted",
  "approved",
  "declined",
  "expired",
  "closed",
];

export function RequestActions({
  request,
}: {
  request: BookingRequestWithRoom;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(request.status);
  const [adminNotes, setAdminNotes] = useState(request.admin_notes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/admin/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_notes: adminNotes }),
      });

      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  const mailtoSubject = encodeURIComponent(
    `Re: Your booking request at Seoul Stay Goshiwon`
  );
  const mailtoBody = encodeURIComponent(
    `Hi ${request.guest_name},\n\nRegarding your booking request for ${request.rooms?.name || request.room_slug} (${request.check_in_date} to ${request.check_out_date}):\n\n`
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sticky top-24 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Actions</h3>

        <label
          htmlFor="status"
          className="block text-xs font-bold text-gray-700 uppercase mb-1"
        >
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as BookingStatus)}
          className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {statusTransitions.map((s) => (
            <option key={s} value={s}>
              {BOOKING_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="admin_notes"
          className="block text-xs font-bold text-gray-700 uppercase mb-1"
        >
          Admin Notes
        </label>
        <textarea
          id="admin_notes"
          rows={4}
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Internal notes about this request..."
          className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition duration-150 ease-in-out disabled:opacity-50"
      >
        {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
      </button>

      <hr className="border-gray-200" />

      <div className="space-y-3">
        <a
          href={`mailto:${request.guest_email}?subject=${mailtoSubject}&body=${mailtoBody}`}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out"
        >
          Email Guest
        </a>
        <button
          onClick={() => {
            const summary = `Guest: ${request.guest_name}\nEmail: ${request.guest_email}\nRoom: ${request.rooms?.name || request.room_slug}\nDates: ${request.check_in_date} → ${request.check_out_date}\nGuests: ${request.guest_count}\nStatus: ${status}`;
            navigator.clipboard.writeText(summary);
          }}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out"
        >
          Copy Summary
        </button>
      </div>
    </div>
  );
}
