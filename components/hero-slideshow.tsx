"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

type Slide =
  | { type: "image"; src: string }
  | { type: "video"; src: string };

const slides: Slide[] = [
  { type: "image", src: "/images/hero/hill-street-night.jpg" },
  { type: "image", src: "/images/hero/noryangjin-fish-market.jpg" },
  { type: "image", src: "/images/hero/night-view.jpg" },
  { type: "image", src: "/images/hero/hanok-village.jpg" },
  { type: "image", src: "/images/hero/balcony-view.jpg" },
];

const heroVariants = [
  // --- Caveat variants ---
  {
    font: "font-caveat font-bold",
    label: "Caveat",
    headlineWeekly: "₩100,000 a week.",
    headlineMonthly: "₩340,000 for 4 weeks.",
    subline: "Your life in the Heart of Seoul.",
    headlineOnly: false,
    description:
      "Central Seoul. Private room.\nThe cheapest way to experience Korea.",
  },
  //   {
  //   font: "font-caveat font-bold",
  //   label: "Caveat korean",
  //   headline: "₩100,000 a week.",
  //   subline: "Your life in the Heart of Seoul.",
  //   headlineOnly: false,
  //   description:
  //     "A private room in central Seoul for the price of a few dinners back home. No deposits, no contracts — just pack your bag and go.",
  // },
  // {
  //   font: "font-caveat font-bold",
  //   label: "Caveat Big",
  //   headline: "$300 a month.",
  //   subline: "Live in the Heart of Seoul.",
  //   headlineOnly: true,
  //   description:
  //     "A private room in central Seoul for the price of a few dinners back home. No deposits, no contracts — just pack your bag and go.",
  // },
  //   {
  //   font: "font-caveat font-bold",
  //   label: "Caveat clean 2",
  //   headline: "$300 a month.",
  //   subline: "Your life in the Heart of Seoul.",
  //   headlineOnly: false,
  //   description: null,
  // },
  // {
  //   font: "font-caveat font-bold",
  //   label: "Caveat Clean",
  //   headline: "$300 a month.",
  //   subline: "Live in the Heart of Seoul.",
  //   headlineOnly: true,
  //   description: null,
  // },
  // // --- Shadows Into Light variants ---
  // {
  //   font: "font-shadows font-bold",
  //   label: "Shadows",
  //   headline: "Seoul for $300.",
  //   subline: "Not a hostel. Your own room.",
  //   headlineOnly: false,
  //   description:
  //     "Central Seoul. Private room. WiFi, AC, everything included. The cheapest way to experience Korea — and actually live here.",
  // },
  // {
  //   font: "font-shadows",
  //   label: "Shadows Big",
  //   headline: "Seoul for $300.",
  //   subline: "Your own room.",
  //   headlineOnly: true,
  //   description:
  //     "Central Seoul. Private room. WiFi, AC, everything included. The cheapest way to experience Korea — and actually live here.",
  // },
  // {
  //   font: "font-shadows",
  //   label: "Shadows Clean",
  //   headline: "Seoul for $300.",
  //   subline: "Your own room.",
  //   headlineOnly: true,
  //   description: null,
  // },
  // // --- Patrick Hand variants ---
  // {
  //   font: "font-patrick",
  //   label: "Patrick",
  //   headline: "Live in Seoul.",
  //   subline: "From $300/month. Seriously.",
  //   headlineOnly: false,
  //   description:
  //     "A furnished private room in the centre of Seoul. Gangnam, Hongdae, Myeongdong — all under 50 minutes away. Start living, not just visiting.",
  // },
  // {
  //   font: "font-patrick",
  //   label: "Patrick Big",
  //   headline: "Live in Seoul.",
  //   subline: "$300 a month.",
  //   headlineOnly: true,
  //   description:
  //     "A furnished private room in the centre of Seoul. Gangnam, Hongdae, Myeongdong — all under 50 minutes away. Start living, not just visiting.",
  // },
  // {
  //   font: "font-patrick",
  //   label: "Patrick Clean",
  //   headline: "Live in Seoul.",
  //   subline: "$300 a month.",
  //   headlineOnly: true,
  //   description: null,
  // },
  // // --- More attention-grabbing copy options ---
  // {
  //   font: "font-caveat font-bold",
  //   label: "Bold 1",
  //   headline: "Your Room in Seoul.",
  //   subline: "$300. That's it.",
  //   headlineOnly: true,
  //   description:
  //     "Private room, central location, WiFi, AC — all included. No deposit, no Korean needed. Just book and show up.",
  // },
  // {
  //   font: "font-caveat font-bold",
  //   label: "Bold 1 Clean",
  //   headline: "Your Room in Seoul.",
  //   subline: "$300. That's it.",
  //   headlineOnly: true,
  //   description: null,
  // },
  // {
  //   font: "font-shadows",
  //   label: "Bold 2",
  //   headline: "Seoul.",
  //   subline: "Private room. $300. Done.",
  //   headlineOnly: false,
  //   description:
  //     "A real room with a lock on the door. Furnished, central Seoul, all utilities included. Stay a week or stay a year.",
  // },
  // {
  //   font: "font-shadows",
  //   label: "Bold 2 Clean",
  //   headline: "Seoul.",
  //   subline: "Private room. $300. Done.",
  //   headlineOnly: false,
  //   description: null,
  // },
  // {
  //   font: "font-patrick",
  //   label: "Bold 3",
  //   headline: "Wake Up in Seoul.",
  //   subline: "Private Room. $300/month.",
  //   headlineOnly: false,
  //   description:
  //     "No lease. No deposit. No Korean required. A furnished private room in central Seoul — just book online and move in.",
  // },
  // {
  //   font: "font-patrick",
  //   label: "Bold 3 Clean",
  //   headline: "Wake Up in Seoul.",
  //   subline: "Private Room. $300/month.",
  //   headlineOnly: false,
  //   description: null,
  // },
];

export function HeroSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentVariant, setCurrentVariant] = useState(0);
  const [textFading, setTextFading] = useState(false);
  const [pricingMode, setPricingMode] = useState<"weekly" | "monthly">("monthly");
  const heroRef = useRef<HTMLDivElement>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Cycle font variant with a crossfade
  const goToVariant = useCallback((idx: number) => {
    setTextFading(true);
    setTimeout(() => {
      setCurrentVariant(idx);
      setTextFading(false);
    }, 300);
  }, []);

  // Arrow keys: left/right for images, up/down for font variants
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowUp") {
        e.preventDefault();
        goToVariant(
          (currentVariant + 1) % heroVariants.length
        );
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        goToVariant(
          (currentVariant - 1 + heroVariants.length) % heroVariants.length
        );
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [nextSlide, prevSlide, goToVariant, currentVariant]);

  // Auto-advance background every 5s
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const variant = heroVariants[currentVariant];

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
            key={s.src}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={s.src}
              alt="Seoul cityscape"
              fill
              className="object-cover"
              priority={i === 0}
            />
          </div>
        );
      })}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div
            className={`max-w-3xl transition-opacity duration-300 ${
              textFading ? "opacity-0" : "opacity-100"
            }`}
          >
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

            <h1
              className={`${variant.font} text-6xl sm:text-7xl lg:text-8xl leading-[1.05] text-white mb-2 hero-text-shadow-heavy`}
            >
              {pricingMode === "weekly" ? variant.headlineWeekly : variant.headlineMonthly}
            </h1>
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
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 hidden xl:flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm border border-white/10 transition"
        aria-label="Next image"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Scroll hint */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7-7-7" />
        </svg>
      </div>

      {/* Bottom bar: slide dots + font switcher */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-6 pt-12 bg-gradient-to-t from-black/60 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Slide dots */}
          <div className="flex gap-2">
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

          {/* Font variant switcher
          <div className="flex gap-2 overflow-x-auto max-w-[60vw] scrollbar-hide">
            {heroVariants.map((v, i) => (
              <button
                key={i}
                onClick={() => goToVariant(i)}
                className={`${v.font} px-4 py-1.5 rounded-full text-xs sm:text-sm whitespace-nowrap backdrop-blur-sm border transition-all ${
                  i === currentVariant
                    ? "bg-white text-gray-900 border-white shadow-lg"
                    : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div> */}
        </div>
      </div>
    </div>
  );
}
