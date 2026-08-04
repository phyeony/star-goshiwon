> **STATUS: SUPERSEDED — implemented 2026-08-05.**
>
> This plan was written for the pre-revision spec (code-only document wording).
> The 2026-08-04 spec revision added DB-backed templates and .docx upload,
> which reshaped Tasks 4–6. The feature shipped in commits `b69c0b0`,
> `81e388e`, `fc9b6d7`; `pnpm run verify` is green (84 unit tests, production
> build, 13 e2e).
>
> Tasks 1–3 below (document model, letter builder, contract builder, email
> renderer) shipped essentially as written. What changed in flight:
>
> - `@/…` imports do not resolve in vitest; files under `lib/` use relative
>   imports. Test fixtures moved to `lib/documents/test-fixtures.ts` so
>   importing them does not re-register another file's suites.
> - Added beyond the plan: `lib/documents/{queries,templates,resolve,docx}.ts`,
>   the `document_templates` migration, `/admin/document-templates` with the
>   editor component, and the `mammoth` dependency.
> - `DocumentView` takes a `ResolvedDocument` (built-in model *or* uploaded
>   HTML), not a bare `DocumentModel`.
> - The e2e fixture route gained `set-template` / `clear-template` actions.
>
> Kept for the task-by-task reasoning and test lists. For current behaviour,
> read `plan/guest-residence-documents.md` and the code.

# Guest Residence Documents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the admin issue, preview, print-to-PDF, and email two guest-facing documents (a residence confirmation letter and an accommodation agreement) from a booking request detail page.

**Architecture:** Pure builders in `lib/documents/` turn a booking row + an ephemeral form into a `DocumentModel` (title, labeled sections, statement paragraphs, signature lines). One presentational React component renders that model for both the inline admin preview and a chrome-free print page (browser Save-as-PDF). One string renderer turns the same model into email HTML/text, sent through the existing `sendEmail` + `createEmailSend` audit pipeline. Guest legal fields (passport, nationality, DOB, home address) live only in React state, `sessionStorage`, and the send request body — never in a DB column.

**Tech Stack:** Next.js 15 App Router (RSC + client components), TypeScript, Tailwind, Zod, Supabase (service client via `lib/queries.ts`), Vitest (unit), Playwright (e2e).

**Source spec:** `plan/guest-residence-documents.md` (approved design, commit `fd50418`).

## Global Constraints

- **pnpm only.** `pnpm test`, `pnpm run build`, `pnpm run test:e2e`, `pnpm run verify`. Never `npm`/`yarn`.
- **No new dependencies.** Everything here uses what is already installed.
- **No DB migration.** Nothing in this feature adds a column, table, or Supabase type. If a step seems to need one, stop — the design forbids persisting guest legal data.
- **Guest legal fields are ephemeral**: React state → `sessionStorage` → send POST body. Never logged (`console.log`), never written to `booking_requests`, never placed in a URL query string. The only durable copy is the rendered email body inside the existing `email_sends` audit row.
- **Contract title is fixed** as `숙소 이용 계약서` / `Accommodation Agreement`. Never `주택임대차계약서` or "lease" — that wording would invoke 주택임대차보호법 tenancy rights. The contract body must keep the explicit non-lease clause specified in Task 2.
- **Admin UI copy is Korean** (matches every existing `/admin` page). Document *content* is Korean or English depending on the selected `lang`.
- **Admin surfaces stay behind middleware auth**: everything under `/admin/:path*` and `/api/admin/:path*` is already guarded by `middleware.ts`. Do not add auth bypasses. Playwright cannot log into `/admin` (Supabase magic-link/Google only), so admin-only UI is verified manually and the send path is exercised through an `E2E_TEST_MODE`-gated test route, exactly like `app/api/test/refund/route.ts`.
- **Commit after every task** with a conventional-commit message.

## File Structure

| File | Responsibility |
| --- | --- |
| `lib/documents/issuer.ts` (create) | Static issuer identity (business names, 사업자등록번호, 대표자, addresses, contact, stamp path). Placeholders the owner fills in. |
| `lib/documents/types.ts` (create) | `DocumentType`, `DocumentLang`, `GuestDocumentForm`, `DocumentModel` and its parts. No logic. |
| `lib/documents/build.ts` (create) | Pure `buildLetter` / `buildContract` / `buildDocument` + date/label helpers. No I/O. |
| `lib/documents/build.test.ts` (create) | Unit tests for the builders. |
| `lib/documents/email-html.ts` (create) | `documentEmailSubject` / `renderDocumentEmailHtml` / `renderDocumentText` — model → email strings. |
| `lib/documents/email-html.test.ts` (create) | Unit tests for the email renderer. |
| `lib/documents/send.ts` (create) | `sendDocumentEmail()` — load booking, build, render, send, audit. Shared by the admin route and the e2e test route. |
| `lib/email-html.ts` (modify) | Export the existing `escapeHtml` so the document renderer reuses it. |
| `components/documents/document-view.tsx` (create) | Presentational renderer for a `DocumentModel`, print-friendly. Used by preview + print page. |
| `components/admin/documents-card.tsx` (create) | Client card: ephemeral form, type/lang toggles, live preview, 인쇄 + 발송 buttons, sessionStorage draft. |
| `components/admin/document-print-client.tsx` (create) | Client child of the print page: reads sessionStorage + query params, renders `DocumentView`, auto `window.print()`. |
| `app/admin/requests/[id]/documents/print/page.tsx` (create) | Server page: loads booking, renders the print client. Chrome-free. |
| `app/admin/requests/[id]/page.tsx` (modify) | Render `<DocumentsCard>` in the actions sidebar. |
| `app/api/admin/requests/[id]/send-document/route.ts` (create) | Admin-authed POST → `sendDocumentEmail`. |
| `app/api/test/document-fixture/route.ts` (create) | `E2E_TEST_MODE`-only fixture: create a booking, invoke the real send path. |
| `e2e/documents.spec.ts` (create) | End-to-end coverage of the send path + audit row. |

---

### Task 1: Document model foundation + letter builder

**Files:**
- Create: `lib/documents/issuer.ts`
- Create: `lib/documents/types.ts`
- Create: `lib/documents/build.ts`
- Test: `lib/documents/build.test.ts`

**Interfaces:**
- Consumes: `BookingRequestWithRoom` from `@/lib/types`; `daysBetween` from `@/lib/dates`; `formatUSD`, `DEPOSIT_USD` from `@/lib/pricing`.
- Produces:
  - `type DocumentType = "letter" | "contract"`, `type DocumentLang = "ko" | "en"`
  - `interface GuestDocumentForm { passportNumber; nationality; dateOfBirth; homeAddress; specialTerms; issueDate }` (all `string`)
  - `const EMPTY_DOCUMENT_FORM: GuestDocumentForm`
  - `interface DocumentField { label: string; value: string }`
  - `interface DocumentSection { heading: string; fields: DocumentField[]; paragraphs: string[] }`
  - `interface DocumentSignature { role: string; name: string; showStamp: boolean }`
  - `interface DocumentModel { type; lang; title; subtitle; sections; statement: string[]; issueDateLine: string; signatures: DocumentSignature[]; missingFields: string[] }`
  - `interface Issuer` + `const ISSUER: Issuer`
  - `function formatDocumentDate(iso: string, lang: DocumentLang): string`
  - `function buildLetter(booking: BookingRequestWithRoom, form: GuestDocumentForm, issuer: Issuer, lang: DocumentLang): DocumentModel`

- [ ] **Step 1: Write the issuer identity module**

Create `lib/documents/issuer.ts`:

```ts
import { siteConfig } from "@/lib/site-data";

export interface Issuer {
  businessNameKo: string;
  businessNameEn: string;
  /** 사업자등록번호 */
  registrationNumber: string;
  representativeKo: string;
  representativeEn: string;
  addressKo: string;
  addressEn: string;
  phone: string;
  email: string;
  /** Path under /public, e.g. "/images/documents/stamp.png". null = no stamp image. */
  stampImagePath: string | null;
}

// PLACEHOLDERS — the owner must replace the marked values with the real
// business registration details before any document is issued to a guest.
// Everything here is public-facing document content; nothing is secret.
export const ISSUER: Issuer = {
  businessNameKo: "스타고시원", // TODO(owner): confirm registered Korean business name
  businessNameEn: siteConfig.name,
  registrationNumber: "000-00-00000", // TODO(owner): real 사업자등록번호
  representativeKo: "홍길동", // TODO(owner): real 대표자명 (Korean)
  representativeEn: "Hong Gil-dong", // TODO(owner): real representative name (romanized)
  addressKo: "서울특별시 동작구 만양로12가길 64", // TODO(owner): confirm Korean address
  addressEn: siteConfig.address,
  phone: siteConfig.phone,
  email: siteConfig.email,
  stampImagePath: null, // TODO(owner): add 직인 image to /public and set the path
};
```

- [ ] **Step 2: Write the document model types**

Create `lib/documents/types.ts`:

```ts
export type DocumentType = "letter" | "contract";
export type DocumentLang = "ko" | "en";

/**
 * Guest legal data typed by the admin. EPHEMERAL BY DESIGN — React state,
 * sessionStorage draft, and the send request body only. Never persisted.
 */
export interface GuestDocumentForm {
  passportNumber: string;
  nationality: string;
  /** YYYY-MM-DD */
  dateOfBirth: string;
  /** Contract only. */
  homeAddress: string;
  /** Contract only, free text. */
  specialTerms: string;
  /** YYYY-MM-DD */
  issueDate: string;
}

export const EMPTY_DOCUMENT_FORM: GuestDocumentForm = {
  passportNumber: "",
  nationality: "",
  dateOfBirth: "",
  homeAddress: "",
  specialTerms: "",
  issueDate: "",
};

export interface DocumentField {
  label: string;
  value: string;
}

export interface DocumentSection {
  heading: string;
  fields: DocumentField[];
  paragraphs: string[];
}

export interface DocumentSignature {
  role: string;
  name: string;
  showStamp: boolean;
}

export interface DocumentModel {
  type: DocumentType;
  lang: DocumentLang;
  title: string;
  subtitle: string;
  sections: DocumentSection[];
  /** Body paragraphs rendered after the sections. */
  statement: string[];
  issueDateLine: string;
  signatures: DocumentSignature[];
  /** Labels of required ephemeral fields left blank — surfaced as a warning, hidden in print. */
  missingFields: string[];
}
```

- [ ] **Step 3: Write the failing test for the letter builder**

Create `lib/documents/build.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildLetter, formatDocumentDate } from "./build";
import { ISSUER } from "./issuer";
import { EMPTY_DOCUMENT_FORM, type GuestDocumentForm } from "./types";
import type { BookingRequestWithRoom } from "@/lib/types";

export const fixtureBooking = {
  id: "req-1",
  guest_name: "Jane Traveler",
  guest_email: "jane@example.com",
  guest_count: 1,
  room_id: "room-1",
  assigned_room_unit_id: "unit-1",
  room_slug: "room-with-private-shower",
  check_in_date: "2026-06-01",
  check_out_date: "2026-07-01",
  estimated_total: 700,
  bedding_prepaid: true,
  payment_status: "paid",
  payment_provider: "paypal",
  payment_order_id: null,
  payment_capture_id: null,
  payment_approval_url: null,
  payment_amount: 700,
  payment_currency: "USD",
  payment_created_at: null,
  payment_paid_at: null,
  payment_expires_at: null,
  payment_token_hash: null,
  payment_token_created_at: null,
  payment_error: "",
  refund_amount: 0,
  refunded_at: null,
  refund_id: null,
  notes: "",
  status: "confirmed",
  admin_notes: "",
  created_at: "2026-05-01T00:00:00.000Z",
  updated_at: "2026-05-01T00:00:00.000Z",
  rooms: {
    name: "Room with Private Shower",
    name_ko: "샤워실 있는 방",
    slug: "room-with-private-shower",
    nightly_rate_usd: 21,
    long_stay_discount: 0.15,
  },
  room_units: { name: "301" },
} as BookingRequestWithRoom;

export const fixtureForm: GuestDocumentForm = {
  ...EMPTY_DOCUMENT_FORM,
  passportNumber: "M12345678",
  nationality: "United States",
  dateOfBirth: "1995-03-14",
  homeAddress: "1 Main St, Springfield, USA",
  specialTerms: "",
  issueDate: "2026-08-04",
};

describe("formatDocumentDate", () => {
  it("formats Korean dates", () => {
    expect(formatDocumentDate("2026-06-01", "ko")).toBe("2026년 6월 1일");
  });

  it("formats English dates", () => {
    expect(formatDocumentDate("2026-06-01", "en")).toBe("1 June 2026");
  });

  it("returns an empty string for a blank input", () => {
    expect(formatDocumentDate("", "ko")).toBe("");
  });
});

describe("buildLetter", () => {
  it("builds the Korean letter with guest, stay, and issuer facts", () => {
    const model = buildLetter(fixtureBooking, fixtureForm, ISSUER, "ko");

    expect(model.type).toBe("letter");
    expect(model.title).toBe("체류(숙소) 확인서");

    const fields = model.sections.flatMap((s) => s.fields);
    const byLabel = (label: string) =>
      fields.find((f) => f.label === label)?.value;

    expect(byLabel("성명")).toBe("Jane Traveler");
    expect(byLabel("국적")).toBe("United States");
    expect(byLabel("여권번호")).toBe("M12345678");
    expect(byLabel("생년월일")).toBe("1995년 3월 14일");
    expect(byLabel("객실")).toBe("샤워실 있는 방 (301)");
    expect(byLabel("체류 기간")).toBe("2026년 6월 1일 ~ 2026년 7월 1일 (30박)");
    expect(byLabel("사업자등록번호")).toBe(ISSUER.registrationNumber);
    expect(model.issueDateLine).toBe("발급일: 2026년 8월 4일");
    expect(model.signatures).toHaveLength(1);
    expect(model.missingFields).toEqual([]);
  });

  it("builds the English letter with the English room name", () => {
    const model = buildLetter(fixtureBooking, fixtureForm, ISSUER, "en");

    expect(model.title).toBe("Accommodation (Residence) Confirmation");

    const fields = model.sections.flatMap((s) => s.fields);
    const byLabel = (label: string) =>
      fields.find((f) => f.label === label)?.value;

    expect(byLabel("Room")).toBe("Room with Private Shower (301)");
    expect(byLabel("Period of stay")).toBe("1 June 2026 – 1 July 2026 (30 nights)");
    expect(model.issueDateLine).toBe("Date of issue: 4 August 2026");
  });

  it("falls back to the room slug and blanks missing optional data", () => {
    const booking = {
      ...fixtureBooking,
      rooms: null,
      room_units: null,
    } as BookingRequestWithRoom;
    const model = buildLetter(booking, fixtureForm, ISSUER, "en");

    const room = model.sections
      .flatMap((s) => s.fields)
      .find((f) => f.label === "Room")?.value;
    expect(room).toBe("room-with-private-shower");
  });

  it("reports blank required guest fields instead of throwing", () => {
    const model = buildLetter(
      fixtureBooking,
      { ...EMPTY_DOCUMENT_FORM, issueDate: "2026-08-04" },
      ISSUER,
      "ko",
    );

    expect(model.missingFields).toEqual(["여권번호", "국적", "생년월일"]);
    const passport = model.sections
      .flatMap((s) => s.fields)
      .find((f) => f.label === "여권번호")?.value;
    expect(passport).toBe("—");
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `pnpm exec vitest run lib/documents/build.test.ts`
Expected: FAIL — `Failed to resolve import "./build"`.

- [ ] **Step 5: Implement the builder**

Create `lib/documents/build.ts`:

```ts
import { daysBetween } from "@/lib/dates";
import type { BookingRequestWithRoom } from "@/lib/types";
import type { Issuer } from "./issuer";
import type {
  DocumentField,
  DocumentLang,
  DocumentModel,
  GuestDocumentForm,
} from "./types";

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const BLANK = "—";

export function formatDocumentDate(iso: string, lang: DocumentLang): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return lang === "ko"
    ? `${y}년 ${m}월 ${d}일`
    : `${d} ${MONTHS_EN[m - 1]} ${y}`;
}

function shown(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : BLANK;
}

export function issuerName(issuer: Issuer, lang: DocumentLang): string {
  return lang === "ko" ? issuer.businessNameKo : issuer.businessNameEn;
}

export function issuerAddress(issuer: Issuer, lang: DocumentLang): string {
  return lang === "ko" ? issuer.addressKo : issuer.addressEn;
}

export function issuerRepresentative(issuer: Issuer, lang: DocumentLang): string {
  return lang === "ko" ? issuer.representativeKo : issuer.representativeEn;
}

export function roomLabel(
  booking: BookingRequestWithRoom,
  lang: DocumentLang,
): string {
  const room = booking.rooms;
  const name =
    lang === "ko" ? room?.name_ko || room?.name : room?.name;
  const base = name || booking.room_slug;
  const unit = booking.room_units?.name;
  return unit ? `${base} (${unit})` : base;
}

export function stayPeriod(
  booking: BookingRequestWithRoom,
  lang: DocumentLang,
): string {
  const nights = daysBetween(booking.check_in_date, booking.check_out_date);
  const from = formatDocumentDate(booking.check_in_date, lang);
  const to = formatDocumentDate(booking.check_out_date, lang);
  return lang === "ko"
    ? `${from} ~ ${to} (${nights}박)`
    : `${from} – ${to} (${nights} nights)`;
}

const LETTER_TEXT = {
  ko: {
    title: "체류(숙소) 확인서",
    guestHeading: "체류자 정보",
    stayHeading: "숙소 및 체류 정보",
    issuerHeading: "발급자 정보",
    guestName: "성명",
    nationality: "국적",
    passportNumber: "여권번호",
    dateOfBirth: "생년월일",
    accommodation: "숙소명",
    address: "숙소 주소",
    room: "객실",
    period: "체류 기간",
    businessName: "상호",
    registrationNumber: "사업자등록번호",
    representative: "대표자",
    phone: "연락처",
    issueDate: "발급일",
  },
  en: {
    title: "Accommodation (Residence) Confirmation",
    guestHeading: "Guest information",
    stayHeading: "Accommodation and stay",
    issuerHeading: "Issuer",
    guestName: "Name",
    nationality: "Nationality",
    passportNumber: "Passport number",
    dateOfBirth: "Date of birth",
    accommodation: "Accommodation",
    address: "Address",
    room: "Room",
    period: "Period of stay",
    businessName: "Business name",
    registrationNumber: "Business registration no.",
    representative: "Representative",
    phone: "Contact",
    issueDate: "Date of issue",
  },
} as const;

function letterStatement(
  booking: BookingRequestWithRoom,
  issuer: Issuer,
  lang: DocumentLang,
): string[] {
  if (lang === "ko") {
    return [
      `위 사람은 ${issuerName(issuer, lang)}(${issuerAddress(issuer, lang)})에 ` +
        `${stayPeriod(booking, lang)} 동안 숙소를 계약하고 실제로 체류하고 있음을 확인합니다.`,
      "본 확인서는 상기 숙박 예약 기록에 근거하여 사실대로 발급되었으며, 체류지 신고 등 행정 목적으로 사용될 수 있습니다.",
    ];
  }
  return [
    `This is to certify that the person named above has booked accommodation at ` +
      `${issuerName(issuer, lang)} (${issuerAddress(issuer, lang)}) and is staying there for ` +
      `${stayPeriod(booking, lang)}.`,
    "This confirmation is issued on the basis of the accommodation booking record above and may be used for administrative purposes such as reporting a place of residence.",
  ];
}

function missingGuestFields(
  form: GuestDocumentForm,
  lang: DocumentLang,
): string[] {
  const t = LETTER_TEXT[lang];
  const missing: string[] = [];
  if (!form.passportNumber.trim()) missing.push(t.passportNumber);
  if (!form.nationality.trim()) missing.push(t.nationality);
  if (!form.dateOfBirth.trim()) missing.push(t.dateOfBirth);
  return missing;
}

function issuerFields(issuer: Issuer, lang: DocumentLang): DocumentField[] {
  const t = LETTER_TEXT[lang];
  return [
    { label: t.businessName, value: shown(issuerName(issuer, lang)) },
    { label: t.registrationNumber, value: shown(issuer.registrationNumber) },
    { label: t.representative, value: shown(issuerRepresentative(issuer, lang)) },
    { label: t.address, value: shown(issuerAddress(issuer, lang)) },
    { label: t.phone, value: shown(issuer.phone) },
  ];
}

export function buildLetter(
  booking: BookingRequestWithRoom,
  form: GuestDocumentForm,
  issuer: Issuer,
  lang: DocumentLang,
): DocumentModel {
  const t = LETTER_TEXT[lang];

  return {
    type: "letter",
    lang,
    title: t.title,
    subtitle: issuerName(issuer, lang),
    sections: [
      {
        heading: t.guestHeading,
        fields: [
          { label: t.guestName, value: shown(booking.guest_name) },
          { label: t.nationality, value: shown(form.nationality) },
          { label: t.passportNumber, value: shown(form.passportNumber) },
          {
            label: t.dateOfBirth,
            value: form.dateOfBirth
              ? formatDocumentDate(form.dateOfBirth, lang)
              : BLANK,
          },
        ],
        paragraphs: [],
      },
      {
        heading: t.stayHeading,
        fields: [
          { label: t.accommodation, value: shown(issuerName(issuer, lang)) },
          { label: t.address, value: shown(issuerAddress(issuer, lang)) },
          { label: t.room, value: shown(roomLabel(booking, lang)) },
          { label: t.period, value: stayPeriod(booking, lang) },
        ],
        paragraphs: [],
      },
      {
        heading: t.issuerHeading,
        fields: issuerFields(issuer, lang),
        paragraphs: [],
      },
    ],
    statement: letterStatement(booking, issuer, lang),
    issueDateLine: `${t.issueDate}: ${formatDocumentDate(form.issueDate, lang)}`,
    signatures: [
      {
        role: t.representative,
        name: issuerRepresentative(issuer, lang),
        showStamp: true,
      },
    ],
    missingFields: missingGuestFields(form, lang),
  };
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm exec vitest run lib/documents/build.test.ts`
Expected: PASS — 7 tests.

- [ ] **Step 7: Commit**

```bash
git add lib/documents/issuer.ts lib/documents/types.ts lib/documents/build.ts lib/documents/build.test.ts
git commit -m "feat(documents): document model, issuer identity, and residence letter builder"
```

---

### Task 2: Accommodation contract builder

**Files:**
- Modify: `lib/documents/build.ts` (append)
- Test: `lib/documents/build.test.ts` (append)

**Interfaces:**
- Consumes: everything Task 1 produced (`shown`, `roomLabel`, `stayPeriod`, `issuerName`, `formatDocumentDate`, `Issuer`, `DocumentModel`), plus `formatUSD` and `DEPOSIT_USD` from `@/lib/pricing`.
- Produces:
  - `function buildContract(booking: BookingRequestWithRoom, form: GuestDocumentForm, issuer: Issuer, lang: DocumentLang): DocumentModel`
  - `function buildDocument(type: DocumentType, booking: BookingRequestWithRoom, form: GuestDocumentForm, issuer: Issuer, lang: DocumentLang): DocumentModel`

- [ ] **Step 1: Write the failing tests**

Append to `lib/documents/build.test.ts`:

```ts
import { buildContract, buildDocument } from "./build";

describe("buildContract", () => {
  it("builds the Korean contract with parties, pricing, and rules", () => {
    const model = buildContract(fixtureBooking, fixtureForm, ISSUER, "ko");

    expect(model.type).toBe("contract");
    expect(model.title).toBe("숙소 이용 계약서");

    const fields = model.sections.flatMap((s) => s.fields);
    const byLabel = (label: string) =>
      fields.find((f) => f.label === label)?.value;

    expect(byLabel("이용자 성명")).toBe("Jane Traveler");
    expect(byLabel("여권번호")).toBe("M12345678");
    expect(byLabel("본국 주소")).toBe("1 Main St, Springfield, USA");
    expect(byLabel("객실")).toBe("샤워실 있는 방 (301)");
    expect(byLabel("이용 기간")).toBe("2026년 6월 1일 ~ 2026년 7월 1일 (30박)");
    expect(byLabel("이용 요금 총액")).toBe("$700");
    expect(byLabel("보증금")).toBe("$70");
    expect(byLabel("침구 세트")).toBe("포함 (선결제)");

    // Both parties sign.
    expect(model.signatures.map((s) => s.role)).toEqual(["대표자", "이용자"]);
    expect(model.signatures[1].name).toBe("Jane Traveler");
  });

  it("states that the agreement is not a residential lease", () => {
    const ko = buildContract(fixtureBooking, fixtureForm, ISSUER, "ko");
    const en = buildContract(fixtureBooking, fixtureForm, ISSUER, "en");

    const koText = ko.sections.flatMap((s) => s.paragraphs).join(" ");
    const enText = en.sections.flatMap((s) => s.paragraphs).join(" ");

    expect(koText).toContain("주택임대차보호법");
    expect(ko.title).not.toContain("임대차계약서");
    expect(enText).toContain("not a residential lease");
    expect(en.title).toBe("Accommodation Agreement");
  });

  it("omits the special-terms section when none are given", () => {
    const without = buildContract(fixtureBooking, fixtureForm, ISSUER, "ko");
    expect(without.sections.some((s) => s.heading === "특약사항")).toBe(false);

    const withTerms = buildContract(
      fixtureBooking,
      { ...fixtureForm, specialTerms: "퇴실 시 열쇠 반납" },
      ISSUER,
      "ko",
    );
    const section = withTerms.sections.find((s) => s.heading === "특약사항");
    expect(section?.paragraphs).toEqual(["퇴실 시 열쇠 반납"]);
  });

  it("reports the home address as missing when blank", () => {
    const model = buildContract(
      fixtureBooking,
      { ...fixtureForm, homeAddress: "" },
      ISSUER,
      "ko",
    );
    expect(model.missingFields).toContain("본국 주소");
  });
});

describe("buildDocument", () => {
  it("dispatches on document type", () => {
    expect(buildDocument("letter", fixtureBooking, fixtureForm, ISSUER, "ko").type)
      .toBe("letter");
    expect(buildDocument("contract", fixtureBooking, fixtureForm, ISSUER, "ko").type)
      .toBe("contract");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run lib/documents/build.test.ts`
Expected: FAIL — `buildContract is not exported by "./build"`.

- [ ] **Step 3: Implement the contract builder**

Append to `lib/documents/build.ts`. At the top of the file add `import { DEPOSIT_USD, formatUSD } from "@/lib/pricing";` and extend the existing type import to `import type { DocumentField, DocumentLang, DocumentModel, DocumentSection, DocumentType, GuestDocumentForm } from "./types";`. (`formatUSD` renders whole dollars — `formatUSD(70)` is `"$70"`.)

```ts
const CONTRACT_TEXT = {
  ko: {
    title: "숙소 이용 계약서",
    partiesHeading: "계약 당사자",
    stayHeading: "이용 객실 및 기간",
    priceHeading: "이용 요금",
    rulesHeading: "이용 규칙",
    specialHeading: "특약사항",
    provider: "제공자(상호)",
    registrationNumber: "사업자등록번호",
    representative: "대표자",
    providerAddress: "숙소 주소",
    phone: "연락처",
    guestName: "이용자 성명",
    nationality: "국적",
    passportNumber: "여권번호",
    homeAddress: "본국 주소",
    room: "객실",
    period: "이용 기간",
    total: "이용 요금 총액",
    deposit: "보증금",
    bedding: "침구 세트",
    beddingIncluded: "포함 (선결제)",
    beddingExcluded: "미포함",
    issueDate: "작성일",
    guestRole: "이용자",
  },
  en: {
    title: "Accommodation Agreement",
    partiesHeading: "Parties",
    stayHeading: "Room and period",
    priceHeading: "Fees",
    rulesHeading: "House rules",
    specialHeading: "Special terms",
    provider: "Provider",
    registrationNumber: "Business registration no.",
    representative: "Representative",
    providerAddress: "Address",
    phone: "Contact",
    guestName: "Guest name",
    nationality: "Nationality",
    passportNumber: "Passport number",
    homeAddress: "Home address",
    room: "Room",
    period: "Period of use",
    total: "Total fee",
    deposit: "Refundable deposit",
    bedding: "Bedding set",
    beddingIncluded: "Included (prepaid)",
    beddingExcluded: "Not included",
    issueDate: "Date of agreement",
    guestRole: "Guest",
  },
} as const;

const CONTRACT_RULES = {
  ko: [
    "이용자는 계약된 객실만 사용하며, 사전 협의 없이 제3자를 숙박시킬 수 없습니다.",
    "객실 내 취사 및 흡연은 금지되며, 공용 주방과 세탁실은 안내된 이용 시간에 따릅니다.",
    "이용자의 고의 또는 과실로 시설이 손상된 경우 보증금에서 수리비를 공제할 수 있으며, 손상이 없는 경우 퇴실 후 보증금 전액을 환불합니다.",
    "본 계약은 숙박시설 이용에 관한 계약으로, 주택임대차보호법상의 주택 임대차계약이 아닙니다.",
  ],
  en: [
    "The guest may use only the room stated above and may not host additional occupants without prior agreement.",
    "Cooking and smoking inside the room are prohibited; the shared kitchen and laundry are used according to the posted hours.",
    "Repair costs for damage caused intentionally or negligently by the guest may be deducted from the deposit; the full deposit is refunded after check-out if there is no damage.",
    "This agreement covers the use of accommodation facilities and is not a residential lease under the Korean Housing Lease Protection Act.",
  ],
} as const;

export function buildContract(
  booking: BookingRequestWithRoom,
  form: GuestDocumentForm,
  issuer: Issuer,
  lang: DocumentLang,
): DocumentModel {
  const t = CONTRACT_TEXT[lang];
  const missing = missingGuestFields(form, lang);
  if (!form.homeAddress.trim()) missing.push(t.homeAddress);

  // Explicitly typed: without the annotation TypeScript infers `never[]` for
  // the empty `paragraphs`/`fields` arrays and rejects the push below.
  const sections: DocumentSection[] = [
    {
      heading: t.partiesHeading,
      fields: [
        { label: t.provider, value: shown(issuerName(issuer, lang)) },
        { label: t.registrationNumber, value: shown(issuer.registrationNumber) },
        { label: t.representative, value: shown(issuerRepresentative(issuer, lang)) },
        { label: t.providerAddress, value: shown(issuerAddress(issuer, lang)) },
        { label: t.phone, value: shown(issuer.phone) },
        { label: t.guestName, value: shown(booking.guest_name) },
        { label: t.nationality, value: shown(form.nationality) },
        { label: t.passportNumber, value: shown(form.passportNumber) },
        { label: t.homeAddress, value: shown(form.homeAddress) },
      ],
      paragraphs: [],
    },
    {
      heading: t.stayHeading,
      fields: [
        { label: t.room, value: shown(roomLabel(booking, lang)) },
        { label: t.period, value: stayPeriod(booking, lang) },
      ],
      paragraphs: [],
    },
    {
      heading: t.priceHeading,
      fields: [
        { label: t.total, value: formatUSD(booking.estimated_total) },
        { label: t.deposit, value: formatUSD(DEPOSIT_USD) },
        {
          label: t.bedding,
          value: booking.bedding_prepaid
            ? t.beddingIncluded
            : t.beddingExcluded,
        },
      ],
      paragraphs: [],
    },
    {
      heading: t.rulesHeading,
      fields: [],
      paragraphs: [...CONTRACT_RULES[lang]],
    },
  ];

  if (form.specialTerms.trim()) {
    sections.push({
      heading: t.specialHeading,
      fields: [],
      paragraphs: [form.specialTerms.trim()],
    });
  }

  return {
    type: "contract",
    lang,
    title: t.title,
    subtitle: issuerName(issuer, lang),
    sections,
    statement:
      lang === "ko"
        ? [
            "제공자와 이용자는 위 내용에 합의하여 본 계약을 체결하고, 아래에 서명(날인)합니다.",
          ]
        : [
            "The provider and the guest agree to the terms above and sign below.",
          ],
    issueDateLine: `${t.issueDate}: ${formatDocumentDate(form.issueDate, lang)}`,
    signatures: [
      {
        role: CONTRACT_TEXT[lang].representative,
        name: issuerRepresentative(issuer, lang),
        showStamp: true,
      },
      { role: t.guestRole, name: booking.guest_name, showStamp: false },
    ],
    missingFields: missing,
  };
}

export function buildDocument(
  type: DocumentType,
  booking: BookingRequestWithRoom,
  form: GuestDocumentForm,
  issuer: Issuer,
  lang: DocumentLang,
): DocumentModel {
  return type === "letter"
    ? buildLetter(booking, form, issuer, lang)
    : buildContract(booking, form, issuer, lang);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run lib/documents/build.test.ts`
Expected: PASS — 12 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/documents/build.ts lib/documents/build.test.ts
git commit -m "feat(documents): accommodation agreement builder"
```

---

### Task 3: Document → email HTML and text renderer

**Files:**
- Create: `lib/documents/email-html.ts`
- Modify: `lib/email-html.ts` (export `escapeHtml`)
- Test: `lib/documents/email-html.test.ts`

**Interfaces:**
- Consumes: `DocumentModel` (Task 1); `wrapEmailHtml` and `escapeHtml` from `@/lib/email-html`.
- Produces:
  - `function documentEmailSubject(model: DocumentModel): string`
  - `function renderDocumentEmailHtml(model: DocumentModel): string` (full wrapped email HTML)
  - `function renderDocumentText(model: DocumentModel): string` (plain-text fallback)

- [ ] **Step 1: Export `escapeHtml` from the shared email module**

In `lib/email-html.ts`, change the declaration (currently around line 92):

```ts
function escapeHtml(s: string): string {
```

to:

```ts
export function escapeHtml(s: string): string {
```

- [ ] **Step 2: Write the failing tests**

Create `lib/documents/email-html.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  documentEmailSubject,
  renderDocumentEmailHtml,
  renderDocumentText,
} from "./email-html";
import type { DocumentModel } from "./types";

const model: DocumentModel = {
  type: "letter",
  lang: "ko",
  title: "체류(숙소) 확인서",
  subtitle: "스타고시원",
  sections: [
    {
      heading: "체류자 정보",
      fields: [
        { label: "성명", value: "Jane Traveler" },
        { label: "여권번호", value: "M12345678" },
      ],
      paragraphs: [],
    },
    {
      heading: "이용 규칙",
      fields: [],
      paragraphs: ["객실 내 흡연 <금지>"],
    },
  ],
  statement: ["위 사람은 실제로 체류하고 있음을 확인합니다."],
  issueDateLine: "발급일: 2026년 8월 4일",
  signatures: [{ role: "대표자", name: "홍길동", showStamp: true }],
  missingFields: [],
};

describe("documentEmailSubject", () => {
  it("combines the title and issuer", () => {
    expect(documentEmailSubject(model)).toBe("체류(숙소) 확인서 — 스타고시원");
  });
});

describe("renderDocumentEmailHtml", () => {
  it("renders the title, fields, paragraphs, and signature", () => {
    const html = renderDocumentEmailHtml(model);

    expect(html).toContain("체류(숙소) 확인서");
    expect(html).toContain("여권번호");
    expect(html).toContain("M12345678");
    expect(html).toContain("발급일: 2026년 8월 4일");
    expect(html).toContain("홍길동");
  });

  it("escapes HTML in document values", () => {
    const html = renderDocumentEmailHtml(model);
    expect(html).toContain("객실 내 흡연 &lt;금지&gt;");
    expect(html).not.toContain("<금지>");
  });

  it("includes a save-as-PDF hint in the document language", () => {
    expect(renderDocumentEmailHtml(model)).toContain("PDF로 저장");
    expect(renderDocumentEmailHtml({ ...model, lang: "en" })).toContain(
      "Save as PDF",
    );
  });

  it("never leaks the missing-field warning into the email", () => {
    const html = renderDocumentEmailHtml({
      ...model,
      missingFields: ["여권번호"],
    });
    expect(html).not.toContain("필수 정보 누락");
  });
});

describe("renderDocumentText", () => {
  it("renders a readable plain-text fallback", () => {
    const text = renderDocumentText(model);

    expect(text).toContain("체류(숙소) 확인서");
    expect(text).toContain("성명: Jane Traveler");
    expect(text).toContain("여권번호: M12345678");
    expect(text).toContain("발급일: 2026년 8월 4일");
    expect(text).not.toContain("<");
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm exec vitest run lib/documents/email-html.test.ts`
Expected: FAIL — `Failed to resolve import "./email-html"`.

- [ ] **Step 4: Implement the renderer**

Create `lib/documents/email-html.ts`:

```ts
import { escapeHtml, wrapEmailHtml } from "@/lib/email-html";
import type { DocumentModel } from "./types";

const PDF_HINT = {
  ko: "이 이메일을 브라우저에서 열고 인쇄(Ctrl/Cmd + P)를 누른 뒤 'PDF로 저장'을 선택하시면 문서를 PDF 파일로 보관하실 수 있습니다.",
  en: "To keep a PDF copy, open this email in a browser, press Print (Ctrl/Cmd + P), and choose 'Save as PDF'.",
} as const;

export function documentEmailSubject(model: DocumentModel): string {
  return `${model.title} — ${model.subtitle}`;
}

export function renderDocumentEmailHtml(model: DocumentModel): string {
  const parts: string[] = [];

  parts.push(
    `<h1 style="margin: 8px 0 4px; font-size: 22px; font-weight: 700; text-align: center;">${escapeHtml(model.title)}</h1>`,
    `<p style="margin: 0 0 24px; font-size: 13px; color: #6b7280; text-align: center;">${escapeHtml(model.subtitle)}</p>`,
  );

  for (const section of model.sections) {
    parts.push(
      `<h2 style="margin: 20px 0 8px; font-size: 14px; font-weight: 700; color: #0b1f4d; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">${escapeHtml(section.heading)}</h2>`,
    );
    if (section.fields.length > 0) {
      const rows = section.fields
        .map(
          (field) =>
            `<tr><td style="padding: 4px 12px 4px 0; font-size: 13px; color: #6b7280; white-space: nowrap; vertical-align: top;">${escapeHtml(field.label)}</td>` +
            `<td style="padding: 4px 0; font-size: 14px; color: #1f2937;">${escapeHtml(field.value)}</td></tr>`,
        )
        .join("");
      parts.push(
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">${rows}</table>`,
      );
    }
    for (const paragraph of section.paragraphs) {
      parts.push(
        `<p style="margin: 0 0 8px; font-size: 14px; line-height: 1.55;">${escapeHtml(paragraph)}</p>`,
      );
    }
  }

  for (const paragraph of model.statement) {
    parts.push(
      `<p style="margin: 20px 0 0; font-size: 14px; line-height: 1.7;">${escapeHtml(paragraph)}</p>`,
    );
  }

  parts.push(
    `<p style="margin: 24px 0 4px; font-size: 14px; text-align: center;">${escapeHtml(model.issueDateLine)}</p>`,
  );

  for (const signature of model.signatures) {
    parts.push(
      `<p style="margin: 8px 0 0; font-size: 14px; text-align: right;">${escapeHtml(signature.role)}: ${escapeHtml(signature.name)} ${escapeHtml(model.lang === "ko" ? "(서명 또는 인)" : "(signature)")}</p>`,
    );
  }

  parts.push(
    `<p style="margin: 28px 0 0; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; line-height: 1.6;">${escapeHtml(PDF_HINT[model.lang])}</p>`,
  );

  return wrapEmailHtml(parts.join("\n"), { preheader: model.title });
}

export function renderDocumentText(model: DocumentModel): string {
  const lines: string[] = [model.title, model.subtitle, ""];

  for (const section of model.sections) {
    lines.push(`[${section.heading}]`);
    for (const field of section.fields) {
      lines.push(`${field.label}: ${field.value}`);
    }
    for (const paragraph of section.paragraphs) {
      lines.push(`- ${paragraph}`);
    }
    lines.push("");
  }

  for (const paragraph of model.statement) {
    lines.push(paragraph, "");
  }

  lines.push(model.issueDateLine);
  for (const signature of model.signatures) {
    lines.push(`${signature.role}: ${signature.name}`);
  }
  lines.push("", PDF_HINT[model.lang]);

  return lines.join("\n");
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm exec vitest run lib/documents/email-html.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 6: Run the whole unit suite (nothing else broke from exporting `escapeHtml`)**

Run: `pnpm test`
Expected: PASS — all existing tests plus the new ones.

- [ ] **Step 7: Commit**

```bash
git add lib/email-html.ts lib/documents/email-html.ts lib/documents/email-html.test.ts
git commit -m "feat(documents): render document models as email HTML and text"
```

---

### Task 4: Document renderer component + admin card with live preview

**Files:**
- Create: `components/documents/document-view.tsx`
- Create: `components/admin/documents-card.tsx`
- Modify: `app/admin/requests/[id]/page.tsx`

**Interfaces:**
- Consumes: `buildDocument` (Task 2), `ISSUER`, `EMPTY_DOCUMENT_FORM`, `GuestDocumentForm`, `DocumentModel`, `DocumentType`, `DocumentLang`.
- Produces:
  - `function DocumentView({ model }: { model: DocumentModel }): JSX.Element`
  - `function DocumentsCard({ request }: { request: BookingRequestWithRoom }): JSX.Element`
  - `function documentDraftKey(requestId: string): string` (exported from `components/admin/documents-card.tsx`, reused by the print client in Task 5)
  - sessionStorage draft shape: the raw `GuestDocumentForm` JSON.

- [ ] **Step 1: Write the shared document renderer**

Create `components/documents/document-view.tsx`:

```tsx
import type { DocumentModel } from "@/lib/documents/types";

/**
 * Presentational renderer for a built document model. Used by the admin
 * preview and by the chrome-free print page, so it must stay free of hooks,
 * data fetching, and anything browser-only.
 */
export function DocumentView({ model }: { model: DocumentModel }) {
  return (
    <article className="bg-white text-gray-900 mx-auto w-full max-w-[210mm] px-10 py-12 print:px-0 print:py-0">
      <header className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-wide">{model.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{model.subtitle}</p>
      </header>

      {model.sections.map((section) => (
        <section key={section.heading} className="mb-6 break-inside-avoid">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2">
            {section.heading}
          </h2>
          {section.fields.length > 0 && (
            <dl className="grid grid-cols-[10rem_1fr] gap-y-1 text-sm">
              {section.fields.map((field) => (
                <div key={field.label} className="contents">
                  <dt className="text-gray-500">{field.label}</dt>
                  <dd className="text-gray-900">{field.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {section.paragraphs.map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed mt-1">
              {section.fields.length > 0 ? paragraph : `${i + 1}. ${paragraph}`}
            </p>
          ))}
        </section>
      ))}

      {model.statement.map((paragraph, i) => (
        <p key={i} className="text-sm leading-7 mt-4">
          {paragraph}
        </p>
      ))}

      <p className="text-center text-sm mt-10">{model.issueDateLine}</p>

      <div className="mt-6 space-y-4">
        {model.signatures.map((signature) => (
          <div
            key={signature.role}
            className="flex items-center justify-end gap-3 text-sm"
          >
            <span className="text-gray-500">{signature.role}</span>
            <span className="font-medium">{signature.name}</span>
            <span className="text-gray-400">
              {model.lang === "ko" ? "(서명 또는 인)" : "(signature)"}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Write the admin documents card**

Create `components/admin/documents-card.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { DocumentView } from "@/components/documents/document-view";
import { buildDocument } from "@/lib/documents/build";
import { ISSUER } from "@/lib/documents/issuer";
import {
  EMPTY_DOCUMENT_FORM,
  type DocumentLang,
  type DocumentType,
  type GuestDocumentForm,
} from "@/lib/documents/types";
import type { BookingRequestWithRoom } from "@/lib/types";

type SendState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success" }
  | { kind: "error"; message: string };

/** sessionStorage key holding the ephemeral guest legal fields for one booking. */
export function documentDraftKey(requestId: string) {
  return `goshiwon:document-draft:${requestId}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function DocumentsCard({ request }: { request: BookingRequestWithRoom }) {
  const [type, setType] = useState<DocumentType>("letter");
  const [lang, setLang] = useState<DocumentLang>("ko");
  const [form, setForm] = useState<GuestDocumentForm>({
    ...EMPTY_DOCUMENT_FORM,
    issueDate: todayIso(),
  });
  const [send, setSend] = useState<SendState>({ kind: "idle" });

  // Restore any draft typed earlier in this browser session.
  useEffect(() => {
    const raw = window.sessionStorage.getItem(documentDraftKey(request.id));
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as Partial<GuestDocumentForm>;
      setForm((prev) => ({ ...prev, ...saved }));
    } catch {
      // Corrupt draft — ignore and keep the empty form.
    }
  }, [request.id]);

  // Mirror the draft so the print route (a separate tab) can read it.
  useEffect(() => {
    window.sessionStorage.setItem(
      documentDraftKey(request.id),
      JSON.stringify(form),
    );
  }, [form, request.id]);

  const model = useMemo(
    () => buildDocument(type, request, form, ISSUER, lang),
    [type, request, form, lang],
  );

  function update(patch: Partial<GuestDocumentForm>) {
    setForm((prev) => ({ ...prev, ...patch }));
    setSend({ kind: "idle" });
  }

  function openPrintView() {
    window.open(
      `/admin/requests/${request.id}/documents/print?type=${type}&lang=${lang}`,
      "_blank",
      "noopener",
    );
  }

  async function handleSend() {
    setSend({ kind: "sending" });
    try {
      const res = await fetch(
        `/api/admin/requests/${request.id}/send-document`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, lang, form }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSend({ kind: "error", message: body?.error || `HTTP ${res.status}` });
        return;
      }
      setSend({ kind: "success" });
    } catch (err) {
      setSend({ kind: "error", message: (err as Error).message });
    }
  }

  const toggleBase =
    "px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50";
  const inputClass =
    "block w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">문서 발급</h2>

      <div className="flex flex-wrap gap-3">
        <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            type="button"
            onClick={() => setType("letter")}
            className={`${toggleBase} ${type === "letter" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            체류 확인서
          </button>
          <button
            type="button"
            onClick={() => setType("contract")}
            className={`${toggleBase} border-l border-gray-300 ${type === "contract" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            이용 계약서
          </button>
        </div>

        <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            type="button"
            onClick={() => setLang("ko")}
            className={`${toggleBase} ${lang === "ko" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            한국어
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`${toggleBase} border-l border-gray-300 ${lang === "en" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            English
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        아래 정보는 저장되지 않습니다. 문서 발급에만 사용되며 브라우저를 닫으면
        사라집니다.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="doc-passport"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            여권번호
          </label>
          <input
            id="doc-passport"
            type="text"
            value={form.passportNumber}
            onChange={(e) => update({ passportNumber: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="doc-nationality"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            국적
          </label>
          <input
            id="doc-nationality"
            type="text"
            value={form.nationality}
            onChange={(e) => update({ nationality: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="doc-dob"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            생년월일
          </label>
          <input
            id="doc-dob"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => update({ dateOfBirth: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="doc-issue-date"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            발급일
          </label>
          <input
            id="doc-issue-date"
            type="date"
            value={form.issueDate}
            onChange={(e) => update({ issueDate: e.target.value })}
            className={inputClass}
          />
        </div>
        {type === "contract" && (
          <>
            <div className="sm:col-span-2">
              <label
                htmlFor="doc-home-address"
                className="block text-xs font-bold text-gray-700 uppercase mb-1"
              >
                본국 주소
              </label>
              <input
                id="doc-home-address"
                type="text"
                value={form.homeAddress}
                onChange={(e) => update({ homeAddress: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="doc-special-terms"
                className="block text-xs font-bold text-gray-700 uppercase mb-1"
              >
                특약사항
              </label>
              <textarea
                id="doc-special-terms"
                rows={3}
                value={form.specialTerms}
                onChange={(e) => update({ specialTerms: e.target.value })}
                className={inputClass}
              />
            </div>
          </>
        )}
      </div>

      {model.missingFields.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          필수 정보 누락: {model.missingFields.join(", ")}
        </div>
      )}

      <div>
        <div className="text-xs font-bold text-gray-700 uppercase mb-1">
          미리보기
        </div>
        <div className="border border-gray-200 rounded-lg bg-gray-50 max-h-[420px] overflow-y-auto">
          <div className="origin-top scale-[0.72] w-[139%]">
            <DocumentView model={model} />
          </div>
        </div>
      </div>

      {send.kind === "success" && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          문서를 {request.guest_email}로 발송했습니다. 아래 이메일 기록에서
          확인할 수 있습니다.
        </div>
      )}
      {send.kind === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          발송 실패: {send.message}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={openPrintView}
          className="w-full px-4 py-2 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
        >
          인쇄 / PDF 저장
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={send.kind === "sending"}
          className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {send.kind === "sending" ? "발송 중..." : "게스트에게 발송"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Render the card on the request detail page**

In `app/admin/requests/[id]/page.tsx`, add the import next to the other admin component imports (after line 12):

```tsx
import { DocumentsCard } from "@/components/admin/documents-card";
```

and add the card to the actions sidebar, after the `<RequestActions .../>` element (line 267):

```tsx
          <DocumentsCard request={request} />
```

- [ ] **Step 4: Verify the build compiles**

Run: `pnpm run build`
Expected: PASS — "Compiled successfully". No type errors from the new files.

- [ ] **Step 5: Verify the card by hand**

Run: `pnpm dev`, open `http://localhost:3000/admin/requests/<any-request-id>`, log in if prompted.
Expected: a 문서 발급 card in the right sidebar. Typing a passport number updates the preview immediately; the 필수 정보 누락 warning lists 여권번호/국적/생년월일 while blank and disappears once filled; toggling 이용 계약서 reveals the 본국 주소 and 특약사항 inputs; toggling English re-renders the preview in English. Reloading the page restores what you typed.

- [ ] **Step 6: Commit**

```bash
git add components/documents/document-view.tsx components/admin/documents-card.tsx app/admin/requests/\[id\]/page.tsx
git commit -m "feat(documents): admin document card with live preview"
```

---

### Task 5: Chrome-free print route

**Files:**
- Create: `app/admin/requests/[id]/documents/print/page.tsx`
- Create: `components/admin/document-print-client.tsx`
- Modify: `app/admin/layout.tsx` (hide admin chrome at print time)

**Interfaces:**
- Consumes: `getBookingRequestById` from `@/lib/queries`; `DocumentView` (Task 4); `documentDraftKey` from `@/components/admin/documents-card`; `buildDocument`, `ISSUER`, `EMPTY_DOCUMENT_FORM`.
- Produces: `function DocumentPrintClient({ request, type, lang }: { request: BookingRequestWithRoom; type: DocumentType; lang: DocumentLang }): JSX.Element`
- Route: `GET /admin/requests/:id/documents/print?type=letter|contract&lang=ko|en`. Guest legal fields come from `sessionStorage`, never from the query string.

- [ ] **Step 1: Write the print client component**

Create `components/admin/document-print-client.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { DocumentView } from "@/components/documents/document-view";
import { documentDraftKey } from "@/components/admin/documents-card";
import { buildDocument } from "@/lib/documents/build";
import { ISSUER } from "@/lib/documents/issuer";
import {
  EMPTY_DOCUMENT_FORM,
  type DocumentLang,
  type DocumentType,
  type GuestDocumentForm,
} from "@/lib/documents/types";
import type { BookingRequestWithRoom } from "@/lib/types";

interface Props {
  request: BookingRequestWithRoom;
  type: DocumentType;
  lang: DocumentLang;
}

export function DocumentPrintClient({ request, type, lang }: Props) {
  // The form lives in sessionStorage so passport data never travels in a URL.
  // Opened directly (no draft), the document still renders with blanks.
  const [form, setForm] = useState<GuestDocumentForm | null>(null);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(documentDraftKey(request.id));
    if (!raw) {
      setForm({ ...EMPTY_DOCUMENT_FORM });
      return;
    }
    try {
      setForm({
        ...EMPTY_DOCUMENT_FORM,
        ...(JSON.parse(raw) as Partial<GuestDocumentForm>),
      });
    } catch {
      setForm({ ...EMPTY_DOCUMENT_FORM });
    }
  }, [request.id]);

  // Open the print dialog once the document is on screen.
  useEffect(() => {
    if (!form) return;
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, [form]);

  if (!form) return null;

  const model = buildDocument(type, request, form, ISSUER, lang);

  return (
    <>
      {model.missingFields.length > 0 && (
        <div className="print:hidden mx-auto w-full max-w-[210mm] mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          필수 정보 누락: {model.missingFields.join(", ")} — 요청 상세 페이지의
          문서 발급 카드에서 입력한 뒤 다시 열어 주세요.
        </div>
      )}
      <div className="print:hidden mx-auto w-full max-w-[210mm] mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          인쇄 / PDF 저장
        </button>
      </div>
      <DocumentView model={model} />
    </>
  );
}
```

- [ ] **Step 2: Write the print page**

Create `app/admin/requests/[id]/documents/print/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getBookingRequestById } from "@/lib/queries";
import { DocumentPrintClient } from "@/components/admin/document-print-client";
import type { DocumentLang, DocumentType } from "@/lib/documents/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string; lang?: string }>;
}

export default async function DocumentPrintPage({
  params,
  searchParams,
}: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const request = await getBookingRequestById(id);
  if (!request) notFound();

  const type: DocumentType = query.type === "contract" ? "contract" : "letter";
  const lang: DocumentLang = query.lang === "en" ? "en" : "ko";

  return (
    <main className="bg-white min-h-screen p-8 print:p-0">
      <style>{`@page { size: A4; margin: 18mm; } @media print { body { background: #fff; } }`}</style>
      <DocumentPrintClient request={request} type={type} lang={lang} />
    </main>
  );
}
```

- [ ] **Step 3: Keep the admin chrome off the print page**

`app/admin/layout.tsx` wraps every admin page in `<AdminNav />` plus a padded container. Hide that chrome at print time — do not remove it, and do not move the route out of `/admin`, since the middleware matcher `"/admin/:path*"` must keep guarding this page.

Replace the body of `app/admin/layout.tsx` with:

```tsx
import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 print:bg-white">
      <div className="print:hidden">
        <AdminNav />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-[15px] sm:py-10 sm:text-base [&_button]:text-[15px] [&_input]:text-[15px] [&_select]:text-[15px] [&_textarea]:text-[15px] print:max-w-none print:p-0">
        {children}
      </div>
    </div>
  );
}
```

Run: `pnpm run build`
Expected: PASS.

- [ ] **Step 4: Verify the print view by hand**

With `pnpm dev` running: open a request detail page, fill the passport/nationality/DOB fields, click 인쇄 / PDF 저장.
Expected: a new tab shows only the document (no admin nav), the browser print dialog opens on its own, and the print preview shows one A4 page with the guest data, room, dates, and 사업자등록번호 — no admin chrome, no warning bar, no 인쇄 button in the printed output. Repeat for 이용 계약서 and for English. Then open the print URL directly in a fresh tab (no draft): the document renders with `—` blanks and the 필수 정보 누락 warning on screen only.

- [ ] **Step 5: Commit**

```bash
git add app/admin/requests/\[id\]/documents components/admin/document-print-client.tsx app/admin/layout.tsx
git commit -m "feat(documents): chrome-free print route for save-as-PDF"
```

---

### Task 6: Send API

**Files:**
- Create: `lib/documents/send.ts`
- Create: `app/api/admin/requests/[id]/send-document/route.ts`

**Interfaces:**
- Consumes: `getBookingRequestById`, `createEmailSend` from `@/lib/queries`; `sendEmail` from `@/lib/email`; `buildDocument`, `ISSUER`, `documentEmailSubject`, `renderDocumentEmailHtml`, `renderDocumentText`; `getAdminUserOrNull` from `@/lib/supabase-server`.
- Produces:
  - `interface SendDocumentInput { requestId: string; type: DocumentType; lang: DocumentLang; form: GuestDocumentForm; sentByEmail: string }`
  - `type SendDocumentResult = { status: "sent"; emailSendId: string; to: string } | { status: "not_found" } | { status: "send_failed"; error: string }`
  - `async function sendDocumentEmail(input: SendDocumentInput): Promise<SendDocumentResult>`
- HTTP contract for `POST /api/admin/requests/:id/send-document`: body `{ type, lang, form }` → `200 {ok:true}` | `400 {error:"invalid_body"}` | `401 {error:"unauthorized"}` | `404 {error:"not_found"}` | `500 {error:"send_failed"}`.

- [ ] **Step 1: Write the shared send helper**

Create `lib/documents/send.ts`:

```ts
import { sendEmail } from "@/lib/email";
import { createEmailSend, getBookingRequestById } from "@/lib/queries";
import { buildDocument } from "./build";
import {
  documentEmailSubject,
  renderDocumentEmailHtml,
  renderDocumentText,
} from "./email-html";
import { ISSUER } from "./issuer";
import type { DocumentLang, DocumentType, GuestDocumentForm } from "./types";

export interface SendDocumentInput {
  requestId: string;
  type: DocumentType;
  lang: DocumentLang;
  /** Ephemeral guest legal fields — arrive in the request body and are never persisted as columns. */
  form: GuestDocumentForm;
  sentByEmail: string;
}

export type SendDocumentResult =
  | { status: "sent"; emailSendId: string; to: string }
  | { status: "not_found" }
  | { status: "send_failed"; error: string };

/**
 * Builds the document, emails it to the guest, and records the audit row.
 * Shared by the admin route and the E2E fixture route so both exercise the
 * same path. Guest legal fields are never logged.
 */
export async function sendDocumentEmail(
  input: SendDocumentInput,
): Promise<SendDocumentResult> {
  const request = await getBookingRequestById(input.requestId);
  if (!request) return { status: "not_found" };

  const model = buildDocument(
    input.type,
    request,
    input.form,
    ISSUER,
    input.lang,
  );
  const subject = documentEmailSubject(model);
  const html = renderDocumentEmailHtml(model);
  const text = renderDocumentText(model);

  let sendError: string | null = null;
  try {
    await sendEmail(request.guest_email, subject, text, html);
  } catch (err) {
    sendError = err instanceof Error ? err.message : "send_failed";
    console.error("send-document failed:", sendError);
  }

  let emailSendId = "";
  try {
    const row = await createEmailSend({
      booking_request_id: request.id,
      kind: "document",
      template_slug: `document_${input.type}`,
      template_locale: input.lang,
      subject,
      body_text: text,
      body_html: html,
      sent_by_email: input.sentByEmail,
      sent_to_email: request.guest_email,
      send_status: sendError ? "failed" : "sent",
      send_error: sendError ?? "",
    });
    emailSendId = row.id;
  } catch (err) {
    console.error("send-document audit insert failed:", err);
  }

  if (sendError) return { status: "send_failed", error: sendError };
  return { status: "sent", emailSendId, to: request.guest_email };
}
```

- [ ] **Step 2: Write the admin route**

Create `app/api/admin/requests/[id]/send-document/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendDocumentEmail } from "@/lib/documents/send";
import { getAdminUserOrNull } from "@/lib/supabase-server";

export const runtime = "nodejs";

const formSchema = z.object({
  passportNumber: z.string().trim().max(64).default(""),
  nationality: z.string().trim().max(120).default(""),
  dateOfBirth: z.string().trim().max(32).default(""),
  homeAddress: z.string().trim().max(300).default(""),
  specialTerms: z.string().trim().max(2000).default(""),
  issueDate: z.string().trim().max(32).default(""),
});

const bodySchema = z.object({
  type: z.enum(["letter", "contract"]),
  lang: z.enum(["ko", "en"]),
  form: formSchema,
});

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: Context) {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch (err) {
    // Deliberately no details: the body carries guest passport data.
    console.error("send-document invalid body:", (err as Error).name);
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await sendDocumentEmail({
    requestId: id,
    type: parsed.type,
    lang: parsed.lang,
    form: parsed.form,
    sentByEmail: adminUser.email ?? "",
  });

  if (result.status === "not_found") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (result.status === "send_failed") {
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Confirm the admin-user helper name**

Run: `grep -n "getAdminUserOrNull" lib/supabase-server.ts`
Expected: the export exists (it is what `app/api/admin/requests/[id]/send-email/route.ts` already uses). If the grep returns nothing, use whatever that route imports instead.

- [ ] **Step 4: Verify the build compiles**

Run: `pnpm run build`
Expected: PASS.

- [ ] **Step 5: Verify a real send by hand**

With `pnpm dev` running and `DEV_EMAIL_OVERRIDE` set in `.env.development`: open a request detail page, fill the form, click 게스트에게 발송.
Expected: the green "문서를 …로 발송했습니다" banner appears; the dev mailbox receives a `[DEV → guest@…] 체류(숙소) 확인서 — …` email whose body shows the document; reloading the page shows a new row in 이메일 기록.

- [ ] **Step 6: Commit**

```bash
git add lib/documents/send.ts app/api/admin/requests/\[id\]/send-document
git commit -m "feat(documents): send-document admin API with email audit row"
```

---

### Task 7: E2E coverage for the send path

**Files:**
- Create: `app/api/test/document-fixture/route.ts`
- Create: `e2e/documents.spec.ts`

**Interfaces:**
- Consumes: `sendDocumentEmail` (Task 6); `createBookingRequest`, `getRoomBySlug` from `@/lib/queries`; `calculateEstimate`, `roomTier` from `@/lib/pricing`.
- Produces: `POST /api/test/document-fixture` with `{ action: "create-booking" }` → `{ id, guestEmail }`, and `{ action: "send", requestId, type, lang, form }` → `{ status, emailSendId, to }`. 404s unless `E2E_TEST_MODE === "true"`.

**Why a fixture route:** `/admin/*` is behind Supabase magic-link/Google auth, which Playwright cannot complete, so the spec's "admin opens the seeded booking in the UI" step is not reachable. This mirrors the existing precedent in `app/api/test/refund/route.ts`: the test drives the *real* `sendDocumentEmail` path, and the card/preview/print UI is covered by the manual checks in Tasks 4–5.

- [ ] **Step 1: Write the fixture route**

Create `app/api/test/document-fixture/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createBookingRequest, getRoomBySlug } from "@/lib/queries";
import { calculateEstimate, roomTier } from "@/lib/pricing";
import { sendDocumentEmail } from "@/lib/documents/send";
import { EMPTY_DOCUMENT_FORM } from "@/lib/documents/types";

export const dynamic = "force-dynamic";

// E2E-only shortcut. The admin route is middleware-guarded and Playwright
// cannot complete a Supabase magic-link login, so the test drives the same
// sendDocumentEmail() path directly. 404s outside the Playwright harness.
export async function POST(req: NextRequest) {
  if (process.env.E2E_TEST_MODE !== "true") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      requestId?: string;
      type?: "letter" | "contract";
      lang?: "ko" | "en";
      form?: Record<string, string>;
    };

    if (body.action === "create-booking") {
      const roomSlug = "room-with-private-shower";
      const room = await getRoomBySlug(roomSlug);
      if (!room) throw new Error(`Fixture room not found: ${roomSlug}`);

      const checkIn = "2026-06-01";
      const checkOut = "2026-07-01";
      const estimate = calculateEstimate(roomTier(room), checkIn, checkOut, {
        beddingPrepaid: true,
      });
      const guestEmail = `playwright-doc-${Date.now()}@example.com`;

      const booking = await createBookingRequest({
        guest_name: "Playwright Document Guest",
        guest_email: guestEmail,
        guest_count: 1,
        room_id: room.id,
        room_slug: roomSlug,
        check_in_date: checkIn,
        check_out_date: checkOut,
        estimated_total: estimate.total,
        bedding_prepaid: true,
        notes: "E2E document fixture",
        status: "confirmed",
        payment_status: "paid",
      });

      return NextResponse.json({ id: booking.id, guestEmail });
    }

    if (body.action === "send") {
      if (!body.requestId) {
        return NextResponse.json(
          { error: "requestId required" },
          { status: 400 },
        );
      }
      const result = await sendDocumentEmail({
        requestId: body.requestId,
        type: body.type ?? "letter",
        lang: body.lang ?? "ko",
        form: { ...EMPTY_DOCUMENT_FORM, ...(body.form ?? {}) },
        sentByEmail: "playwright-admin@example.com",
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "fixture_failed" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Write the failing e2e spec**

Create `e2e/documents.spec.ts`:

```ts
import { expect, test, type APIRequestContext } from "@playwright/test";

async function clearEmailOutbox(request: APIRequestContext) {
  const response = await request.delete("/api/test/email-outbox");
  expect(response.ok()).toBeTruthy();
}

async function findEmail(request: APIRequestContext, subject: string) {
  const response = await request.get("/api/test/email-outbox");
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as {
    emails: { to: string; subject: string; text: string; html: string }[];
  };
  const email = body.emails.find((item) => item.subject.includes(subject));
  expect(email).toBeTruthy();
  return email!;
}

async function createBooking(request: APIRequestContext) {
  const res = await request.post("/api/test/document-fixture", {
    data: { action: "create-booking" },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as { id: string; guestEmail: string };
}

async function sendDocument(
  request: APIRequestContext,
  data: Record<string, unknown>,
) {
  const res = await request.post("/api/test/document-fixture", {
    data: { action: "send", ...data },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as {
    status: string;
    emailSendId?: string;
    to?: string;
  };
}

const form = {
  passportNumber: "M99887766",
  nationality: "United States",
  dateOfBirth: "1995-03-14",
  homeAddress: "1 Main St, Springfield, USA",
  specialTerms: "",
  issueDate: "2026-08-04",
};

test("admin sends the Korean residence letter to the guest", async ({
  request,
}) => {
  await clearEmailOutbox(request);
  const booking = await createBooking(request);

  const result = await sendDocument(request, {
    requestId: booking.id,
    type: "letter",
    lang: "ko",
    form,
  });

  expect(result.status).toBe("sent");
  expect(result.emailSendId).toBeTruthy(); // audit row written
  expect(result.to).toBe(booking.guestEmail);

  const email = await findEmail(request, "체류(숙소) 확인서");
  expect(email.html).toContain("M99887766");
  expect(email.html).toContain("Playwright Document Guest");
  expect(email.html).toContain("2026년 6월 1일");
  expect(email.html).toContain("사업자등록번호");
  expect(email.html).toContain("PDF로 저장");
});

test("admin sends the English accommodation agreement", async ({ request }) => {
  await clearEmailOutbox(request);
  const booking = await createBooking(request);

  const result = await sendDocument(request, {
    requestId: booking.id,
    type: "contract",
    lang: "en",
    form: { ...form, specialTerms: "Key returned at check-out." },
  });
  expect(result.status).toBe("sent");

  const email = await findEmail(request, "Accommodation Agreement");
  expect(email.html).toContain("Key returned at check-out.");
  expect(email.html).toContain("not a residential lease");
  // The agreement must never be framed as a Korean residential lease.
  expect(email.html).not.toContain("임대차계약서");
});

test("sending a document for an unknown booking reports not_found", async ({
  request,
}) => {
  const result = await sendDocument(request, {
    requestId: "00000000-0000-0000-0000-000000000000",
    type: "letter",
    lang: "ko",
    form,
  });
  expect(result.status).toBe("not_found");
});
```

- [ ] **Step 3: Run the spec to verify it fails**

Run: `pnpm exec playwright test e2e/documents.spec.ts`
Expected: FAIL — the fixture route 404s or the outbox has no matching email, depending on which piece is missing.

(If it already passes because Steps 1–2 were done together, that is fine — confirm by temporarily renaming the expected subject to `NOPE` and re-running to see a real failure, then restore it.)

- [ ] **Step 4: Run the spec to verify it passes**

Run: `pnpm exec playwright test e2e/documents.spec.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Run the full e2e suite (no cross-test interference)**

Run: `pnpm run test:e2e`
Expected: PASS — the 9 existing tests plus the 3 new ones.

- [ ] **Step 6: Commit**

```bash
git add app/api/test/document-fixture e2e/documents.spec.ts
git commit -m "test(documents): e2e coverage for document send + audit row"
```

---

### Task 8: Full verification and spec close-out

**Files:**
- Modify: `plan/guest-residence-documents.md`

- [ ] **Step 1: Run the full verification pipeline**

Run: `pnpm run verify`
Expected: PASS — unit tests, production build, and e2e suite all green. Fix anything red before continuing; do not proceed with a failing step.

- [ ] **Step 2: Mark the spec implemented and record the owner's remaining items**

In `plan/guest-residence-documents.md`, change line 4 from:

```markdown
Status: approved design, pending implementation plan
```

to:

```markdown
Status: implemented (see plan/guest-residence-documents-implementation.md)
```

and append at the end of the file:

```markdown
## Post-implementation owner checklist

- [ ] Replace every `TODO(owner)` placeholder in `lib/documents/issuer.ts`
      (사업자등록번호, 대표자명, Korean business name and address) — documents
      issued before this is done carry fake registration details.
- [ ] Add the 직인 image to `/public/images/documents/` and set
      `ISSUER.stampImagePath`, or leave it `null` to sign by hand.
- [ ] Confirm with 출입국·외국인청 (or a 행정사) whether typical guests' visa
      types need the letter, the contract, or both.
- [ ] Check all four variants (letter/contract × KO/EN) through the browser
      print dialog's Save-as-PDF before issuing any document to a guest.
```

- [ ] **Step 3: Commit**

```bash
git add plan/guest-residence-documents.md
git commit -m "docs: mark residence documents spec implemented"
```

---

## Deviations from the spec (deliberate)

1. **E2E does not drive the admin UI.** The spec's e2e bullet assumes Playwright can open `/admin/requests/[id]`, but admin auth is Supabase magic-link/Google only and there is no password login — the existing `e2e/guest-review.spec.ts` documents the same limitation. Coverage is split: the send path runs end-to-end through the real `sendDocumentEmail()` via an `E2E_TEST_MODE` fixture route (the `app/api/test/refund/route.ts` precedent), and the card, preview, and print route are verified by the manual checks in Tasks 4 and 5.
2. **No unit test renders the React document components.** `tsconfig.json` sets `jsx: "preserve"`, which vitest cannot transform without config changes, and the repo has no component-test setup today. The tested seam is therefore the model (`build.test.ts`) and the email renderer (`email-html.test.ts`); `DocumentView` is thin presentation over an already-tested model.
