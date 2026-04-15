"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const facilities = [
  { src: "/images/guides/shared-kitchen/kitchen.jpg", label: "Shared Kitchen" },
  { src: "/images/common/balcony.jpg", label: "Balcony" },
  { src: "/images/common/laundry.png", label: "Laundry" },
  { src: "/images/common/microwave.jpg", label: "Microwave" },
  { src: "/images/common/rice-cooker.jpg", label: "Rice Cooker" },
  { src: "/images/common/filtered-water-dispenser.jpg", label: "Filtered Water Dispenser" },
];

export function SharedFacilities() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const isOpen = lightboxIndex !== null;

  const close = useCallback(() => setLightboxIndex(null), []);

  const goNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % facilities.length : null
    );
  }, []);

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + facilities.length) % facilities.length : null
    );
  }, []);

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

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {facilities.map((item, i) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="relative aspect-square overflow-hidden rounded-2xl border border-gray-200 group cursor-pointer"
            aria-label={`View ${item.label} photo`}
          >
            <Image
              src={item.src}
              alt={item.label}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
            <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
              <p className="text-white text-sm font-semibold drop-shadow">
                {item.label}
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
          aria-label="Shared facility photo"
          onClick={close}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Close (press X or Escape)"
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
            aria-label="Previous image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="relative w-full h-full p-16" onClick={(e) => e.stopPropagation()}>
            <Image
              src={facilities[lightboxIndex!].src}
              alt={facilities[lightboxIndex!].label}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Next image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white/60 text-sm font-medium drop-shadow">
            {facilities[lightboxIndex!].label}
          </div>
        </div>
      )}
    </>
  );
}
