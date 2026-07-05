# Guest Residence Documents — Design Spec

Date: 2026-07-05
Status: approved design, pending implementation plan

## Goal

Let the admin issue two guest-facing documents from a booking request —
a residence confirmation letter and an accommodation agreement — preview
them live, save them as PDF via the browser's print dialog, and email
them to the guest. Guests need these for immigration (체류지 변경신고,
외국인등록), visa paperwork, or banks.

## Decisions (locked)

| Decision | Choice |
| --- | --- |
| PDF generation | **Print-to-PDF** (browser `window.print()` → Save as PDF). No server-side PDF, no new infra, no Browser Rendering binding. |
| Guest legal data (passport #, nationality, DOB, home address) | **Form-only, ephemeral.** Never persisted to the DB. React state + `sessionStorage` draft only. |
| Language | **Two separate versions** — admin picks KO or EN per document; each renders standalone. |
| UX placement | **Card on the existing request detail page** (`/admin/requests/[id]`), not a new page. Print view is a separate chrome-free route. |
| Send button | **Option A** — the document is rendered as the email's HTML body and sent through the existing `sendEmail` + `createEmailSend` audit pipeline. No attachment, no tokenized link. Email includes a "print / save as PDF" hint for the guest. |

## The two documents

| | KO title | EN title | Purpose |
| --- | --- | --- | --- |
| Letter | 체류(숙소) 확인서 | Accommodation (Residence) Confirmation | One-page proof of stay: guest identity, room, dates, issuer identity, statement of fact, issue date, signature/stamp. |
| Contract | 숙소 이용 계약서 | Accommodation Agreement | Terms of stay: parties, room, period, rates/deposit (prefilled from booking), house rules summary, special terms (free text), signature lines for both parties. |

**Legal framing (deliberate):** the contract is an accommodation
agreement (숙소 이용 계약서), NOT a 주택임대차계약서 — labeling short
foreign stays as a residential lease would invoke 주택임대차보호법
tenancy rights. Both documents state only facts backed by the booking
record. Documents are only issuable per real booking request, which
enforces "only certify true stays."

## Components

1. **`lib/documents/issuer.ts`** — static issuer identity: business
   name (KO/EN), 사업자등록번호, 대표자명, address (KO/EN), phone,
   optional stamp (직인) image path. Ships with clearly marked
   placeholders; the owner fills in real values. English address/phone
   can seed from `siteConfig` (`lib/site-data.ts`).
2. **`lib/documents/build.ts`** — pure builders
   `buildLetter(booking, form, issuer, lang)` and
   `buildContract(booking, form, issuer, lang)` returning a structured
   document model (title, labeled field rows, body paragraphs,
   signature block). No I/O. Unit-tested in `lib/documents/build.test.ts`.
3. **Document renderers** — `LetterDocument` / `ContractDocument`
   React components render the model with print-friendly CSS. Used by
   both the inline preview and the print route. A thin email-HTML
   renderer (inline styles, consistent with `lib/email-html.ts`
   conventions) reuses the same model for the send body.
4. **`components/admin/documents-card.tsx`** (client) — the 문서 발급
   card on the request detail page:
   - Ephemeral form: passport #, nationality, DOB; home address +
     special terms (contract only). Deposit/total/dates prefilled from
     the booking.
   - Letter/Contract toggle + KO/EN toggle.
   - Live inline preview (scaled-down document).
   - Buttons: **인쇄 / PDF 저장** (opens print route in new tab) and
     **게스트에게 발송** (POSTs to send API).
   - Draft form state mirrored to `sessionStorage` (survives refresh;
     browser-only).
5. **Print route** — `app/admin/requests/[id]/documents/print/page.tsx`
   (client page behind existing `/admin/:path*` auth middleware). Reads
   doc type + lang from query params and the ephemeral form fields from
   `sessionStorage` (passport data never in URLs). Renders only the
   document with print CSS and auto-invokes `window.print()`.
6. **Send API** — `app/api/admin/requests/[id]/send-document/route.ts`,
   modeled on the existing `send-email` route: admin auth via
   `getAdminUserOrNull`, zod-validate posted form fields + doc type +
   lang, load booking via `getBookingRequestById`, build model, render
   email HTML + plain-text fallback, `sendEmail(...)`, then
   `createEmailSend(...)` audit row (so sends appear in Email History).
   Guest legal fields exist only in the request body — not logged, not
   stored beyond the email audit copy of the sent body.

## Data flow

```
DocumentsCard (booking props + ephemeral form state)
  └─► build.ts model ─► inline preview (React)
                     ─► print route (sessionStorage handoff) ─► window.print() → PDF
                     ─► send API (POST body) ─► email HTML ─► sendEmail + audit row
```

## Error handling

- Send API returns the same shape as `send-email` (`invalid_body`,
  `not_found`, `send_failed`); card shows a toast on failure and links
  to Email History on success.
- Print route with missing sessionStorage draft (e.g. opened directly)
  falls back to booking-only fields and renders blanks for the
  ephemeral ones, with a visible "필수 정보 누락" warning bar that is
  hidden in print CSS.
- Builders tolerate missing optional fields (no stamp image, no home
  address) and degrade gracefully.

## Testing

- **Unit** (`lib/documents/build.test.ts`): builders produce correct
  labeled fields for fixture booking + form in KO and EN; currency/date
  formatting; graceful handling of missing optional fields.
- **E2E** (`e2e/documents.spec.ts`, mirroring `payment-flow.spec.ts`):
  admin opens seeded booking → fills passport/nationality → preview DOM
  contains passport #, room, dates, 사업자등록번호 → print route renders
  the document standalone → Send captures an email in the
  `E2E_TEST_MODE` test outbox addressed to the guest with document
  content in the body → audit row appears in Email History.
- **Manual**: `DEV_EMAIL_OVERRIDE` redirects real sends to the dev
  mailbox; all four variants (letter/contract × KO/EN) checked via
  Save-as-PDF. The rasterized PDF itself is not machine-verifiable
  (native print dialog); the print route's HTML is the tested artifact.

## Out of scope (YAGNI)

- E-signature flow.
- Persisting documents or guest legal data in the DB.
- A documents list/history page (email audit already records sends).
- Server-side PDF generation / attachments (revisit only if guests
  report the email-body format being rejected by officials).

## Open items for the owner

- Fill real values in `lib/documents/issuer.ts`: 사업자등록번호,
  대표자명, Korean business name + address, stamp image.
- Confirm with 출입국·외국인청 (or a 행정사) whether typical guests'
  visa types need the letter, the contract, or both.
