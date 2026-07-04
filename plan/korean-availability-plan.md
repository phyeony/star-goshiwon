# Korean Availability Plan for Star Goshiwon

## Summary

Make the site available to Koreans by adding a Korean-first funnel under `/ko`, aimed at local long-stay residents such as students and 공무원 수험생 near 노량진/상도. Keep the existing English/foreigner funnel unchanged.

The Korean funnel should not be a direct translation. It should reposition the property around location, monthly living, Korean payment methods, and fast inquiry.

## Key Changes

- Add Korean pages under `/ko`: home, contact, request-to-book, policies, and policy archive.
- Keep `/` and existing English routes as-is for foreign guests, including USD/PayPal messaging.
- Move existing Korean policy pages from `/policies/ko` to `/ko/policies` with permanent redirects.
- Add a language switcher between EN and KO, with fallback to `/ko` when a Korean peer page does not exist.
- Set Korean SEO metadata: Korean titles/descriptions, `hreflang`, `og:locale: ko_KR`, sitemap entries, and Naver-friendly Korean copy.

## Korean User Experience

- Korean home page should lead with:
  - "노량진 학원가 도보 10분"
  - "상도역 도보 5분"
  - "남성 전용 고시원"
  - monthly KRW pricing placeholder, shown as "월 ₩XXX부터"
- Primary contact path: Korean users submit a booking request, then continue communication through KakaoTalk or phone.
- Header/footer on Korean routes should show Korean labels and prioritize:
  - `예약 문의`
  - `카카오톡 문의`
  - `전화하기`
- Hide or rewrite foreigner-specific sections for Korean users:
  - no "What is a goshiwon?"
  - no "Why foreigners choose us"
  - no passport/visa-first messaging unless legally needed elsewhere
  - no PayPal wording on Korean pages

## Booking And Payment Flow

- Reuse the existing request booking flow, but localize it for Korean users.
- Add optional `locale: "ko"` to booking submissions and persist it without a schema migration, likely in existing notes/admin metadata for v1.
- Korean request form should use Korean labels and Korean expectations:
  - name, phone, Kakao/contact preference, desired dates, room/stay notes
  - KRW estimate or monthly pricing placeholder
  - no USD/PayPal payment preview
- Korean policies and admin/email templates should describe:
  - 계좌이체
  - 카카오페이
  - Korean refund/deposit language
- English payment flow remains USD + PayPal.

## Implementation Defaults

- Do not add `next-intl`; use standalone Korean pages plus a small dictionary for shared header/footer labels.
- Use `/ko/...` routes instead of browser-language redirects.
- Add `siteConfig` Korean fields:
  - `nameKo`
  - `addressKo`
  - `krwPricing` with placeholders for monthly rent, deposit, bedding, utilities, and minimum stay.
- Use Kakao yellow styling for KakaoTalk buttons and existing `siteConfig.kakao`.
- Keep pricing placeholders until final Korean monthly rates are provided.

## Test Plan

- Run build/type checks.
- Verify English pages render unchanged: `/`, `/rooms`, `/request-to-book`, `/policies`, `/contact`.
- Verify Korean pages:
  - `/ko` has Korean copy, KRW pricing placeholder, Kakao/phone CTAs, no PayPal language.
  - `/ko/request-to-book` submits successfully and records Korean locale.
  - `/ko/policies` mentions 계좌이체/카카오페이, not PayPal.
  - `/policies/ko` redirects to `/ko/policies`.
- Verify SEO:
  - Korean pages have Korean metadata.
  - sitemap includes `/ko` routes.
  - `hreflang` includes `en`, `ko`, and `x-default`.
  - Naver verification remains intact.
- Mobile check:
  - Korean text does not overflow.
  - language switcher, Kakao, phone, and booking buttons are reachable.

## Assumptions

- Target audience is local Korean long-stay residents, especially students and exam-prep residents.
- Korean users should request booking through the site, then continue via KakaoTalk or phone.
- Korean payment methods are KakaoPay or Korean bank transfer, not PayPal.
- Exact Korean monthly pricing and deposit terms are not final yet, so the implementation should use clearly named placeholders.
