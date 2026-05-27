import Link from "next/link";
import { getRooms, getRoomUnitsWithRoom } from "@/lib/queries";
import { RoomUnitForm } from "@/components/admin/room-unit-form";
import type { RoomUnitStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ edit?: string }>;
};

const STATUS_LABELS: Record<RoomUnitStatus, string> = {
  active: "운영 중",
  inactive: "비활성",
  maintenance: "점검",
};

const STATUS_CLASSES: Record<RoomUnitStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-gray-100 text-gray-700 border-gray-200",
  maintenance: "bg-amber-50 text-amber-700 border-amber-200",
};

export default async function AdminRoomUnitsPage({ searchParams }: Props) {
  const [{ edit }, rooms, roomUnits] = await Promise.all([
    searchParams,
    getRooms(),
    getRoomUnitsWithRoom(),
  ]);
  const editingUnit = edit
    ? roomUnits.find((unit) => unit.id === edit) ?? null
    : null;

  const activeCount = roomUnits.filter((unit) => unit.status === "active").length;
  const inactiveCount = roomUnits.filter(
    (unit) => unit.status === "inactive"
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            객실 번호
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            객실 타입별 실제 객실 번호를 관리합니다.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-700">
            전체 {roomUnits.length}개
          </span>
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
            운영 중 {activeCount}개
          </span>
          <span className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-700">
            비활성 {inactiveCount}개
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-sm font-bold uppercase text-gray-700">
              객실 목록
            </h2>
          </div>

          {roomUnits.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-500">
                아직 등록된 객실 번호가 없습니다.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-bold uppercase text-gray-500">
                  <tr>
                    <th className="px-6 py-3">객실 번호</th>
                    <th className="px-6 py-3">객실 타입</th>
                    <th className="px-6 py-3">상태</th>
                    <th className="px-6 py-3">정렬</th>
                    <th className="px-6 py-3">메모</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {roomUnits.map((unit) => (
                    <tr
                      key={unit.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {unit.name}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <div>{unit.rooms?.name ?? "알 수 없는 객실 타입"}</div>
                        {unit.rooms?.slug ? (
                          <div className="text-xs text-gray-500">
                            /{unit.rooms.slug}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${STATUS_CLASSES[unit.status]}`}
                        >
                          {STATUS_LABELS[unit.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {unit.sort_order}
                      </td>
                      <td className="max-w-xs px-6 py-4 text-gray-600">
                        <span className="line-clamp-2">
                          {unit.notes || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/room-units?edit=${unit.id}`}
                          className="text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          수정
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <RoomUnitForm rooms={rooms} roomUnit={editingUnit} />
      </div>
    </div>
  );
}
