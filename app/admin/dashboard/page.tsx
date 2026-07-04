import Link from "next/link";
import { getAdminStats, getBookingRequests } from "@/lib/queries";
import { BookingStatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const stats = await getAdminStats();
  const recentRequests = await getBookingRequests();

  const statCards = [
    {
      label: "전체 객실",
      value: stats.totalRooms,
      sub: `예약 가능 ${stats.availableRooms}개`,
    },
    {
      label: "전체 예약 요청",
      value: stats.totalRequests,
      sub: `신규 ${stats.newRequests}건`,
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">
        대시보드
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
            최근 예약 요청
          </h2>
          <Link
            href="/admin/requests"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition"
          >
            전체 보기
          </Link>
        </div>
        {recentRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            아직 예약 요청이 없습니다.
          </div>
        ) : (
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
                    상태
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                    접수일
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.slice(0, 10).map((req) => (
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
                        className="block px-6 py-4 text-sm text-gray-500"
                      >
                        {req.check_in_date} → {req.check_out_date}
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
                        className="block px-6 py-4 text-sm text-gray-500"
                      >
                        {new Date(req.created_at).toLocaleDateString()}
                      </Link>
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
