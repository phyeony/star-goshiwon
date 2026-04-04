import Link from "next/link";
import { getAdminStats, getBookingRequests } from "@/lib/queries";
import { BookingStatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const stats = await getAdminStats();
  const recentRequests = await getBookingRequests();

  const statCards = [
    {
      label: "Total Rooms",
      value: stats.totalRooms,
      sub: `${stats.availableRooms} available`,
    },
    {
      label: "Total Requests",
      value: stats.totalRequests,
      sub: `${stats.newRequests} new`,
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">
              {stat.value}
            </p>
            <p className="text-sm text-gray-500 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Booking Requests
          </h2>
          <Link
            href="/admin/requests"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition"
          >
            View All
          </Link>
        </div>
        {recentRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No booking requests yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                    Guest
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                    Room
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                    Dates
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.slice(0, 10).map((req) => (
                  <tr
                    key={req.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/requests/${req.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        {req.guest_name}
                      </Link>
                      <p className="text-xs text-gray-500">{req.guest_email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {req.rooms?.name || req.room_slug}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {req.check_in_date} → {req.check_out_date}
                    </td>
                    <td className="px-6 py-4">
                      <BookingStatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
