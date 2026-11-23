import { siteConfig } from "@/lib/site-data";
import {
  PassportUploadForm,
  type PassportUploadBooking,
} from "./passport-upload-form";

function formatDay(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Guest-facing passport check page. Shared by the real route and the dev preview. */
export function PassportUploadPage({
  booking,
  uploadUrl,
  initiallyDone,
}: {
  booking: PassportUploadBooking;
  uploadUrl?: string;
  initiallyDone?: boolean;
}) {
  const firstName = booking.guestName.trim().split(/\s+/)[0] || "there";
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-8">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth={2.5} aria-hidden>
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
          </svg>
          Secure page · Star Goshiwon
        </p>
        <h1 className="mt-3 text-3xl font-extrabold text-gray-900 tracking-tight">
          Verify your identity
        </h1>
        <p className="mt-2 text-base text-gray-600">
          Hi {firstName}, one last step before we approve your booking request.
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-gray-200 bg-white p-4 text-sm sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-gray-500">Room</dt>
            <dd className="font-medium text-gray-900">{booking.roomName}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Check-in</dt>
            <dd className="font-medium text-gray-900">{formatDay(booking.checkIn)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Check-out</dt>
            <dd className="font-medium text-gray-900">{formatDay(booking.checkOut)}</dd>
          </div>
        </dl>
      </div>

      <PassportUploadForm
        booking={booking}
        contactEmail={siteConfig.email}
        uploadUrl={uploadUrl}
        initiallyDone={initiallyDone}
      />
    </div>
  );
}
