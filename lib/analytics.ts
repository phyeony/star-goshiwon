// Single source of truth for client-side analytics configuration.
//
// Analytics is gated purely on the *presence* of these NEXT_PUBLIC_ env vars.
// They are set only in the production `vars` block in wrangler.jsonc, so on
// staging and local dev they are absent and every analytics component no-ops.
// (This is more robust than reading the server-only STAGING flag from a
// client component.)

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
export const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

export const posthogEnabled = POSTHOG_KEY.length > 0;
export const gaEnabled = GA_ID.length > 0;

// localStorage key holding the visitor's cookie-consent choice
// ("granted" | "denied"). Shared by the consent banner and the GA event helper.
export const GA_CONSENT_STORAGE_KEY = "ga-consent";
