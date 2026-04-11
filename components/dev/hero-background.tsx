"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const slides = [
  "/images/hero/hill-street-night.jpg",
  "/images/hero/noryangjin-fish-market.jpg",
  "/images/hero/night-view.jpg",
  "/images/hero/hanok-village.jpg",
  "/images/hero/balcony-view.jpg",
];

type Props = {
  children: React.ReactNode;
  overlay?: React.ReactNode;
  className?: string;
};

export function HeroBackground({ children, overlay, className = "" }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div
      className={`relative w-full h-[90vh] min-h-[600px] overflow-hidden bg-black -mt-16 pt-16 ${className}`}
    >
      {slides.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={src}
            alt="Seoul cityscape"
            fill
            className="object-cover"
            priority={i === 0}
          />
        </div>
      ))}

      {overlay ?? (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30" />
      )}

      {children}

      <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all ${
                i === currentSlide
                  ? "bg-white w-8"
                  : "bg-white/40 w-2 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
