"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  BookingRequestWithRoom,
  RoomUnitWithBlocks,
} from "@/lib/types";

function isRoomUnitAvailableForBooking(
  unit: RoomUnitWithBlocks,
  bookingRequestId: string
) {
  return !unit.room_unit_blocks.some(
    (block) => block.booking_request_id !== bookingRequestId
  );
}

export function RoomUnitAssignment({
  request,
  units,
}: {
  request: BookingRequestWithRoom;
  units: RoomUnitWithBlocks[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(
    request.assigned_room_unit_id ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const availableUnits = useMemo(
    () =>
      units.filter((unit) => isRoomUnitAvailableForBooking(unit, request.id)),
    [units, request.id]
  );
  const selectedIsAvailable = availableUnits.some(
    (unit) => unit.id === selectedId
  );
  const isClearing =
    selectedId === "" && Boolean(request.assigned_room_unit_id);
  const canSave =
    selectedId !== (request.assigned_room_unit_id ?? "") &&
    (selectedId === "" || selectedIsAvailable) &&
    !saving;
  const calendarHref = `/admin/availability?room_id=${encodeURIComponent(
    request.room_id ?? ""
  )}${request.assigned_room_unit_id ? `&room_unit_id=${encodeURIComponent(request.assigned_room_unit_id)}` : ""}&from=${encodeURIComponent(
    request.check_in_date
  )}&to=${encodeURIComponent(request.check_out_date)}`;

  async function handleSave() {
    if (!canSave) return;
    if (
      isClearing &&
      !window.confirm(
        `${request.guest_name}님에게 배정된 객실 번호를 해제할까요? 해당 기간의 캘린더 예약이 해제되어 다시 예약 가능한 상태가 됩니다.`
      )
    ) {
      return;
    }
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(
        `/api/admin/requests/${request.id}/assign-room-unit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room_unit_id: selectedId || null }),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error || `HTTP ${res.status}`);
        return;
      }
      setMessage(
        isClearing
          ? "객실 번호 배정을 해제했습니다."
          : "객실 번호를 배정했습니다."
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "배정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">객실 번호 배정</h2>
          <p className="text-sm text-gray-500 mt-1">
            승인 및 결제 링크 발송 전에 배정해야 합니다.
          </p>
          {request.room_id && (
            <Link
              href={calendarHref}
              className="mt-2 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              캘린더에서 이 기간 보기
            </Link>
          )}
        </div>
        {request.room_units?.name && (
          <span className="inline-flex px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
            {request.room_units.name}
          </span>
        )}
      </div>

      {units.length === 0 ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          이 객실 타입에 운영 중인 객실 번호가 없습니다. 이 요청을 승인하기 전에
          관리자에서 객실 번호를 먼저 등록하세요.
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="room_unit_id"
              className="block text-xs font-bold text-gray-700 uppercase mb-1"
            >
              배정 가능한 객실 번호
            </label>
            <select
              id="room_unit_id"
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setError("");
                setMessage("");
              }}
              className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
            >
              <option value="">
                {request.assigned_room_unit_id
                  ? "배정 안 함 (배정 해제)"
                  : "객실 번호 선택"}
              </option>
              {units.map((unit) => {
                const isAvailable = isRoomUnitAvailableForBooking(
                  unit,
                  request.id
                );
                const label = isAvailable
                  ? unit.name
                  : `${unit.name} - 예약 있음`;
                return (
                  <option
                    key={unit.id}
                    value={unit.id}
                    disabled={!isAvailable}
                  >
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-2">
            {units.map((unit) => {
              const blocking = unit.room_unit_blocks.filter(
                (block) => block.booking_request_id !== request.id
              );
              return (
                <div
                  key={unit.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900">{unit.name}</p>
                    {blocking.length > 0 ? (
                      <p className="text-xs text-gray-500 mt-0.5">
                        예약:{" "}
                        {blocking
                          .map(
                            (block) =>
                              `${block.check_in_date} ~ ${block.check_out_date}`
                          )
                          .join(", ")}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-0.5">
                        요청 기간에 예약 가능합니다.
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      blocking.length > 0
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {blocking.length > 0 ? "예약 있음" : "예약 가능"}
                  </span>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              {message}
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={`w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white shadow-sm transition duration-150 ease-in-out disabled:opacity-50 ${
              isClearing
                ? "bg-red-600 hover:bg-red-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {saving ? "저장 중..." : isClearing ? "배정 해제" : "객실 번호 배정"}
          </button>
        </div>
      )}
    </div>
  );
}
