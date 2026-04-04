"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { RoomImage } from "@/lib/types";

interface ImageLightboxProps {
  images: RoomImage[];
  roomName: string;
}

export function ImageGallery({ images, roomName }: ImageLightboxProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const isOpen = lightboxIndex !== null;

  const close = useCallback(() => setLightboxIndex(null), []);

  const goNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev + 1) % images.length : null
    );
  }, [images.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev !== null ? (prev - 1 + images.length) % images.length : null
    );
  }, [images.length]);

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

  if (images.length === 0) return null;

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          className="relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden cursor-pointer group"
        >
          <Image
            src={images[0].url}
            alt={images[0].alt || roomName}
            fill
            className="object-cover group-hover:scale-105 transition duration-300"
            sizes="(max-width: 1024px) 100vw, 66vw"
            priority
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition duration-300" />
          {images.length > 1 && (
            <span className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-gray-900 text-sm font-medium px-3 py-1.5 rounded-lg shadow-sm">
              View all {images.length} photos
            </span>
          )}
        </button>

        {images.length > 1 && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            {images.slice(1, 4).map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setLightboxIndex(i + 1)}
                className="relative h-32 rounded-lg overflow-hidden cursor-pointer group"
              >
                <Image
                  src={img.url}
                  alt={img.alt || roomName}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-300"
                  sizes="(max-width: 1024px) 33vw, 22vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition duration-300" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition duration-150 ease-in-out"
            aria-label="Close gallery (press X or Escape)"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 z-10 text-white/70 text-sm font-medium">
            {lightboxIndex! + 1} / {images.length}
          </div>

          {/* Previous */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition duration-150 ease-in-out"
              aria-label="Previous image"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Image */}
          <div className="relative w-full h-full p-16">
            <Image
              src={images[lightboxIndex!].url}
              alt={images[lightboxIndex!].alt || roomName}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={goNext}
              className="absolute right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition duration-150 ease-in-out"
              aria-label="Next image"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}

          {/* Keyboard hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white/40 text-xs">
            Use arrow keys to navigate &middot; Press X or Esc to close
          </div>
        </div>
      )}
    </>
  );
}
