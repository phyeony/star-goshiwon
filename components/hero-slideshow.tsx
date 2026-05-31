"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

type Slide = { type: "image"; base: string } | { type: "video"; src: string };

const HERO_WIDTHS = [640, 1280, 1920, 2560] as const;

const slides: Slide[] = [
  { type: "image", base: "hill-street-night" },
  { type: "image", base: "noryangjin-fish-market" },
  { type: "image", base: "night-view" },
  { type: "image", base: "hanok-village" },
  { type: "image", base: "balcony-view" },
];

function heroSrc(base: string, width: number) {
  return `/images/hero/optimized/${base}-${width}.webp`;
}

function heroSrcSet(base: string) {
  return HERO_WIDTHS.map((w) => `${heroSrc(base, w)} ${w}w`).join(", ");
}

const variant = {
  font: "font-caveat font-bold",
  headlineWeekly: "$75 a week.",
  headlineMonthly: "$255 for 4 weeks.",
  subline: "Your life in the Heart of Seoul.",
  headlineOnly: false,
  description:
    "Central Seoul. Private room. Men\u00a0Only.\nThe cheapest way to experience Korea.",
};

export function HeroSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [pricingMode, setPricingMode] = useState<"weekly" | "monthly">(
    "monthly",
  );
  const heroRef = useRef<HTMLDivElement>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [nextSlide, prevSlide]);

  useEffect(() => {
    const timer = setInterval(nextSlide, 2500);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div
      id="hero-section"
      ref={heroRef}
      className="relative w-full h-[90vh] min-h-[600px] overflow-hidden bg-black -mt-16 pt-16"
    >
      {/* Background media layers */}
      {slides.map((s, i) => {
        if (s.type === "video") {
          return (
            <div
              key={s.src}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                i === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <video
                src={s.src}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          );
        }
        return (
          <div
            key={s.base}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={heroSrc(s.base, 1920)}
              srcSet={heroSrcSet(s.base)}
              sizes="100vw"
              alt="Seoul cityscape"
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        );
      })}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30" />

      {/* Content */}
      <div className="relative z-30 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            <h1 className="text-sm sm:text-base font-semibold uppercase tracking-widest text-white/90 mb-4 hero-text-shadow-heavy">
              Goshiwon in Seoul for Foreigners
            </h1>

            {/* Pricing toggle */}
            <div className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 p-1 mb-6">
              <button
                onClick={() => setPricingMode("weekly")}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  pricingMode === "weekly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setPricingMode("monthly")}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  pricingMode === "monthly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Monthly
              </button>
            </div>

            <p
              className={`${variant.font} text-6xl sm:text-7xl lg:text-8xl leading-[1.05] text-white mb-2 hero-text-shadow-heavy`}
            >
              {pricingMode === "weekly"
                ? variant.headlineWeekly
                : variant.headlineMonthly}
            </p>
            <h2
              className={`${variant.font} ${
                variant.headlineOnly
                  ? "text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] text-white"
                  : "text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-indigo-300"
              } mb-6 hero-text-shadow-heavy`}
            >
              {variant.subline}
            </h2>

            {variant.description && (
              <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mb-8 leading-relaxed whitespace-pre-line">
                {variant.description}
              </p>
            )}

            <div className={!variant.description ? "mt-10" : ""}>
              <Link
                href="/request-to-book"
                className="group inline-flex items-center gap-2 sm:gap-2.5 px-5 py-2 sm:px-6 sm:py-3 text-base sm:text-lg font-semibold rounded-full text-gray-900 bg-white hover:bg-gray-100 shadow-2xl transition"
              >
                Book Your Room
                <span className="text-indigo-600 transition group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Image navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 hidden xl:flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm border border-white/10 transition"
        aria-label="Previous image"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 hidden xl:flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm border border-white/10 transition"
        aria-label="Next image"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 pb-6 pt-12 bg-gradient-to-t from-black/60 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="pointer-events-auto flex gap-2">
            {slides.map((s, i) => (
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
    </div>
  );
}
