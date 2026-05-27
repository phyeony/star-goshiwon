"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Room } from "@/lib/types";

type RoomUnitStatus = "active" | "inactive" | "maintenance";

type RoomUnit = {
  id: string;
  room_id: string;
  name: string;
  status: RoomUnitStatus;
  notes: string;
  sort_order: number;
};

type Props = {
  rooms: Room[];
  roomUnit?: RoomUnit | null;
};

export function RoomUnitForm({ rooms, roomUnit }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    room_id: roomUnit?.room_id ?? rooms[0]?.id ?? "",
    name: roomUnit?.name ?? "",
    status: roomUnit?.status ?? "active",
    notes: roomUnit?.notes ?? "",
    sort_order: roomUnit?.sort_order ?? 0,
  });

  function updateField(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitWithStatus(statusOverride?: RoomUnitStatus) {
    setSubmitting(true);
    setError("");

    const payload = {
      ...form,
      status: statusOverride ?? form.status,
      sort_order: Number(form.sort_order),
    };

    try {
      const res = await fetch(
        roomUnit ? `/api/admin/room-units/${roomUnit.id}` : "/api/admin/room-units",
        {
          method: roomUnit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "객실 번호 저장에 실패했습니다.");
        return;
      }

      router.push("/admin/room-units");
      router.refresh();
    } catch {
      setError("네트워크 오류입니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitWithStatus();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5 h-fit"
    >
      <div>
        <h2 className="text-sm font-bold uppercase text-gray-700">
          {roomUnit ? "객실 번호 수정" : "객실 번호 등록"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          실제 객실은 선택한 객실 타입의 가격과 공개 정보를 사용합니다.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="room_id"
          className="mb-1 block text-xs font-bold uppercase text-gray-700"
        >
          객실 타입
        </label>
        <select
          id="room_id"
          value={form.room_id}
          onChange={(e) => updateField("room_id", e.target.value)}
          className="block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          required
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-xs font-bold uppercase text-gray-700"
        >
          객실 번호
        </label>
        <input
          id="name"
          type="text"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="예: 301호"
          className="block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="status"
            className="mb-1 block text-xs font-bold uppercase text-gray-700"
          >
            상태
          </label>
          <select
            id="status"
            value={form.status}
            onChange={(e) =>
              updateField("status", e.target.value as RoomUnitStatus)
            }
            className="block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="active">운영 중</option>
            <option value="inactive">비활성</option>
            <option value="maintenance">점검</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="sort_order"
            className="mb-1 block text-xs font-bold uppercase text-gray-700"
          >
            정렬
          </label>
          <input
            id="sort_order"
            type="number"
            value={form.sort_order}
            onChange={(e) => updateField("sort_order", Number(e.target.value))}
            className="block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="notes"
          className="mb-1 block text-xs font-bold uppercase text-gray-700"
        >
          메모
        </label>
        <textarea
          id="notes"
          rows={4}
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          className="block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
        <div>
          {roomUnit ? (
            <button
              type="button"
              onClick={() => submitWithStatus("inactive")}
              disabled={submitting || form.status === "inactive"}
              className="text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              비활성화
            </button>
          ) : null}
        </div>
        <div className="flex gap-3">
          {roomUnit ? (
            <button
              type="button"
              onClick={() => router.push("/admin/room-units")}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
          ) : null}
          <button
            type="submit"
            disabled={submitting || rooms.length === 0}
            className="rounded-lg border border-transparent bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "저장 중..." : roomUnit ? "저장" : "등록"}
          </button>
        </div>
      </div>
    </form>
  );
}
