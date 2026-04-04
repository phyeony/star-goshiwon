import { notFound } from "next/navigation";
import { getBookingRequestById } from "@/lib/queries";
import { formatKRW } from "@/lib/pricing";
import { BookingStatusBadge } from "@/components/status-badge";
import { RequestActions } from "@/components/admin/request-actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params;
  const request = await getBookingRequestById(id);
  if (!request) notFound();

  const checkIn = new Date(request.check_in_date);
  const checkOut = new Date(request.check_out_date);
  const stayDays = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Request from {request.guest_name}
        </h1>
        <BookingStatusBadge status={request.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Guest Information
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  Name
                </dt>
                <dd className="text-base text-gray-900 mt-1">
                  {request.guest_name}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  Email
                </dt>
                <dd className="text-base text-gray-900 mt-1">
                  <a
                    href={`mailto:${request.guest_email}`}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    {request.guest_email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  Guests
                </dt>
                <dd className="text-base text-gray-900 mt-1">
                  {request.guest_count}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  Submitted
                </dt>
                <dd className="text-base text-gray-900 mt-1">
                  {new Date(request.created_at).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Booking Details
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  Room
                </dt>
                <dd className="text-base text-gray-900 mt-1">
                  {request.rooms?.name || request.room_slug}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  Stay Length
                </dt>
                <dd className="text-base text-gray-900 mt-1">
                  {stayDays} day{stayDays !== 1 ? "s" : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  Check-in
                </dt>
                <dd className="text-base text-gray-900 mt-1">
                  {request.check_in_date}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  Check-out
                </dt>
                <dd className="text-base text-gray-900 mt-1">
                  {request.check_out_date}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  Estimated Total
                </dt>
                <dd className="text-2xl font-extrabold text-gray-900 mt-1">
                  {formatKRW(request.estimated_total)}
                </dd>
              </div>
            </dl>

            {request.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <dt className="text-xs font-bold text-gray-500 uppercase mb-1">
                  Guest Notes
                </dt>
                <dd className="text-base text-gray-600 whitespace-pre-line">
                  {request.notes}
                </dd>
              </div>
            )}
          </div>
        </div>

        {/* Actions Sidebar */}
        <div>
          <RequestActions request={request} />
        </div>
      </div>
    </div>
  );
}
