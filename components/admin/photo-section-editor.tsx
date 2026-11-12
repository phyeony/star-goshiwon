"use client";

import { useState } from "react";
import type { SitePhoto } from "@/lib/site-photos";
import { thumbSrc, type AdminPhoto, type AdminSection } from "./photo-types";
import { PhotoUploader } from "./photo-uploader";

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function PhotoSectionEditor({
  section,
  photos,
  photoById,
  usage,
  draft,
  savedIds,
  onDraftChange,
  onSaved,
  onUploaded,
}: {
  section: AdminSection;
  photos: AdminPhoto[];
  photoById: Map<string, AdminPhoto>;
  usage: Map<string, string[]>;
  draft: string[];
  savedIds: string[];
  onDraftChange: (ids: string[]) => void;
  onSaved: (ids: string[]) => void;
  onUploaded: (photo: SitePhoto) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [onlyUnused, setOnlyUnused] = useState(false);

  const isRoom = section.kind === "room";
  const chosen = draft.map((id) => photoById.get(id)).filter((p): p is AdminPhoto => Boolean(p));
  const dirty = draft.length !== savedIds.length || draft.some((id, i) => id !== savedIds[i]);
  const available = photos.filter(
    (p) => !draft.includes(p.id) && (!onlyUnused || !usage.get(p.id)?.length)
  );

  function change(ids: string[]) {
    setMessage(null);
    onDraftChange(ids);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/photo-sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: section.key, photoIds: draft }),
      });
      if (!res.ok) throw new Error();
      onSaved(draft);
      setMessage({ ok: true, text: "저장했어요. 사이트에 바로 반영돼요." });
    } catch {
      setMessage({ ok: false, text: "저장하지 못했어요. 다시 시도해 주세요." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="sticky top-16 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:bg-white sm:px-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
          <p className="text-sm text-gray-500">
            {isRoom
              ? "첫 번째 사진이 대표 사진이에요 (방 목록과 링크 미리보기에 쓰여요)."
              : "사진 설명이 사진 위 이름으로 표시돼요 (영어 사이트는 영어, /ko는 한국어)."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {message && (
            <span className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</span>
          )}
          <button
            type="button"
            onClick={() => change(savedIds)}
            disabled={!dirty || saving}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            되돌리기
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>

      <section>
        <h3 className="mb-1 font-semibold text-gray-900">사이트에 보이는 사진 ({chosen.length})</h3>
        <p className="mb-3 text-sm text-gray-500">끌어서 순서를 바꾸거나 화살표를 누르세요.</p>
        {chosen.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            아직 고른 사진이 없어요. 아래 보관함에서 추가하세요.
            {!isRoom && " 사진이 없으면 이 섹션은 사이트에서 숨겨져요."}
          </div>
        ) : (
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {chosen.map((photo, index) => (
              <li
                key={photo.id}
                draggable
                onDragStart={(e) => {
                  setDragIndex(index);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null && dragIndex !== index) {
                    change(move(draft, dragIndex, index));
                    setDragIndex(index);
                  }
                }}
                onDragEnd={() => setDragIndex(null)}
                className={`group overflow-hidden rounded-xl border bg-white shadow-sm ${
                  dragIndex === index ? "border-indigo-500 opacity-60" : "border-gray-200"
                }`}
                data-testid="section-photo"
              >
                <div className="relative cursor-grab bg-gray-100 active:cursor-grabbing">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbSrc(photo)}
                    alt={photo.caption_ko || photo.caption_en || ""}
                    draggable={false}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-bold text-white">
                    {index + 1}
                    {isRoom && index === 0 ? " · 대표" : ""}
                  </span>
                </div>
                <div className="p-2">
                  <p className="truncate text-sm text-gray-800" title={photo.caption_ko}>
                    {photo.caption_ko || <span className="text-amber-600">한국어 설명 없음</span>}
                  </p>
                  <p className="truncate text-xs text-gray-500" title={photo.caption_en}>
                    {photo.caption_en || <span className="text-amber-600">No English caption</span>}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => change(move(draft, index, index - 1))}
                        disabled={index === 0}
                        aria-label="앞으로"
                        className="rounded-md border border-gray-300 px-2 py-0.5 text-gray-700 hover:bg-gray-50 disabled:opacity-30"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => change(move(draft, index, index + 1))}
                        disabled={index === chosen.length - 1}
                        aria-label="뒤로"
                        className="rounded-md border border-gray-300 px-2 py-0.5 text-gray-700 hover:bg-gray-50 disabled:opacity-30"
                      >
                        →
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => change(draft.filter((id) => id !== photo.id))}
                      className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      빼기
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h3 className="mb-3 font-semibold text-gray-900">새 사진 올려서 추가</h3>
        <PhotoUploader
          onUploaded={onUploaded}
          hint={`올린 사진은 보관함에 저장되고 '${section.title}' 맨 뒤에 추가돼요. 저장을 눌러야 사이트에 보여요.`}
        />
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-900">보관함에서 추가 ({available.length})</h3>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={onlyUnused} onChange={(e) => setOnlyUnused(e.target.checked)} />
            다른 곳에 안 쓰인 사진만
          </label>
        </div>
        {available.length === 0 ? (
          <p className="text-sm text-gray-500">추가할 수 있는 사진이 없어요.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {available.map((photo) => {
              const usedIn = usage.get(photo.id) ?? [];
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => change([...draft, photo.id])}
                  className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 text-left"
                  title={[photo.caption_ko, photo.caption_en].filter(Boolean).join(" / ")}
                  data-testid="library-pick"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbSrc(photo)}
                    alt={photo.caption_ko || photo.caption_en || ""}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition group-hover:opacity-80"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1 pt-4 text-xs text-white">
                    <span className="block truncate">{photo.caption_ko || photo.caption_en || "설명 없음"}</span>
                    {usedIn.length > 0 && <span className="block truncate text-white/70">{usedIn.join(", ")}</span>}
                  </span>
                  <span className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold leading-none text-white shadow">
                    +
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
