# Bilingual Korean Rollout for Star Goshiwon

## Context

The site at `/Users/hyeonyoung/projects/goshiwon` is currently positioned 100% for English-speaking foreigners: USD-primary pricing, PayPal payments, "Why Foreigners Choose," and explainers like "What Is a Goshiwon." Only `/policies/ko` is translated.

You want to expand to Korean **장기 거주** users — primarily students and 공무원 수험생 — without degrading the foreigner funnel. The location (64 Manyang-ro 12ga-gil, Dongjak-gu) sits between **상도역 (5분)** and **노량진 학원가 (10분)**, which is the natural Korean positioning anchor.

Operational readiness: Korean payments (계좌이체 / 카카오페이) and KakaoTalk inquiry support are confirmed. Monthly KRW pricing is TBD by you.

Work happens on a **separate worktree** so the bilingual build is isolated from `main`.

---

## Approach (opinionated)

- **i18n architecture**: Extend the existing parallel-tree pattern under `/app/ko/*`. Do **NOT** install `next-intl`. Korean pages are standalone `page.tsx` files with hardcoded Korean copy — they intentionally diverge in *content structure*, not just *strings*. A tiny `lib/i18n/dictionary.ts` covers the small pool of shell strings (header nav, footer headings, common CTAs).
- **URL structure**: `/` stays English (preserves all current SEO). Korean lives under `/ko/...`. Move existing `/policies/ko` → `/ko/policies` with a 308 redirect.
- **Audience-first copy**: the Korean home page is structurally different from English — no "what is a goshiwon" explainer, no "Why Foreigners Choose," no English-support brag. Lead with location (노량진/상도역), monthly KRW rate, KakaoTalk CTA.
- **`<html lang>` per locale**: small client `LangSetter` mutates `document.documentElement.lang` on `/ko/*` mount. Acceptable trade-off because crawlers weigh `hreflang` more than the bare `lang` attribute, and a `[locale]` route restructure would force redirecting every existing English URL.

---

## Worktree setup

- Branch: `feat/bilingual-korean`
- Worktree path: `/Users/hyeonyoung/projects/goshiwon-ko` (sibling to main checkout)
- Use the `EnterWorktree` tool to create it (long-lived branch — multiple PRs may merge into it before it merges to `main`).

---

## Phase 1 — MVP (single worktree merge)

### New files

- `lib/i18n/locale.ts` — `Locale` type, `useLocale()` client hook (reads `usePathname()`), `getLocaleFromPath(path)` server helper, `pairedUrl(path, locale)` helper for the language switcher.
- `lib/i18n/dictionary.ts` — `{ en, ko }` dictionary for shared shell strings only (header nav labels, footer headings, "예약 문의" / "Request to Book", "문의" / "Contact").
- `app/ko/layout.tsx` — KO subtree layout. Renders a `<LangSetter>` client component.
- `components/lang-setter.tsx` — client component that sets `document.documentElement.lang = "ko"` on mount.
- `components/lang-switcher.tsx` — `EN | KO` pill. Computes the paired URL via `pairedUrl()`. Falls back to `/` or `/ko/` when no peer page exists (avoid 404s).
- `components/kakao-button.tsx` — official Kakao yellow (`bg-[#FEE500] text-black`) with inline chat-icon SVG. Reusable.
- `app/ko/page.tsx` — Korean home. Section structure:
  1. **히어로**: "노량진 학원가 도보 10분, 상도역 5분 / 남성 전용 고시원 / 월 ₩XXX부터" — primary CTA `KakaoButton`, secondary "방 둘러보기".
  2. **위치 강조**: subway grid (상도역 5분, 노량진역 10분, 신대방역 12분) + 노량진 학원가 / 사육신공원 인접 강조.
  3. **객실 안내**: reuse `RoomCardVariantSplit` with new `locale="ko"` prop → KRW monthly primary.
  4. **공용 시설**: reuse `SharedFacilities` with `locale` prop for KO labels.
  5. **이용료 및 입주 절차**: 월 이용료 / 보증금 / 침구 / 공과금 / 최소 거주 기간 + 3-step flow (카톡 문의 → 방 확인 → 입주).
  6. **자주 묻는 질문**: 5 KO-native FAQs (보증금 환불, 입주 가능일, 정숙 시간, 공실 확인, 빨래). NOT translated from EN.
  7. **문의**: large `KakaoButton`, 전화 (small), 이메일 (small). No WhatsApp.
- `app/ko/contact/page.tsx` — KakaoTalk-first contact page.
- `app/ko/request-to-book/page.tsx` — wraps `RequestForm` with `locale="ko"`.
- `app/ko/policies/page.tsx` — copy from current `app/policies/ko/page.tsx`, then **rewrite payment passages** for 계좌이체/카카오페이 (drop PayPal language).
- `app/ko/policies/archive/page.tsx` — mirror.

### Modified files

- `lib/site-data.ts` — add `krwPricing` block (monthly, deposit, beddingFee, beddingIncluded, utilitiesIncluded, minStay) with placeholder values for you to fill in. Add `nameKo: "스타고시원"` and `addressKo: "서울특별시 동작구 만양로12가길 64"`.
- `lib/pricing.ts` — add `formatKRWMonthly(amount)` helper.
- `components/header.tsx` — locale-aware nav labels via dictionary. Inject `<LangSwitcher>`. On KO routes, swap WhatsApp button for `<KakaoButton>` and "Request to Book" copy for "예약 문의".
- `components/footer.tsx` — locale-aware labels. Uncomment KakaoTalk link only when `locale === "ko"`. Hide WhatsApp on KO.
- `components/request-form.tsx` — accept `locale?: "en" | "ko"` prop. For `ko`: hide passport/visa fields, hide bedding-prepaid checkbox, hide USD estimator, swap labels to Korean, submit `locale: "ko"` in payload.
- `components/shared-facilities.tsx`, `components/room-card-variants-client.tsx` — accept `locale` prop, render KO labels / KRW monthly when set.
- `app/layout.tsx` — add `alternateName: "스타고시원"` to JSON-LD `LodgingBusiness`. Keep `<html lang="en">` (KO routes flip it client-side).
- `app/page.tsx`, `app/contact/page.tsx`, `app/request-to-book/page.tsx`, `app/policies/page.tsx` — add `alternates.languages` to each `metadata` block, with the KO peer URL.
- `app/sitemap.ts` — add `/ko/`, `/ko/contact`, `/ko/request-to-book`, `/ko/policies`, `/ko/policies/archive`. Remove old `/policies/ko*` entries. Use Next.js 15 sitemap `alternates.languages` field.
- `next.config.ts` — `redirects()`: `/policies/ko` → `/ko/policies` (308), `/policies/ko/archive` → `/ko/policies/archive` (308).
- `app/api/booking-requests/route.ts` + `lib/validation.ts` — accept optional `locale` field. Persist into existing `notes` column to avoid a schema migration in Phase 1.

### Deleted

- `app/policies/ko/` subtree — once redirects in `next.config.ts` are live.

### Reused (don't rewrite)

- `siteConfig.kakao` — already configured at `pf.kakao.com/seoulstay`, just surface it.
- `formatKRW` in `lib/pricing.ts`.
- `formatPolicyDate(locale)` and `formatVersionTitle(locale)` in `lib/policy-versions.ts`.
- Naver Site Verification token in `app/layout.tsx` — already in place.

---

## Phase 2 — post-launch (follow-up PR to same worktree)

- `app/ko/rooms/page.tsx` and `app/ko/rooms/[slug]/page.tsx` — KO room list + detail pages, KRW monthly pricing.
- `app/ko/faq/page.tsx` — KO-native FAQ (5–7 questions written for KO search intent, not translated).
- `app/ko/location/page.tsx` — heavy on 노량진 학원가 / 상도역 / 사육신공원 / 동작구청. Drop foreigner tourist destinations.

## Phase 3 — marketing surface (later)

- 1–2 KO blog posts under `/ko/guides/`:
  - "노량진 고시원 고를 때 체크리스트 7가지"
  - "공무원 수험생을 위한 동작구 고시원 위치 비교"
- **External (you do these in browser, not code)**: list on **피터팬의 좋은방 구하기**, **고시원넷**, **네이버 부동산**. Submit `/sitemap.xml` to **Naver Search Advisor** at search.naver.com/advisor (verification token already in place).

---

## NOT doing (scope discipline)

- **No translating the 10 English guides.** Korean readers don't search "Incheon airport to Noryangjin" or "what to pack for Korea." Phase 3 posts are written from scratch for Naver intent.
- **No `next-intl` / `next-i18next` / `react-intl`.** Matrix is too small; abstraction obscures the intentional content divergence.
- **No browser-locale auto-redirect.** Many KR users have English Chrome. Auto-redirect breaks crawlers and deep-links.
- **No `[locale]` route segment.** Would force redirecting every existing EN URL.
- **No carrying "Why Foreigners Choose" or "What Is a Goshiwon" blocks into KO.** Drop them.
- **No CMS** for Korean copy. Hardcode in `page.tsx` for now.
- **No changes to USD/PayPal flow.** Foreigner pipeline stays exactly as-is.

---

## Verification (manual, before merging worktree to main)

1. `npm run build` — clean, no TS or "Dynamic server usage" errors on KO routes.
2. **EN regression**: `/`, `/rooms`, `/rooms/<slug>`, `/contact`, `/request-to-book`, `/faq`, `/location`, `/policies` render identically to `main`. USD pricing toggle works. Booking estimator works.
3. `curl -I https://<host>/policies/ko` → `308` to `/ko/policies`. Same for `/policies/ko/archive`.
4. **KO smoke**:
   - `/ko/` → KO hero, KakaoButton visible, KRW monthly visible, no `$` anywhere.
   - `/ko/contact` → KakaoButton is primary CTA, opens `pf.kakao.com/seoulstay`.
   - `/ko/request-to-book` → all KO labels, no passport/visa fields, no USD totals; submission lands in DB with `locale: "ko"` in `notes`.
   - `/ko/policies` → KRW + 계좌이체/카카오페이 language only.
5. **Language switcher**:
   - `/` → `/ko/`, `/contact` → `/ko/contact`, `/policies` → `/ko/policies`, and reverse — all work.
   - From a page with no KO peer (e.g., `/guides/<slug>`), switcher falls back to `/ko/` (no 404).
6. **DOM lang**: devtools on `/ko/` → `document.documentElement.lang === "ko"`. On `/` → `"en"`. Switching pages updates it.
7. **SEO**: view-source on `/ko/`:
   - `<title>` is Korean.
   - `og:locale` is `ko_KR`.
   - hreflang tags for `en`, `ko`, `x-default` all present.
   - JSON-LD includes `alternateName: "스타고시원"`.
   - `/sitemap.xml` lists all KO Phase 1 URLs and excludes old `/policies/ko*`.
8. **Mobile** (Chrome devtools 375px first, then real device): KakaoButton tappable, KO text doesn't overflow, header switcher reachable.

---

## Critical files at a glance

- `app/ko/page.tsx` — the heart of the Korean positioning; sets the tone.
- `lib/site-data.ts` — `krwPricing` block (you fill in the actual monthly rate).
- `components/header.tsx` — language switcher + KakaoButton swap-in.
- `lib/i18n/locale.ts` — single source of truth for locale awareness.
- `next.config.ts` — 308 redirects for the `/policies/ko` move.

---

## After Phase 1 ships (you in the browser)

1. Submit `/sitemap.xml` to **Naver Search Advisor** (verification already wired).
2. List on **피터팬**, **고시원넷**, **네이버 부동산**.
3. Watch inquiries by `locale` field (now in DB) to see whether the Korean funnel converts before investing in Phase 2 / Phase 3.
