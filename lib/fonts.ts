import { Caveat, Inter } from "next/font/google";

// Self-hosted at build time by next/font: the woff2 is served from our own
// domain and preloaded in <head>, and a metric-matched "Inter Fallback" is
// generated so the brief fallback render has the same line widths. Loading
// Inter through a Google Fonts @import made the browser discover it only
// after downloading our CSS and Google's CSS, so text visibly swapped fonts.
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
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
