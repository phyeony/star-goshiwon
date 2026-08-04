# Guest Residence Documents — Design Spec

Date: 2026-07-05
Revised: 2026-08-04 — added admin-editable document templates + DOCX upload
Status: implemented 2026-08-05 (commits b69c0b0, 81e388e, fc9b6d7)

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
| Document wording source (rev. 2026-08-04) | **DB-backed templates with a code fallback.** A `document_templates` row for a (type, lang) pair overrides the built-in document; with no row, the code-built document renders. The feature therefore works before any template is uploaded. |
| Updating a template (rev. 2026-08-04) | **Upload a .docx**, or paste/edit HTML directly. The upload is converted to HTML *at upload time* and stored as text — the file itself is never stored, so no R2 bucket or Supabase Storage is needed and the render pipeline is unchanged. |
| Per-booking data in templates (rev. 2026-08-04) | `{{token}}` substitution reusing `substitute()` from `lib/admin-email-templates.ts`. The admin types tokens into the Word document before uploading. |

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

## Admin-editable templates (rev. 2026-08-04)

The owner must be able to change the contract wording — and replace the whole
format from an existing Word file — without a code change or deploy.

**Storage.** One additive table:

```
document_templates
  id                uuid pk
  type              text     'letter' | 'contract'
  lang              text     'ko' | 'en'
  title             text     document title, overrides the built-in
  body_html         text     the document body, with {{tokens}}
  source_filename   text     e.g. "계약서_2026.docx" — provenance only
  updated_at        timestamptz
  updated_by_email  text
  unique (type, lang)
```

**Resolution.** `resolveDocument(type, lang, booking, form)` returns the
template-rendered document when a row exists for that pair, and the
code-built `DocumentModel` otherwise. A missing or deleted row is always a
safe state: the built-in document takes over. Both shapes feed the same
preview, print route, and email renderer.

**Upload.** `.docx` is converted to HTML on upload (`mammoth`) and stored in
`body_html`; the binary is discarded. Fidelity is approximate — headings,
paragraphs, and simple tables survive; text boxes, columns, and exact fonts
do not — so the admin previews and touches up the HTML before saving. Pasting
or editing HTML directly is always available and is the fallback if the DOCX
converter cannot run in the Workers runtime.

**Tokens.** The admin types `{{guest_name}}`, `{{room_name}}`, `{{period}}`,
`{{passport_number}}`, `{{nationality}}`, `{{date_of_birth}}`,
`{{home_address}}`, `{{special_terms}}`, `{{total_usd}}`, `{{deposit_usd}}`,
`{{issue_date}}`, `{{issuer_name}}`, `{{issuer_registration_number}}`,
`{{issuer_representative}}`, `{{issuer_address}}` into the Word file before
uploading. Substitution reuses `substitute()` from
`lib/admin-email-templates.ts`; unknown tokens are left visible rather than
silently blanked, so a typo shows up in the preview.

**Legal guard.** Once a contract body is uploaded wholesale, the non-lease
framing is the owner's to maintain — nothing can structurally protect it. The
save action therefore shows a **non-blocking warning** when a contract body
contains `임대차계약서` / "lease" or lacks a non-lease statement. It warns; it
does not refuse.

**Trust boundary.** Only allowlisted admins can upload, and the stored HTML is
rendered with `dangerouslySetInnerHTML` after `<script>`/event-handler
stripping. This is an admin-trusted surface, not a guest-facing one.

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
7. **`supabase/migrations/<date>-document-templates.sql`** (rev. 2026-08-04) —
   additive `document_templates` table above, plus `schema.sql` and
   `lib/types.ts` entries. No change to existing tables.
8. **`lib/documents/templates.ts`** (rev. 2026-08-04) — token map builder
   (`buildDocumentVarMap(booking, form, issuer, lang)`), HTML sanitizer, and
   `renderTemplateBody(template, vars)`. Pure; unit-tested.
9. **`lib/documents/resolve.ts`** (rev. 2026-08-04) — `resolveDocument(...)`
   returning either `{ kind: "model", model }` (code-built) or
   `{ kind: "html", title, html }` (template-rendered). The single seam every
   surface goes through.
10. **`lib/documents/docx.ts`** (rev. 2026-08-04) — `convertDocxToHtml(bytes)`
    via `mammoth`. Isolated in one module so the paste-HTML fallback is a
    one-file removal if the Workers runtime rejects it.
11. **`/admin/document-templates`** (rev. 2026-08-04) — list of the four
    (type, lang) slots showing built-in vs custom, an editor with .docx
    upload + HTML textarea + live preview + token reference, a save that runs
    the legal-guard warning, and a delete that reverts the slot to built-in.
    Mirrors `/admin/email-templates`.

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
- **Templates** (rev. 2026-08-04): unit tests for token substitution
  (including unknown-token passthrough), HTML sanitizing, and the legal-guard
  warning; `resolveDocument` falling back to the built-in document when no row
  exists; DOCX conversion asserted against a small fixture `.docx` committed
  under `lib/documents/__fixtures__/`. E2E: uploading a template changes the
  emailed document, and deleting it restores the built-in one.

## Out of scope (YAGNI)

- E-signature flow.
- Persisting *issued* documents or guest legal data in the DB. (Templates are
  persisted; filled-in documents and passport data are not.)
- Template version history / rollback. The emailed copy in `email_sends`
  records what was actually sent; printed PDFs have no such record.
- Uploading HWP/HWPX or PDF. 한글 exports to .docx; that is the import path.
- Guest-facing or non-admin template editing.
- A documents list/history page (email audit already records sends).
- Server-side PDF generation / attachments (revisit only if guests
  report the email-body format being rejected by officials).

## Open items for the owner

- Fill real values in `lib/documents/issuer.ts`: 사업자등록번호,
  대표자명, Korean business name + address, stamp image.
- Confirm with 출입국·외국인청 (or a 행정사) whether typical guests'
  visa types need the letter, the contract, or both.
- (rev. 2026-08-04) Provide the existing contract as a `.docx` with
  `{{tokens}}` typed in where guest data belongs, so the import path can be
  verified against the real document rather than a synthetic fixture.

## Known risk (rev. 2026-08-04, updated 2026-08-05)

`mammoth` (added as a dependency) **builds cleanly into the OpenNext/Workers
bundle** — verified with `opennextjs-cloudflare build`. Its *runtime* behaviour
on Workers is still unverified: the conversion route sits behind admin auth,
so it cannot be exercised through `opennextjs-cloudflare preview` without a
Supabase login. First real proof comes from a staging deploy.

If it does fail at runtime, the fallback needs no code change: the admin
pastes HTML into the editor instead (converting the .docx locally once), and
`lib/documents/docx.ts` plus the `convert` route can be deleted in one pass.
Everything else — templates, resolution, rendering, sending — is independent
of the DOCX path.

## Verification at implementation (2026-08-05)

- `pnpm run verify` green: 84 unit tests, production build, 13 e2e.
- Unit coverage: builders (KO/EN, missing fields, room fallback), email HTML
  and text rendering, token substitution + unknown-token passthrough, HTML
  sanitizing, non-lease wording warnings, and `resolveDocument` fallback.
- E2E: built-in letter (KO) and contract (EN) sends land in the test outbox
  with an audit row; an uploaded template replaces the document and deleting
  it restores the built-in one; unknown booking returns `not_found`.
- **Not yet verified by hand** (needs an admin browser session): the live
  preview, the print dialog output for all four variants, and a real .docx
  upload through the UI.
