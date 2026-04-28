import Link from "next/link";
import { getRooms } from "@/lib/queries";
import { StatusBadge } from "@/components/status-badge";
import { formatUSD, USD_PRICES_BY_SLUG } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function AdminRoomsPage() {
  const rooms = await getRooms();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Rooms
        </h1>
        <Link
          href="/admin/rooms/new"
          className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition duration-150 ease-in-out"
        >
          Add Room
        </Link>
      </div>

      {rooms.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No rooms yet. Add your first room.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                    Monthly
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                    Capacity
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr
                    key={room.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {room.name}
                      </p>
                      <p className="text-xs text-gray-500">/{room.slug}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {USD_PRICES_BY_SLUG[room.slug]
                        ? formatUSD(USD_PRICES_BY_SLUG[room.slug].monthly)
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {room.capacity}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={room.status} />
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/rooms/${room.id}/edit`}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition"
                      >
                        Edit
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
