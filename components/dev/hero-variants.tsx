import Link from "next/link";
import { HeroBackground } from "./hero-background";

const HEADLINE = "₩340,000 for 4 weeks.";
const SUBLINE = "Your life in the Heart of Seoul.";
const DESCRIPTION =
  "Central Seoul. Private room.\nThe cheapest way to experience Korea.";

/* ------------------------------------------------------------------ */
/* V1 — Solid high-contrast buttons (white primary, dark secondary)   */
/* ------------------------------------------------------------------ */
export function HeroV1() {
  return (
    <HeroBackground>
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            <h1 className="font-caveat font-bold text-6xl sm:text-7xl lg:text-8xl leading-[1.05] text-white mb-2 hero-text-shadow-heavy">
              {HEADLINE}
            </h1>
            <h2 className="font-caveat font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-indigo-300 mb-6 hero-text-shadow-heavy">
              {SUBLINE}
            </h2>
            <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mb-10 leading-relaxed whitespace-pre-line hero-text-shadow">
              {DESCRIPTION}
            </p>
            <div>
              <Link
                href="/request-to-book"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl text-indigo-700 bg-white hover:bg-indigo-50 shadow-xl transition"
              >
                Request to Book
              </Link>
            </div>
          </div>
        </div>
      </div>
    </HeroBackground>
  );
}

/* ------------------------------------------------------------------ */
/* V2 — Dark glass panel behind text + buttons                        */
/* ------------------------------------------------------------------ */
export function HeroV2() {
  return (
    <HeroBackground>
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl bg-black/50 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl">
            <h1 className="font-caveat font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] text-white mb-2">
              {HEADLINE}
            </h1>
            <h2 className="font-caveat font-bold text-3xl sm:text-4xl lg:text-5xl text-indigo-300 mb-5">
              {SUBLINE}
            </h2>
            <p className="text-base sm:text-lg text-gray-200 mb-8 leading-relaxed whitespace-pre-line">
              {DESCRIPTION}
            </p>
            <div>
              <Link
                href="/request-to-book"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg transition"
              >
                Request to Book
              </Link>
            </div>
          </div>
        </div>
      </div>
    </HeroBackground>
  );
}

/* ------------------------------------------------------------------ */
/* V3 — Bottom CTA bar, full-width solid surface                      */
/* ------------------------------------------------------------------ */
export function HeroV3() {
  return (
    <HeroBackground
      overlay={
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      }
    >
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex-1 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-3xl">
              <h1 className="font-caveat font-bold text-6xl sm:text-7xl lg:text-8xl leading-[1.05] text-white mb-2 hero-text-shadow-heavy">
                {HEADLINE}
              </h1>
              <h2 className="font-caveat font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-indigo-300 mb-6 hero-text-shadow-heavy">
                {SUBLINE}
              </h2>
              <p className="text-lg sm:text-xl text-gray-200 max-w-2xl leading-relaxed whitespace-pre-line hero-text-shadow">
                {DESCRIPTION}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/95 backdrop-blur border-t border-gray-200 py-5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <p className="text-sm sm:text-base text-gray-600 font-medium">
              Ready to move in? Request a room — no payment needed.
            </p>
            <Link
              href="/request-to-book"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition"
            >
              Request to Book
            </Link>
          </div>
        </div>
      </div>
    </HeroBackground>
  );
}

/* ------------------------------------------------------------------ */
/* V4 — Gradient primary + white secondary, big drop shadows          */
/* ------------------------------------------------------------------ */
export function HeroV4() {
  return (
    <HeroBackground>
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            <h1 className="font-caveat font-bold text-6xl sm:text-7xl lg:text-8xl leading-[1.05] text-white mb-2 hero-text-shadow-heavy">
              {HEADLINE}
            </h1>
            <h2 className="font-caveat font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-indigo-300 mb-6 hero-text-shadow-heavy">
              {SUBLINE}
            </h2>
            <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mb-10 leading-relaxed whitespace-pre-line hero-text-shadow">
              {DESCRIPTION}
            </p>
            <div>
              <Link
                href="/request-to-book"
                className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 shadow-[0_10px_40px_-5px_rgba(99,102,241,0.6)] transition"
              >
                Request to Book →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </HeroBackground>
  );
}

/* ------------------------------------------------------------------ */
/* V5 — Minimal: one huge pill CTA                                     */
/* ------------------------------------------------------------------ */
export function HeroV5() {
  return (
    <HeroBackground>
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            <h1 className="font-caveat font-bold text-6xl sm:text-7xl lg:text-8xl leading-[1.05] text-white mb-2 hero-text-shadow-heavy">
              {HEADLINE}
            </h1>
            <h2 className="font-caveat font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-indigo-300 mb-10 hero-text-shadow-heavy">
              {SUBLINE}
            </h2>
            <div>
              <Link
                href="/request-to-book"
                className="group inline-flex items-center gap-3 pl-8 pr-4 py-4 text-lg font-semibold rounded-full text-gray-900 bg-white hover:bg-gray-100 shadow-2xl transition"
              >
                Book Your Room
                <span className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center group-hover:bg-indigo-500 transition">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </HeroBackground>
  );
}

/* ------------------------------------------------------------------ */
/* V6 — Centered, stacked cards with price callouts                   */
/* ------------------------------------------------------------------ */
export function HeroV6() {
  return (
    <HeroBackground
      overlay={
        <div className="absolute inset-0 bg-black/55" />
      }
    >
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <h1 className="font-caveat font-bold text-6xl sm:text-7xl lg:text-8xl leading-[1.05] text-white mb-2">
            {HEADLINE}
          </h1>
          <h2 className="font-caveat font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-indigo-300 mb-8">
            {SUBLINE}
          </h2>
          <p className="text-lg sm:text-xl text-gray-100 max-w-2xl mx-auto mb-10 leading-relaxed whitespace-pre-line">
            {DESCRIPTION}
          </p>
          <div className="flex justify-center">
            <Link
              href="/request-to-book"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold uppercase tracking-wider rounded-none text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl border-b-4 border-white transition"
            >
              Request to Book
            </Link>
          </div>
        </div>
      </div>
    </HeroBackground>
  );
}

export const HERO_VARIANTS = [
  { slug: "v1", label: "V1 — Solid high-contrast", component: HeroV1 },
  { slug: "v2", label: "V2 — Dark glass panel", component: HeroV2 },
  { slug: "v3", label: "V3 — Bottom CTA bar", component: HeroV3 },
  { slug: "v4", label: "V4 — Gradient CTA", component: HeroV4 },
  { slug: "v5", label: "V5 — Minimal pill CTA", component: HeroV5 },
  { slug: "v6", label: "V6 — Centered flat CTAs", component: HeroV6 },
] as const;
