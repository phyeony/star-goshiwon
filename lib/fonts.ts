import { Caveat, Inter } from "next/font/google";

// Self-hosted at build time by next/font: the woff2 is served from our own
// domain and preloaded in <head>, with a metric-matched "Inter Fallback".
// display "optional" means the text never switches fonts mid-view: if Inter
// isn't ready within ~100ms of first paint the browser keeps the fallback for
// that page view, and the now-cached Inter is used from the next page on.
// ("swap" still showed a visible fallback-to-Inter switch on uncached loads.)
export const inter = Inter({
  subsets: ["latin"],
  display: "optional",
  variable: "--font-inter",
});

// Only used by the /dev hero experiments, so it is not preloaded. The browser
// downloads it only on pages that actually render Caveat text.
export const caveat = Caveat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-caveat",
  preload: false,
});
