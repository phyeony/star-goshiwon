# Add Web Analytics: PostHog (cookieless) + GA4 (consent-gated)

## Context

The site (Star Goshiwon, a Seoul accommodation booking site on Next.js 15 App Router,
hosted on Cloudflare Workers via OpenNext) currently has **no analytics**. The owner wants
to know: how many people visit pages, how long they stay, and what they click.

Decisions made with the user:
- **Both** PostHog **and** GA4, side by side.
- **PostHog**: cookieless (`persistence: 'memory'`), **autocapture ON** → auto-tracks every
  click site-wide with no per-button work. Covers pageviews, session duration, clicks.
- **GA4**: adds traffic-source / ad attribution. GA4 uses cookies, so it is **gated behind a
  real cookie-consent banner** (Google Consent Mode v2; `gtag.js` does not load until accept).
- Analytics runs in **production only** — disabled on staging and local dev.

Accepted tradeoffs (already discussed): the two tools will report slightly different
numbers; the GA4 banner adds friction and loses data from decliners.

## Approach

Mount three browser-only client components from the (still server) root layout. Gate
everything on **presence of the env var** — keys are simply absent on staging/dev, so
analytics is off there automatically (more robust than reading the server-only `STAGING`
flag from a client component).

## New files

| Path | Responsibility |
|---|---|
| `lib/analytics.ts` | Single source of truth. Exports `POSTHOG_KEY`, `POSTHOG_HOST`, `GA_ID` from `process.env.NEXT_PUBLIC_*` and `posthogEnabled` / `gaEnabled` booleans (true only when the respective key is set). |
| `components/analytics/posthog-provider.tsx` | `"use client"`. Init PostHog in a mount `useEffect` (browser-only): `persistence: 'memory'`, `autocapture: true`, `capture_pageview: false` (manual), `capture_pageleave: true` (for session duration). Wraps children in `PostHogProvider` from `posthog-js/react`. Passthrough no-op when `!posthogEnabled`. |
| `components/analytics/posthog-pageview.tsx` | `"use client"`. `usePathname` + `useSearchParams` + `usePostHog`; fires `$pageview` on each route change (App Router soft navigations don't fire it automatically). Returns `null`. **Must be mounted inside `<Suspense>`.** |
| `components/analytics/google-analytics.tsx` | `"use client"`. Parent owning `consented` state. Renders: (1) Consent Mode v2 default script (all consent `denied`), (2) the consent banner, (3) conditional `gtag.js` loader via `next/script` that only renders after consent. localStorage-backed; mount-gated to avoid hydration mismatch. No-op when `!gaEnabled`. (Banner UI may live in a separate `consent-banner.tsx` or be inlined here.) |

## Layout wiring — `app/layout.tsx`

Keep `layout.tsx` a Server Component. Inside `<body>`, after the existing JSON-LD script:

```
<PostHogProvider>
  <Suspense fallback={null}><PostHogPageview /></Suspense>   {/* Suspense required: useSearchParams */}
  <Header />
  <main>{children}</main>
  <Footer />
  <GoogleAnalytics />                                         {/* banner + consent-gated gtag */}
</PostHogProvider>
```

## Package

- `npm install posthog-js` (use the bundled `posthog-js/react` `PostHogProvider`/`usePostHog` — no extra install).
- GA4 via `next/script` — no package.

## Env vars (production only)

Add to the **production `vars` block** in `wrangler.jsonc`; the user mirrors to the deploy
target manually. **Do not** add to the `staging` block, and **do not** touch `.env` files.

- `NEXT_PUBLIC_POSTHOG_KEY` — PostHog project key (`phc_...`)
- `NEXT_PUBLIC_POSTHOG_HOST` — `https://us.i.posthog.com` (or EU)
- `NEXT_PUBLIC_GA_ID` — GA4 Measurement ID (`G-XXXXXXXXXX`)

These are public client keys → `vars`, not secrets. User must first create a PostHog
project and a GA4 property to obtain the keys.

## Cloudflare / OpenNext notes

- All init runs inside `useEffect` → browser-only; nothing executes during SSR/edge render.
  Never import `posthog-js` at server module top-level. `global_fetch_strictly_public` is
  irrelevant (calls happen in the browser).
- Consent banner: render `null` on server + first client render, reveal after a
  `mounted` effect → no hydration mismatch / banner flash.
- No CSP exists today, so no allowlist work. (If a CSP is added later: allow
  `*.posthog.com`, `www.googletagmanager.com`, `*.google-analytics.com`, and inline scripts.)

## Consent Mode v2 (GA4)

1. Inline default: `gtag('consent','default', { analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied', wait_for_update:500 })`.
2. `gtag.js` **not loaded** until Accept.
3. Accept → `gtag('consent','update', {... 'granted'})`, persist to localStorage, inject `gtag.js`.
4. Decline → persist, never load `gtag.js`.

**Legal flag for your review:** PostHog runs cookieless and fires regardless of the banner.
Whether cookieless/IP-based analytics needs consent in your jurisdiction varies (GDPR/PIPA).
If you want PostHog gated too, move its init behind the same consent gate.

## Optional (skip for v1) — PostHog reverse proxy

Ad-blockers block `*.posthog.com`. Proxying via your own domain recovers some events.
Preferred on this stack: a **Cloudflare edge route** for `goshiwonseoul.com/ingest/*`
(avoids the OpenNext/Worker request pipeline that Next `rewrites()` would add). Then set
`NEXT_PUBLIC_POSTHOG_HOST=https://goshiwonseoul.com/ingest`. Add later only if blocked
volume proves material.

## Verification

- **Dev**: `npm run dev` with no keys → no PostHog/gtag requests, no banner.
- **Build**: `npm run build` → no "useSearchParams should be wrapped in a suspense boundary"
  error (confirms Suspense placement).
- **Staging**: deployed staging (keys absent) → no analytics calls, no banner.
- **Prod — PostHog**: Live events show data; clicking links/buttons produces `$autocapture`
  events; navigating between routes fires one `$pageview` each; `$pageleave` → session
  duration; DevTools confirms **no cookies** set by PostHog.
- **Prod — GA4**: before accept → no `gtag/js` request, no `_ga` cookie, banner visible;
  Accept → `gtag.js` loads, `_ga` cookie appears, GA4 Realtime/DebugView shows session,
  consent = granted; Decline → reload shows no banner, no `gtag.js`, no cookie.
- No React hydration warning on first load.

## Notes
- Per repo convention, I'll also drop a copy of this plan into `goshiwon/plan/` when work starts.
- Prereq before coding: user creates the PostHog project + GA4 property and provides the 3 keys
  (or sets them in wrangler). Code can be written first; analytics simply stays off until keys exist.
