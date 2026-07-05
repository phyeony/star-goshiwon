"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { roomNameKo } from "@/lib/room-names";
import type { Room, RoomUnitBlock, RoomUnitWithRoom } from "@/lib/types";
import {
  type CalendarWeek,
  parseDate,
  formatDate,
  addDays,
  startOfMonth,
  daysBetween,
  getWeeks,
} from "@/lib/dates";

type RoomOption = Pick<Room, "id" | "name" | "name_ko" | "slug">;
type ModalState =
  | { kind: "create" }
  | { kind: "block"; block: RoomUnitBlock }
  | null;

type WeekSegment = {
  block: RoomUnitBlock;
  startIndex: number;
  span: number;
  lane: number;
  startsHere: boolean;
  endsHere: boolean;
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const MAX_VISIBLE_LANES = 2;

// The checkout day is reserved for cleaning/turnover, so the room stays
// blocked through and including check_out_date.
function occupancyEnd(block: RoomUnitBlock) {
  return formatDate(addDays(parseDate(block.check_out_date), 1));
}

function containsDate(block: RoomUnitBlock, date: string) {
  return block.check_in_date <= date && date < occupancyEnd(block);
}

function overlaps(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && endA > startB;
}

function isToday(date: string) {
  return date === formatDate(new Date());
}

function isInRange(date: string, from?: string, to?: string) {
  return Boolean(from && to && from <= date && date < to);
}

function blockLabel(block: RoomUnitBlock) {
  if (block.source === "external") return block.guest_name || "외부 예약";
  if (block.status === "tentative") return block.guest_name || "결제 대기";
  return block.guest_name || "확정 예약";
}

function blockKindLabel(block: RoomUnitBlock) {
  if (block.source === "external") return "외부 예약";
  if (block.status === "tentative") return "결제 대기";
  return "확정 예약";
}

function segmentTone(block: RoomUnitBlock) {
  if (block.source === "external") return "bg-gray-400 text-white";
  if (block.status === "tentative") return "bg-yellow-300 text-yellow-950";
  return "bg-indigo-500 text-white";
}

function agendaTone(block: RoomUnitBlock) {
  if (block.source === "external") {
    return "border-gray-300 bg-gray-50 text-gray-800";
  }
  if (block.status === "tentative") {
    return "border-yellow-300 bg-yellow-50 text-yellow-900";
  }
  return "border-indigo-200 bg-indigo-50 text-indigo-900";
}

function statusLabel(status: RoomUnitWithRoom["status"]) {
  if (status === "active") return "운영 중";
  if (status === "maintenance") return "점검";
  return "비활성";
}

function buildWeekSegments(blocks: RoomUnitBlock[], week: CalendarWeek) {
  const laneEnds: string[] = [];
  const visible: WeekSegment[] = [];
  const overflowByDate = new Map<string, number>();

  const weekBlocks = blocks
    .filter((block) =>
      overlaps(block.check_in_date, occupancyEnd(block), week.start, week.end)
    )
    .sort(
      (a, b) =>
        a.check_in_date.localeCompare(b.check_in_date) ||
        a.check_out_date.localeCompare(b.check_out_date)
    );

  for (const block of weekBlocks) {
    const blockEnd = occupancyEnd(block);
    const segmentStart = block.check_in_date > week.start ? block.check_in_date : week.start;
    const segmentEnd = blockEnd < week.end ? blockEnd : week.end;
    const lane = laneEnds.findIndex((end) => end <= segmentStart);
    const assignedLane = lane === -1 ? laneEnds.length : lane;

    if (assignedLane >= MAX_VISIBLE_LANES) {
      for (
        let date = segmentStart;
        date < segmentEnd;
        date = formatDate(addDays(parseDate(date), 1))
      ) {
        overflowByDate.set(date, (overflowByDate.get(date) ?? 0) + 1);
      }
      continue;
    }

    laneEnds[assignedLane] = segmentEnd;
    visible.push({
      block,
      startIndex: daysBetween(week.start, segmentStart),
      span: Math.max(1, daysBetween(segmentStart, segmentEnd)),
      lane: assignedLane,
      startsHere: block.check_in_date >= week.start,
      endsHere: blockEnd <= week.end,
    });
  }

  return { visible, overflowByDate };
}

export function AvailabilityManager({
  rooms,
  units,
  blocks,
  initialRoomId,
  initialRoomUnitId,
  initialFrom,
  initialTo,
}: {
  rooms: RoomOption[];
  units: RoomUnitWithRoom[];
  blocks: RoomUnitBlock[];
  initialRoomId?: string;
  initialRoomUnitId?: string;
  initialFrom?: string;
  initialTo?: string;
}) {
  const router = useRouter();
  const initialDate = initialFrom ? parseDate(initialFrom) : new Date();
  const firstActiveUnit = units.find((unit) => unit.status === "active") ?? units[0];
  const initialUnit =
    units.find((unit) => unit.id === initialRoomUnitId) ??
    units.find((unit) => unit.room_id === initialRoomId && unit.status === "active") ??
    units.find((unit) => unit.room_id === initialRoomId) ??
    firstActiveUnit;

  const [anchorDate, setAnchorDate] = useState(startOfMonth(initialDate));
  const [selectedRoomId, setSelectedRoomId] = useState(
    initialUnit?.room_id ?? initialRoomId ?? rooms[0]?.id ?? ""
  );
  const [selectedUnitId, setSelectedUnitId] = useState(initialUnit?.id ?? "");
  const [selectedDate, setSelectedDate] = useState(
    initialFrom ?? formatDate(initialDate)
  );
  const [modal, setModal] = useState<ModalState>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [blockForm, setBlockForm] = useState({
    room_unit_id: initialUnit?.id ?? "",
    guest_name: "",
    check_in_date: initialFrom ?? formatDate(initialDate),
    check_out_date: initialTo ?? formatDate(addDays(initialDate, 1)),
    notes: "",
  });

  const selectedUnit = units.find((unit) => unit.id === selectedUnitId) ?? null;
  const selectedUnitBlocks = useMemo(
    () =>
      blocks
        .filter(
          (block) =>
            block.room_unit_id === selectedUnit?.id && block.status !== "cancelled"
        )
        .sort((a, b) => a.check_in_date.localeCompare(b.check_in_date)),
    [blocks, selectedUnit?.id]
  );

  const calendar = useMemo(() => getWeeks(startOfMonth(anchorDate)), [anchorDate]);
  const selectedDateBlocks = selectedUnitBlocks.filter((block) =>
    containsDate(block, selectedDate)
  );
  const selectedDateIsUnavailable =
    selectedUnit?.status !== "active" || selectedDateBlocks.length > 0;

  function handleUnitChange(unitId: string) {
    const nextUnit = units.find((unit) => unit.id === unitId);
    setSelectedRoomId(nextUnit?.room_id ?? "");
    setSelectedUnitId(unitId);
    setBlockForm((prev) => ({ ...prev, room_unit_id: unitId }));
  }

  function moveMonth(direction: -1 | 1) {
    setAnchorDate((current) =>
      startOfMonth(
        new Date(
          Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + direction, 1)
        )
      )
    );
  }

  function goToday() {
    const today = new Date();
    setAnchorDate(startOfMonth(today));
    setSelectedDate(formatDate(today));
  }

  function openCreate(date = selectedDate) {
    if (!selectedUnit) return;
    setBlockForm({
      room_unit_id: selectedUnit.id,
      guest_name: "",
      check_in_date: date,
      check_out_date: formatDate(addDays(parseDate(date), 1)),
      notes: "",
    });
    setModal({ kind: "create" });
    setError("");
  }

  function openBlock(block: RoomUnitBlock) {
    setBlockForm({
      room_unit_id: block.room_unit_id,
      guest_name: block.guest_name,
      check_in_date: block.check_in_date,
      check_out_date: block.check_out_date,
      notes: block.notes,
    });
    setModal({ kind: "block", block });
    setError("");
  }

  async function submitJson(
    label: string,
    url: string,
    method: "POST" | "PUT" | "DELETE",
    body?: unknown
  ) {
    setBusy(label);
    setError("");
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `${label} failed`);
        return false;
      }
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : `${label} failed`);
      return false;
    } finally {
      setBusy("");
    }
  }

  async function createBlock(e: FormEvent) {
    e.preventDefault();
    const ok = await submitJson(
      "create-block",
      "/api/admin/room-unit-blocks",
      "POST",
      {
        ...blockForm,
        source: "external",
        status: "confirmed",
      }
    );
    if (ok) setModal(null);
  }

  async function updateBlock(e: FormEvent, block: RoomUnitBlock) {
    e.preventDefault();
    const ok = await submitJson(
      "update-block",
      `/api/admin/room-unit-blocks/${block.id}`,
      "PUT",
      {
        room_unit_id: blockForm.room_unit_id,
        guest_name: blockForm.guest_name,
        check_in_date: blockForm.check_in_date,
        check_out_date: blockForm.check_out_date,
        notes: blockForm.notes,
      }
    );
    if (ok) setModal(null);
  }

  const title = anchorDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <select
              aria-label="객실 번호"
              value={selectedUnitId}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">객실 번호 선택</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({statusLabel(unit.status)})
                </option>
              ))}
            </select>
          <button
            type="button"
            onClick={() => openCreate()}
            disabled={!selectedUnit}
            className="rounded-lg border border-transparent bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            외부 예약 추가
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="shrink-0 text-xl font-bold text-gray-900 sm:text-xl">
            {title}
          </h2>
          <div className="grid shrink-0 grid-cols-3 gap-1.5 sm:flex sm:gap-2">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:px-3"
            >
              이전
            </button>
            <button
              type="button"
              onClick={goToday}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:px-3"
            >
              오늘
            </button>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              className="rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:px-3"
            >
              다음
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-y border-gray-200 bg-gray-50 text-center text-xs font-bold text-gray-600">
          {WEEKDAY_LABELS.map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="border-l border-gray-200">
          {calendar.weeks.map((week) => {
            const segments = buildWeekSegments(selectedUnitBlocks, week);
            return (
              <div key={week.start} className="relative grid grid-cols-7">
                {week.days.map((date) => {
                  const day = parseDate(date);
                  const isCurrentMonth =
                    calendar.monthStart <= date && date < calendar.monthEnd;
                  const isSelected = selectedDate === date;
                  const isRequestRange = isInRange(date, initialFrom, initialTo);
                  const isInactive = selectedUnit?.status !== "active";
                  const overflow = segments.overflowByDate.get(date) ?? 0;
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={`relative min-h-20 border-b border-r border-gray-200 p-1.5 text-left transition sm:min-h-28 sm:p-2 ${
                        isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"
                      } ${isSelected ? "ring-2 ring-inset ring-indigo-500" : ""} ${
                        isToday(date) ? "bg-indigo-50" : ""
                      } ${
                        isRequestRange ? "shadow-[inset_0_0_0_2px_#bbf7d0]" : ""
                      } ${
                        isInactive
                          ? "bg-red-50 bg-[repeating-linear-gradient(45deg,#fee2e2_0,#fee2e2_4px,#fff_4px,#fff_8px)]"
                          : "hover:bg-green-50"
                      }`}
                    >
                      <span className="absolute left-1.5 top-1 text-sm font-semibold leading-none text-gray-900 sm:left-2 sm:top-2">
                        {day.getUTCDate()}
                      </span>
                      {overflow > 0 && (
                        <span className="absolute bottom-1 right-1 rounded-full bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          +{overflow}
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="pointer-events-none absolute inset-x-0 top-8 grid grid-cols-7 gap-0 sm:top-10">
                  {segments.visible.map((segment) => (
                    <button
                      key={`${segment.block.id}-${week.start}`}
                      type="button"
                      onClick={() => {
                        setSelectedDate(
                          week.days[segment.startIndex] ?? segment.block.check_in_date
                        );
                      }}
                      className={`pointer-events-auto mx-0.5 h-5 truncate px-1 text-left text-[11px] font-semibold leading-5 sm:h-6 sm:text-[13px] sm:leading-6 ${segmentTone(
                        segment.block
                      )} ${segment.startsHere ? "rounded-l-full" : "rounded-l-none"} ${
                        segment.endsHere ? "rounded-r-full" : "rounded-r-none"
                      }`}
                      style={{
                        gridColumn: `${segment.startIndex + 1} / span ${segment.span}`,
                        gridRow: segment.lane + 1,
                      }}
                      title={`${blockLabel(segment.block)}: ${segment.block.check_in_date} ~ ${segment.block.check_out_date}`}
                    >
                      <span>
                        {segment.startsHere ? blockLabel(segment.block) : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {selectedDate} 예약
            </h2>
            <p className="text-sm text-gray-500">
              {selectedUnit ? selectedUnit.name : "선택된 객실 없음"}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              selectedDateIsUnavailable
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {selectedDateIsUnavailable ? "예약 있음" : "예약 가능"}
          </span>
        </div>

        {!selectedUnit ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            선택된 객실 번호가 없습니다. 먼저 객실 번호를 등록하거나 다른 객실 타입을 선택하세요.
          </div>
        ) : selectedUnit.status !== "active" ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            이 객실은 현재 {statusLabel(selectedUnit.status)} 상태입니다.
          </div>
        ) : selectedDateBlocks.length === 0 ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            예약 없음
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDateBlocks.map((block) => (
              <button
                key={block.id}
                type="button"
                onClick={() => openBlock(block)}
                className={`block w-full rounded-lg border px-3 py-2 text-left text-sm ${agendaTone(block)}`}
              >
                <span className="text-base font-semibold sm:text-lg">
                  {blockLabel(block)}
                </span>
                <span className="ml-2 text-xs">{blockKindLabel(block)}</span>
                {block.check_out_date === selectedDate && (
                  <span className="ml-2 rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium">
                    청소일 (퇴실)
                  </span>
                )}
                <span className="mt-1 block text-xs">
                  입실일 {block.check_in_date} · 퇴실일 {block.check_out_date}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
        <Legend color="bg-indigo-500" label="확정 예약" />
        <Legend color="bg-yellow-400" label="결제 대기" />
        <Legend color="bg-gray-400" label="외부 예약" />
        <Legend color="bg-red-100 border border-red-300" label="비활성 / 점검" />
      </div>

      {modal && (
        <BlockModal
          modal={modal}
          rooms={rooms}
          units={units}
          form={blockForm}
          busy={busy}
          error={error}
          setForm={setBlockForm}
          onClose={() => {
            setModal(null);
            setError("");
          }}
          onCreate={createBlock}
          onUpdate={updateBlock}
          onCancel={(block) =>
            submitJson(
              "cancel-block",
              `/api/admin/room-unit-blocks/${block.id}`,
              "DELETE"
            ).then((ok) => {
              if (ok) setModal(null);
            })
          }
        />
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function BlockModal({
  modal,
  rooms,
  units,
  form,
  busy,
  error,
  setForm,
  onClose,
  onCreate,
  onUpdate,
  onCancel,
}: {
  modal: Exclude<ModalState, null>;
  rooms: RoomOption[];
  units: RoomUnitWithRoom[];
  form: {
    room_unit_id: string;
    guest_name: string;
    check_in_date: string;
    check_out_date: string;
    notes: string;
  };
  busy: string;
  error: string;
  setForm: Dispatch<
    SetStateAction<{
      room_unit_id: string;
      guest_name: string;
      check_in_date: string;
      check_out_date: string;
      notes: string;
    }>
  >;
  onClose: () => void;
  onCreate: (e: FormEvent) => void;
  onUpdate: (e: FormEvent, block: RoomUnitBlock) => void;
  onCancel: (block: RoomUnitBlock) => Promise<void>;
}) {
  const isExisting = modal.kind === "block";
  const block = isExisting ? modal.block : null;
  const canEditDetails = !block || block.source === "external";
  const canChangeRoom = !block || block.source === "external" || block.source === "direct";
  const selectedUnit = units.find((unit) => unit.id === form.room_unit_id) ?? null;
  const selectedRoomId = selectedUnit?.room_id ?? rooms[0]?.id ?? "";
  const modalRoomUnits = units.filter((unit) => unit.room_id === selectedRoomId);

  function changeModalRoomType(roomId: string) {
    const nextUnit =
      units.find((unit) => unit.room_id === roomId && unit.status === "active") ??
      units.find((unit) => unit.room_id === roomId);
    setForm((prev) => ({ ...prev, room_unit_id: nextUnit?.id ?? "" }));
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <form
        onSubmit={(e) => (block ? onUpdate(e, block) : onCreate(e))}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {block ? "예약 상세" : "외부 예약 추가"}
            </h2>
            <p className="text-sm text-gray-500">
              {block
                ? `${blockKindLabel(block)} / ${block.status === "tentative" ? "결제 대기" : "확정"}`
                : "외부 예약 / 확정"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-gray-400 hover:text-gray-600"
            aria-label="닫기"
          >
            x
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <select
              aria-label="객실 타입"
              value={selectedRoomId}
              disabled={!canChangeRoom}
              onChange={(e) => changeModalRoomType(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              required
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {roomNameKo(room)}
                </option>
              ))}
            </select>
            <select
              aria-label="객실 번호"
              value={form.room_unit_id}
              disabled={!canChangeRoom}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, room_unit_id: e.target.value }))
              }
              className="block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              required
            >
              {modalRoomUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>

          {canEditDetails ? (
            <RangeCalendar
              checkIn={form.check_in_date}
              checkOut={form.check_out_date}
              onChange={(checkIn, checkOut) =>
                setForm((prev) => ({
                  ...prev,
                  check_in_date: checkIn,
                  check_out_date: checkOut,
                }))
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DateInput label="입실일" value={form.check_in_date} disabled />
              <DateInput label="퇴실일" value={form.check_out_date} disabled />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
              고객명 또는 플랫폼
            </label>
            <input
              value={form.guest_name}
              disabled={!canEditDetails}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, guest_name: e.target.value }))
              }
              className="block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              placeholder="Agoda / Booking.com / 고객명"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
              메모
            </label>
            <textarea
              rows={3}
              value={form.notes}
              disabled={!canEditDetails}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        {!canEditDetails && (
          <p className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            직접 예약의 날짜와 고객 정보는 예약 요청에서 관리됩니다. 이 화면에서는 객실 번호만 변경할 수 있습니다.
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {block ? (
            <button
              type="button"
              onClick={() => onCancel(block)}
              disabled={busy === "cancel-block"}
              className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {busy === "cancel-block" ? "취소 중..." : "예약 차단 취소"}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              닫기
            </button>
            {canChangeRoom && (
              <button
                type="submit"
                disabled={busy === "create-block" || busy === "update-block"}
                className="rounded-lg border border-transparent bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
                {busy ? "저장 중..." : block ? "변경사항 저장" : "외부 예약 추가"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function DateInput({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
        {label}
      </label>
      <input
        type="date"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
        required
      />
    </div>
  );
}

function RangeCalendar({
  checkIn,
  checkOut,
  onChange,
}: {
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
}) {
  const [anchor, setAnchor] = useState(() =>
    startOfMonth(parseDate(checkIn || formatDate(new Date())))
  );
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const calendar = useMemo(() => getWeeks(startOfMonth(anchor)), [anchor]);

  function moveMonth(direction: -1 | 1) {
    setAnchor((current) =>
      startOfMonth(
        new Date(
          Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + direction, 1)
        )
      )
    );
  }

  function selectDate(date: string) {
    // First click (or a click at/before the pending start) begins a new range
    // with a provisional one-night stay; the next later click sets check-out.
    if (pendingStart === null || date <= pendingStart) {
      setPendingStart(date);
      onChange(date, formatDate(addDays(parseDate(date), 1)));
      return;
    }
    onChange(pendingStart, date);
    setPendingStart(null);
  }

  const title = anchor.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  const nights = daysBetween(checkIn, checkOut);

  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            이전
          </button>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            다음
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] font-bold text-gray-500">
        {WEEKDAY_LABELS.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendar.weeks.flatMap((week) =>
          week.days.map((date) => {
            const day = parseDate(date);
            const isCurrentMonth =
              calendar.monthStart <= date && date < calendar.monthEnd;
            const isStart = date === checkIn;
            const isEnd = date === checkOut;
            const isMiddle = checkIn < date && date < checkOut;

            const tone = [
              "relative h-9 text-sm transition",
              isCurrentMonth ? "text-gray-900" : "text-gray-300",
            ];
            if (isStart || isEnd) {
              tone.push("bg-indigo-600 font-semibold text-white");
              tone.push(isStart ? "rounded-l-lg" : "rounded-r-lg");
            } else if (isMiddle) {
              tone.push("bg-indigo-100 text-indigo-900");
            } else {
              tone.push("hover:bg-gray-100");
            }

            return (
              <button
                key={date}
                type="button"
                onClick={() => selectDate(date)}
                className={tone.join(" ")}
              >
                {day.getUTCDate()}
              </button>
            );
          })
        )}
      </div>

      <p className="mt-2 text-xs text-gray-600">
        {checkIn && checkOut
          ? `입실 ${checkIn} · 퇴실 ${checkOut} · ${nights}박`
          : "입실일을 선택하세요"}
      </p>
    </div>
  );
}
