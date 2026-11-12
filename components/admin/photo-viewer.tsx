"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { thumbSrc, type AdminPhoto } from "./photo-types";

/** Full-size view of one library photo, with previous/next through the shown list. */
export function PhotoViewer({
  photos,
  currentId,
  unitName,
  usage,
  selected,
  onToggle,
  onNavigate,
  onClose,
}: {
  photos: AdminPhoto[];
  currentId: string;
  unitName: Map<string, string>;
  usage: Map<string, string[]>;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onNavigate: (id: string) => void;
  onClose: () => void;
}) {
  const index = Math.max(0, photos.findIndex((p) => p.id === currentId));
  const photo = photos[index];
  const count = photos.length;
  const go = (step: number) => onNavigate(photos[(index + step + count) % count].id);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && count > 1) go(1);
      else if (e.key === "ArrowLeft" && count > 1) go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const room = photo.room_unit_id ? unitName.get(photo.room_unit_id) : null;
  const usedIn = usage.get(photo.id) ?? [];
  const isSelected = selected.has(photo.id);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사진 크게 보기"
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      onClick={onClose}
      data-testid="photo-viewer"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
        <span className="text-sm text-white/70">
          {index + 1} / {count}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggle(photo.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              isSelected ? "bg-indigo-600 text-white" : "bg-white/15 text-white hover:bg-white/25"
            }`}
          >
            {isSelected ? "✓ 선택됨" : "선택"}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xl hover:bg-white/25"
          >
            ×
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.id}
          src={thumbSrc(photo, 1600)}
          alt={photo.caption_ko || photo.caption_en || ""}
          className="max-h-full max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="이전 사진"
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-2xl text-white hover:bg-black/70"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="다음 사진"
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-2xl text-white hover:bg-black/70"
            >
              ›
            </button>
          </>
        )}
      </div>

      <div className="px-4 py-3 text-center text-white" onClick={(e) => e.stopPropagation()}>
        <p className="font-medium">
          {room ? `${room}호 · ` : ""}
          {photo.caption_ko || <span className="text-white/50">한국어 설명 없음</span>}
        </p>
        {photo.caption_en && <p className="text-sm text-white/70">{photo.caption_en}</p>}
        <p className="mt-1 text-xs text-white/50">{usedIn.length ? usedIn.join(", ") : "사용 안 함"}</p>
      </div>
    </div>,
    document.body
  );
}
