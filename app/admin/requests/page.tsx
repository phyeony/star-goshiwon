import Link from "next/link";
import { getBookingRequests } from "@/lib/queries";
import { BookingStatusBadge } from "@/components/status-badge";
import { formatUSD } from "@/lib/pricing";
import type { BookingStatus } from "@/lib/types";
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS_KO } from "@/lib/types";

export const dynamic = "force-dynamic";

const statusOptions: (BookingStatus | "all")[] = [
  "all",
  "new",
  "reviewing",
  "contacted",
  "approved",
  "confirmed",
  "declined",
  "expired",
  "closed",
];

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filterStatus } = await searchParams;
  const filters =
    filterStatus && filterStatus !== "all"
      ? { status: filterStatus as BookingStatus }
      : undefined;

  const requests = await getBookingRequests(filters);

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">
        예약 요청
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusOptions.map((s) => {
          const isActive =
            s === "all" ? !filterStatus || filterStatus === "all" : filterStatus === s;
          const label =
            s === "all" ? "전체" : BOOKING_STATUS_LABELS[s as BookingStatus];
          return (
            <Link
              key={s}
              href={s === "all" ? "/admin/requests" : `/admin/requests?status=${s}`}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">예약 요청이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                    고객
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                    객실
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                    숙박 일정
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                    금액
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                    상태
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                    결제
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                    접수일
                  </th>
                </tr>
              </thead>
              <tbody>
	                {requests.map((req) => (
	                  <tr
	                    key={req.id}
	                    className="group border-b border-gray-100 hover:bg-gray-50 transition"
	                  >
	                    <td className="p-0">
	                      <Link
	                        href={`/admin/requests/${req.id}`}
	                        className="block px-6 py-4"
	                      >
	                        <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
	                          {req.guest_name}
	                        </span>
	                        <p className="text-xs text-gray-500">{req.guest_email}</p>
	                      </Link>
	                    </td>
	                    <td className="p-0">
	                      <Link
	                        href={`/admin/requests/${req.id}`}
	                        className="block px-6 py-4 text-sm text-gray-900"
	                      >
	                        {req.rooms?.name || req.room_slug}
	                      </Link>
	                    </td>
	                    <td className="p-0">
	                      <Link
	                        href={`/admin/requests/${req.id}`}
	                        className="block px-6 py-4 text-sm text-gray-500 whitespace-nowrap"
	                      >
	                        {req.check_in_date} → {req.check_out_date}
	                      </Link>
	                    </td>
	                    <td className="p-0">
	                      <Link
	                        href={`/admin/requests/${req.id}`}
	                        className="block px-6 py-4 text-sm font-medium text-gray-900"
	                      >
	                        {formatUSD(req.estimated_total)}
	                      </Link>
	                    </td>
	                    <td className="p-0">
	                      <Link
	                        href={`/admin/requests/${req.id}`}
	                        className="block px-6 py-4"
	                      >
	                        <BookingStatusBadge status={req.status} />
	                      </Link>
	                    </td>
	                    <td className="p-0">
	                      <Link
	                        href={`/admin/requests/${req.id}`}
	                        className="block px-6 py-4 text-sm text-gray-600"
	                      >
	                        {PAYMENT_STATUS_LABELS_KO[req.payment_status]}
	                      </Link>
	                    </td>
	                    <td className="p-0">
	                      <Link
	                        href={`/admin/requests/${req.id}`}
	                        className="block px-6 py-4 text-sm text-gray-500 whitespace-nowrap"
	                      >
	                        {new Date(req.created_at).toLocaleDateString()}
	                      </Link>
	                    </td>
	                  </tr>
	                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
