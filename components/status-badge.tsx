import type { RoomStatus, BookingStatus } from "@/lib/types";
import { ROOM_STATUS_LABELS, BOOKING_STATUS_LABELS } from "@/lib/types";

const roomStatusStyles: Record<RoomStatus, string> = {
  available: "bg-green-100 text-green-800",
  available_soon: "bg-yellow-100 text-yellow-800",
  limited: "bg-yellow-100 text-yellow-800",
  unavailable: "bg-gray-100 text-gray-600",
};

const bookingStatusStyles: Record<BookingStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  contacted: "bg-indigo-100 text-indigo-800",
  approved: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-600",
  closed: "bg-gray-100 text-gray-600",
};

export function StatusBadge({ status }: { status: RoomStatus }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roomStatusStyles[status]}`}
    >
      {ROOM_STATUS_LABELS[status]}
    </span>
  );
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${bookingStatusStyles[status]}`}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}
