// Client-side GA4 event helper. Mirrors the PostHog capture pattern but targets
// gtag. No-ops unless GA is enabled AND the visitor has granted cookie consent —
// gtag.js only loads after consent (see components/analytics/google-analytics.tsx),
// so we gate explicitly to avoid queueing events for visitors who declined.
import { gaEnabled, GA_CONSENT_STORAGE_KEY } from "@/lib/analytics";

// GA4 params allow nested objects (e.g. the ecommerce `items` array).
export type GaParams = Record<
  string,
  string | number | boolean | undefined | object
>;

export function trackGaEvent(name: string, params?: GaParams) {
  if (!gaEnabled || typeof window === "undefined") return;
  if (window.localStorage.getItem(GA_CONSENT_STORAGE_KEY) !== "granted") return;
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void })
    .gtag;
  gtag?.("event", name, params);
}
