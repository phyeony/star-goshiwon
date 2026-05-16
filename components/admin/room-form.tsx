"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Room, RoomStatus } from "@/lib/types";

interface RoomFormProps {
  room?: Room;
}

export function RoomForm({ room }: RoomFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: room?.name || "",
    slug: room?.slug || "",
    description: room?.description || "",
    price_monthly: room?.price_monthly || 0,
    price_weekly: room?.price_weekly || 0,
    price_daily: room?.price_daily || 0,
    capacity: room?.capacity || 1,
    size_sqm: room?.size_sqm || "",
    amenities: room?.amenities.join(", ") || "",
    status: (room?.status || "available") as RoomStatus,
    featured: room?.featured || false,
    sort_order: room?.sort_order || 0,
  });

  function updateField(field: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      ...form,
      size_sqm: form.size_sqm ? Number(form.size_sqm) : null,
      amenities: form.amenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
    };

    try {
      const url = room
        ? `/api/admin/rooms/${room.id}`
        : "/api/admin/rooms";
      const method = room ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "객실 저장에 실패했습니다");
        return;
      }

      router.push("/admin/rooms");
      router.refresh();
    } catch {
      setError("네트워크 오류입니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!room || !confirm("이 객실을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/admin/rooms/${room.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin/rooms");
        router.refresh();
      }
    } catch {
      setError("객실 삭제에 실패했습니다.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-2xl space-y-6"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="name"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            객실명
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => {
              updateField("name", e.target.value);
              if (!room) updateField("slug", generateSlug(e.target.value));
            }}
            className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="slug"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            슬러그
          </label>
          <input
            id="slug"
            type="text"
            value={form.slug}
            onChange={(e) => updateField("slug", e.target.value)}
            className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-xs font-bold text-gray-700 uppercase mb-1"
        >
          설명
        </label>
        <textarea
          id="description"
          rows={3}
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="price_monthly"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            월 요금 (KRW)
          </label>
          <input
            id="price_monthly"
            type="number"
            value={form.price_monthly}
            onChange={(e) =>
              updateField("price_monthly", Number(e.target.value))
            }
            className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="price_weekly"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            주 요금 (KRW)
          </label>
          <input
            id="price_weekly"
            type="number"
            value={form.price_weekly}
            onChange={(e) =>
              updateField("price_weekly", Number(e.target.value))
            }
            className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="price_daily"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            일 요금 (KRW)
          </label>
          <input
            id="price_daily"
            type="number"
            value={form.price_daily}
            onChange={(e) => updateField("price_daily", Number(e.target.value))}
            className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="capacity"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            수용 인원
          </label>
          <input
            id="capacity"
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => updateField("capacity", Number(e.target.value))}
            className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="size_sqm"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            면적 (m²)
          </label>
          <input
            id="size_sqm"
            type="number"
            step="0.1"
            value={form.size_sqm}
            onChange={(e) => updateField("size_sqm", e.target.value)}
            className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label
            htmlFor="status"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            상태
          </label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
            className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="available">예약 가능</option>
            <option value="available_soon">곧 예약 가능</option>
            <option value="limited">잔여 객실 적음</option>
            <option value="unavailable">예약 불가</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="amenities"
          className="block text-xs font-bold text-gray-700 uppercase mb-1"
        >
          편의 시설 (쉼표로 구분)
        </label>
        <input
          id="amenities"
          type="text"
          value={form.amenities}
          onChange={(e) => updateField("amenities", e.target.value)}
          placeholder="Private Shower, AC / Heat, Mini-fridge, Fast WiFi"
          className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="sort_order"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            정렬 순서
          </label>
          <input
            id="sort_order"
            type="number"
            value={form.sort_order}
            onChange={(e) => updateField("sort_order", Number(e.target.value))}
            className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => updateField("featured", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">홈페이지 추천 객실</span>
          </label>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div>
          {room && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-sm text-red-600 hover:text-red-700 font-medium transition"
            >
              객실 삭제
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition duration-150 ease-in-out disabled:opacity-50"
          >
            {submitting ? "저장 중..." : room ? "객실 수정" : "객실 만들기"}
          </button>
        </div>
      </div>
    </form>
  );
}
