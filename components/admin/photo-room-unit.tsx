"use client";

import type { AdminPhoto, AdminRoomUnit } from "./photo-types";

/** Room-number dropdown, grouped by room type. "" means no room number. */
export function RoomUnitSelect({
  units,
  value,
  onChange,
  emptyLabel,
  extraOptions = [],
  disabled,
  className = "",
  ariaLabel,
}: {
  units: AdminRoomUnit[];
  value: string;
  onChange: (value: string) => void;
  emptyLabel: string;
  extraOptions?: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
  ariaLabel: string;
}) {
  const groups = new Map<string, AdminRoomUnit[]>();
  for (const unit of units) groups.set(unit.roomTitle, [...(groups.get(unit.roomTitle) ?? []), unit]);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`rounded-lg border border-gray-300 bg-white px-2 py-1.5 focus:border-indigo-500 focus:outline-none disabled:opacity-50 ${className}`}
    >
      {extraOptions.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
      <option value="">{emptyLabel}</option>
      {[...groups.entries()].map(([title, list]) =>
        groups.size > 1 ? (
          <optgroup key={title} label={title}>
            {list.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}호
              </option>
            ))}
          </optgroup>
        ) : (
          list.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}호
            </option>
          ))
        )
      )}
    </select>
  );
}

/** Sort key: room numbers in room-type order, untagged photos last. */
export function unitRank(units: AdminRoomUnit[]) {
  const rank = new Map(units.map((u, i) => [u.id, i]));
  return (photo: AdminPhoto) => (photo.room_unit_id ? rank.get(photo.room_unit_id) ?? units.length : units.length + 1);
}
