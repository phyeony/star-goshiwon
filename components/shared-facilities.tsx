"use client";

import { useState, useEffect, useCallback } from "react";
import { OptimizedPhoto } from "./optimized-photo";
import type { DisplayPhoto } from "@/lib/site-photos";

/** Photos and their order come from admin → 사진 관리 (공용 공간).
 * lang="ko" uses Korean labels and the square-cornered /ko look (3 columns). */
export function SharedFacilities({
  photos: facilities,
  lang = "en",
}: {
  photos: DisplayPhoto[];
  lang?: "en" | "ko";
}) {
  const ko = lang === "ko";
  const label = (item: DisplayPhoto) =>
    (ko ? item.caption_ko || item.caption_en : item.caption_en || item.caption_ko);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const isOpen = lightboxIndex !== null;

  const close = useCallback(() => setLightboxIndex(null), []);

  const goNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % facilities.length : null
    );
  }, [facilities.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + facilities.length) % facilities.length : null
    );
  }, [facilities.length]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "x" || e.key === "X") close();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, close, goNext, goPrev]);

  if (facilities.length === 0) return null;

  return (
    <>
      <div className={ko ? "grid grid-cols-2 gap-1.5 md:grid-cols-3 md:gap-3" : "grid grid-cols-2 md:grid-cols-4 gap-4"}>
        {facilities.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className={`relative aspect-square overflow-hidden group cursor-pointer ${ko ? "" : "rounded-2xl border border-gray-200"}`}
            aria-label={ko ? `${label(item)} 사진 크게 보기` : `View ${label(item)} photo`}
          >
            <OptimizedPhoto
              src={item.src}
              alt={label(item)}
              sizes="(min-width: 768px) 25vw, 50vw"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
            <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
              <p className="text-white text-sm font-semibold drop-shadow">
                {label(item)}
              </p>
            </div>
          </button>
        ))}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={ko ? "공용 공간 사진" : "Shared facility photo"}
          onClick={close}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            aria-label={ko ? "닫기 (Esc)" : "Close (press X or Escape)"}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="absolute top-4 left-4 z-10 text-white/70 text-sm font-medium">
            {lightboxIndex! + 1} / {facilities.length}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            aria-label={ko ? "이전 사진" : "Previous image"}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="relative w-full h-full p-16" onClick={(e) => e.stopPropagation()}>
            <OptimizedPhoto
              src={facilities[lightboxIndex!].src}
              alt={label(facilities[lightboxIndex!])}
              className="absolute inset-0 h-full w-full object-contain"
              sizes="100vw"
              loading="eager"
              fetchPriority="high"
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            aria-label={ko ? "다음 사진" : "Next image"}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white/60 text-sm font-medium drop-shadow">
            {label(facilities[lightboxIndex!])}
          </div>
        </div>
      )}
    </>
  );
}
