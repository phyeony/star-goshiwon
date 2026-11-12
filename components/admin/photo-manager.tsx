"use client";

import { useEffect, useMemo, useState } from "react";
import { photoSrc, type SitePhoto } from "@/lib/site-photos";
import {
  thumbSrc,
  type AdminPhoto,
  type AdminRoomUnit,
  type AdminSection,
} from "./photo-types";
import { PhotoUploader } from "./photo-uploader";
import { RoomUnitSelect, unitRank } from "./photo-room-unit";
import { PhotoSectionEditor } from "./photo-section-editor";

const LIBRARY_TAB = "library";

function sameOrder(a: string[], b: string[]) {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

export function PhotoManager({
  initialPhotos,
  initialSections,
  photosBase,
  roomUnits,
}: {
  initialPhotos: AdminPhoto[];
  initialSections: AdminSection[];
  photosBase: string;
  roomUnits: AdminRoomUnit[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  // What is saved on the site, and the admin's unsaved edits, per section.
  const [saved, setSaved] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(initialSections.map((s) => [s.key, s.photoIds]))
  );
  const [drafts, setDrafts] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(initialSections.map((s) => [s.key, s.photoIds]))
  );
  const [tab, setTab] = useState<string>(LIBRARY_TAB);

  const dirtyKeys = useMemo(
    () => initialSections.filter((s) => !sameOrder(saved[s.key] ?? [], drafts[s.key] ?? [])).map((s) => s.key),
    [initialSections, saved, drafts]
  );

  useEffect(() => {
    if (dirtyKeys.length === 0) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirtyKeys.length]);

  const photoById = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos]);

  /** Section titles each photo is shown in (saved state, i.e. live on the site). */
  const usage = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const section of initialSections) {
      for (const id of saved[section.key] ?? []) {
        map.set(id, [...(map.get(id) ?? []), section.title]);
      }
    }
    return map;
  }, [initialSections, saved]);

  function addUploaded(photo: SitePhoto) {
    const withSrc: AdminPhoto = { ...photo, src: photoSrc(photo, photosBase) };
    setPhotos((list) => [withSrc, ...list.filter((p) => p.id !== photo.id)]);
    return withSrc;
  }

  function replacePhoto(photo: SitePhoto) {
    setPhotos((list) =>
      list.map((p) => (p.id === photo.id ? { ...photo, src: photoSrc(photo, photosBase) } : p))
    );
  }

  function removePhoto(id: string) {
    setPhotos((list) => list.filter((p) => p.id !== id));
    const strip = (map: Record<string, string[]>) =>
      Object.fromEntries(Object.entries(map).map(([k, ids]) => [k, ids.filter((x) => x !== id)]));
    setSaved(strip);
    setDrafts(strip);
  }

  const activeSection = initialSections.find((s) => s.key === tab) ?? null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">사진 관리</h1>
        <p className="mt-2 text-gray-600">
          사진을 올려 보관함에 모아 두고, 각 섹션에 보여 줄 사진과 순서를 고르세요. 영어 사이트와 한국어 사이트(/ko)에 똑같이 적용돼요.
        </p>
      </div>

      <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div role="tablist" className="flex min-w-max gap-2 border-b border-gray-200">
          {[
            { key: LIBRARY_TAB, title: "보관함", count: photos.length },
            ...initialSections.map((s) => ({ key: s.key, title: s.title, count: (drafts[s.key] ?? []).length })),
          ].map((t) => {
            const active = tab === t.key;
            const dirty = dirtyKeys.includes(t.key);
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 font-semibold transition ${
                  active ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {t.title} <span className="font-normal text-gray-400">{t.count}</span>
                {dirty && (
                  <span className="ml-1 inline-block h-2 w-2 rounded-full bg-amber-500 align-middle" title="저장 안 된 변경" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {activeSection ? (
        <PhotoSectionEditor
          key={activeSection.key}
          section={activeSection}
          photos={photos}
          roomUnits={roomUnits}
          photoById={photoById}
          usage={usage}
          draft={drafts[activeSection.key] ?? []}
          savedIds={saved[activeSection.key] ?? []}
          onDraftChange={(ids) => setDrafts((d) => ({ ...d, [activeSection.key]: ids }))}
          onSaved={(ids) => setSaved((s) => ({ ...s, [activeSection.key]: ids }))}
          onUploaded={(photo) => {
            const added = addUploaded(photo);
            setDrafts((d) => ({ ...d, [activeSection.key]: [...(d[activeSection.key] ?? []), added.id] }));
          }}
        />
      ) : (
        <PhotoLibrary
          photos={photos}
          roomUnits={roomUnits}
          usage={usage}
          onUploaded={addUploaded}
          onChanged={replacePhoto}
          onDeleted={removePhoto}
        />
      )}
    </div>
  );
}

function PhotoLibrary({
  photos,
  roomUnits,
  usage,
  onUploaded,
  onChanged,
  onDeleted,
}: {
  photos: AdminPhoto[];
  roomUnits: AdminRoomUnit[];
  usage: Map<string, string[]>;
  onUploaded: (photo: SitePhoto) => void;
  onChanged: (photo: SitePhoto) => void;
  onDeleted: (id: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "unused">("all");
  // "all", "" (no room number) or a room_units id.
  const [unitFilter, setUnitFilter] = useState("all");
  const [sort, setSort] = useState<"recent" | "room">("recent");
  const rankOf = useMemo(() => unitRank(roomUnits), [roomUnits]);

  const shown = photos
    .filter((p) => filter === "all" || !usage.get(p.id)?.length)
    .filter((p) => unitFilter === "all" || (p.room_unit_id ?? "") === unitFilter);
  if (sort === "room") {
    // Stable sort keeps newest-first within each room number.
    shown.sort((a, b) => rankOf(a) - rankOf(b));
  }
  const unusedCount = photos.filter((p) => !usage.get(p.id)?.length).length;

  return (
    <div className="space-y-6">
      <PhotoUploader onUploaded={onUploaded} />

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["all", `전체 ${photos.length}`],
            ["unused", `사용 안 함 ${unusedCount}`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
              filter === value ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            {label}
          </button>
        ))}
        <RoomUnitSelect
          units={roomUnits}
          value={unitFilter}
          onChange={setUnitFilter}
          emptyLabel="방 번호 없음"
          extraOptions={[{ value: "all", label: "모든 방 번호" }]}
          ariaLabel="방 번호로 거르기"
          className="text-sm"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "recent" | "room")}
          aria-label="정렬"
          className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="recent">최근 올린 순</option>
          <option value="room">방 번호 순</option>
        </select>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          {filter === "unused" ? "모든 사진이 사이트에 쓰이고 있어요." : "아직 사진이 없어요."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((photo) => (
            <LibraryCard
              key={photo.id}
              photo={photo}
              roomUnits={roomUnits}
              usedIn={usage.get(photo.id) ?? []}
              onChanged={onChanged}
              onDeleted={onDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryCard({
  photo,
  roomUnits,
  usedIn,
  onChanged,
  onDeleted,
}: {
  photo: AdminPhoto;
  roomUnits: AdminRoomUnit[];
  usedIn: string[];
  onChanged: (photo: SitePhoto) => void;
  onDeleted: (id: string) => void;
}) {
  const [en, setEn] = useState(photo.caption_en);
  const [ko, setKo] = useState(photo.caption_ko);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const dirty = en.trim() !== photo.caption_en || ko.trim() !== photo.caption_ko;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/photos/${photo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption_en: en, caption_ko: ko }),
      });
      const body = (await res.json().catch(() => ({}))) as SitePhoto & { error?: string };
      if (!res.ok) throw new Error(body.error);
      onChanged(body);
      setEn(body.caption_en);
      setKo(body.caption_ko);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch {
      setError("저장하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function setRoomUnit(value: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/photos/${photo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_unit_id: value || null }),
      });
      const body = (await res.json().catch(() => ({}))) as SitePhoto & { error?: string };
      if (!res.ok) throw new Error(body.error);
      onChanged(body);
    } catch {
      setError("방 번호를 저장하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const where = usedIn.length ? `\n지금 쓰이는 곳: ${usedIn.join(", ")} (여기서도 빠져요)` : "";
    const note =
      photo.source === "static"
        ? "\n(사이트에 원래 있던 사진이라 파일은 코드에 남고, 보관함에서만 빠져요.)"
        : "";
    if (!window.confirm(`이 사진을 삭제할까요?${where}${note}`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/photos/${photo.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDeleted(photo.id);
    } catch {
      setError("삭제하지 못했어요.");
      setBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm" data-testid="library-card">
      <a href={photo.src} target="_blank" rel="noreferrer" className="block bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbSrc(photo, 640)}
          alt={photo.caption_ko || photo.caption_en || ""}
          loading="lazy"
          className="aspect-[4/3] w-full object-cover"
        />
      </a>
      <div className="space-y-2 p-3">
        <div className="flex flex-wrap gap-1">
          {usedIn.length ? (
            usedIn.map((title) => (
              <span key={title} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {title}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">사용 안 함</span>
          )}
        </div>
        <label className="block">
          <span className="text-xs font-semibold text-gray-500">방 번호</span>
          <RoomUnitSelect
            units={roomUnits}
            value={photo.room_unit_id ?? ""}
            onChange={setRoomUnit}
            emptyLabel="없음 (공용 공간 등)"
            disabled={busy}
            ariaLabel="방 번호"
            className="mt-0.5 block w-full"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-500">한국어 설명</span>
          <input
            value={ko}
            onChange={(e) => setKo(e.target.value)}
            maxLength={200}
            placeholder="예: 공용 주방"
            className="mt-0.5 w-full rounded-lg border border-gray-300 px-2 py-1.5 focus:border-indigo-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-500">English caption</span>
          <input
            value={en}
            onChange={(e) => setEn(e.target.value)}
            maxLength={200}
            placeholder="e.g. Shared Kitchen"
            className="mt-0.5 w-full rounded-lg border border-gray-300 px-2 py-1.5 focus:border-indigo-500 focus:outline-none"
          />
        </label>
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            삭제
          </button>
          <div className="flex items-center gap-2">
            {savedFlash && <span className="text-sm text-green-700">저장됨</span>}
            {dirty && (
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                설명 저장
              </button>
            )}
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
