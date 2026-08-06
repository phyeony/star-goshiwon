# Immigration document alignment — research + plan

## Context

The guest residence documents feature shipped 2026-08-05 (`lib/documents/*`,
`/admin/requests/[id]` 문서 발급 card) with two documents: a 체류(숙소) 확인서
(letter) and a 숙소 이용 계약서 (contract). Before the owner fills in real
issuer details and starts handing these to guests, two questions need answering:

1. Do these documents actually match what 출입국·외국인청 accepts from a
   고시원 for 외국인등록 / 체류지 변경신고?
2. Does the contract's terms match `/policies` — the page guests actually agreed to?

Research says: **the letter is the right document but the submission is
incomplete**, and **the contract is consistent with the policy page but covers
maybe a quarter of it**.

## Finding 1 — immigration wants a three-part bundle from a 고시원

For a foreigner living in a 고시원, 출입국 asks for all three:

| # | Document | Who issues | We have it? |
| --- | --- | --- | --- |
| 1 | 「거주/숙소 제공 확인서」 원본 **또는** 「입실원서 / 입실계약서」 원본 — must state **거주 시작일 / 최초입실일** | the goshiwon | ✅ our letter + contract |
| 2 | 숙박시설의 **「사업자등록증」 사본** — its address **must match** the address on doc #1 | the goshiwon | ❌ nothing |
| 3 | 최근 1개월 이내 **「월세 영수증」 또는 계좌이체 내역** — must carry the 사업자등록증's 업체명 or 대표자명 | the goshiwon / bank | ❌ nothing |

Doc #3 is the one our guests structurally cannot produce: they pay **USD via
PayPal**, so no Korean 계좌이체 내역 will ever show 스타고시원. The accepted
substitute for hotel/Airbnb-type stays is **계약서 + 요금납부영수증 with the
address, stay period, and the foreigner's name printed on it** — i.e. a receipt
we issue.

## Finding 2 — the document names, and whether templates exist

- **거주(숙소)제공 확인서** — *Confirmation of Residence / Accommodation
  Provision*. The official form, downloadable from HiKorea's 민원서식 board.
  Universities and 구청 redistribute it, including a **영문병기 (KO/EN on one
  page)** version, which is the variant immigration officers see most.
- **입실원서 / 입실계약서** — the goshiwon's *own* move-in contract. Accepted in
  place of the 확인서 as long as it carries 최초입실일. **There is no national
  standard template** for it: 고시원 is a 다중생활시설 (제2종근린생활시설), not
  housing, so 주택임대차표준계약서 does not apply. Every operator uses its own.
- **기숙사입주확인서 / 입실확인서** — the dorm variant.
- **숙박료 영수증** — no standard form; free-form as long as it names the
  address, period, guest, and amount.

So: template exists for the *letter*, none for the *contract* — our own is fine
and is what the market does.

## Finding 3 — how other operators handle it

Korean goshiwon marketplaces (고시원넷 and peers) are listing sites only; the
individual 원장 hand-writes an 입실확인서 on request. Foreigner-facing operators
(share-house chains, relocation services) advertise "ARC support" and hand over
a **bundle**: their own contract + 사업자등록증 사본 + a payment receipt. That
bundle *is* the differentiator — issuing it proactively is what we'd be doing
better, not the letter itself.

## Finding 4 — contract vs. `/policies`: consistent, but ~25% covered

`CONTRACT_RULES` in `lib/documents/build.ts:298` is four bullets. `/policies`
(`app/policies/ko/page.tsx`, `app/policies/page.tsx`) is fifteen sections. Where
they overlap they agree; nothing contradicts. What the contract omits:

| Policy section | In contract? |
| --- | --- |
| §3 취소·환불 (30일+ 100% → 당일 0%; 입실 후 환불 불가; $15 침구비 환불 불가) | ❌ |
| §5 체크인 15:00 / 체크아웃 11:00 | ❌ (and immigration wants 최초입실일 explicit) |
| §6 보증금 — PayPal 환불, 퇴실 후 영업일 5일 내 개시, 미이행 체크아웃 시 전액 차감 | ⚠️ one vague line |
| §7 하우스 룰 — 정숙시간 23:00–06:00, **건물 전체** 금연 (contract says only 객실 내), 반려동물 불가, 분리수거, 안전시설 | ⚠️ 2 of 9 |
| §8 남성 전용 | ❌ |
| §9 개인 물품 책임 제한 | ❌ |
| §10 무단 객실 출입 사유 | ❌ |
| §11 계약 해지 사유 (3일 이상 미납 등) | ❌ |
| §12 미납 시 개인 물품 처리 | ❌ |
| §13 불가항력 | ❌ |
| Incorporation-by-reference clause ("본 약관은 계약의 일부를 구성한다" + URL + 버전일) | ❌ |

Two blockers unrelated to wording:

- `lib/documents/issuer.ts:24-26` still holds placeholders (`000-00-00000`,
  `홍길동`). A document bearing a fake 사업자등록번호 is worse than no document,
  and doc #2 above requires the address to match exactly.
- `app/policies/ko/page.tsx:373` tells guests to bring their passport **at
  check-in**, which contradicts the self-check-in reality (no front desk;
  passport/visa verified before arrival).

## Plan

### 1. Fill the issuer record — blocking everything else
`lib/documents/issuer.ts`: real 사업자등록번호, 대표자명, registered Korean
business name, and the exact Korean address **as printed on the 사업자등록증**.
Add the 직인 image at `/public/images/documents/`. Nothing below should ship
before this.

### 2. Add a third document: 숙박료 영수증 / Payment Receipt
Extend `DocumentType` in `lib/documents/types.ts` to `"receipt"`, add
`buildReceipt()` to `lib/documents/build.ts` alongside `buildLetter` /
`buildContract`, and register it in `buildDocument()` (`build.ts:405`) and in
`resolveDocument()` (`lib/documents/resolve.ts`) so it inherits templating,
preview, print, and send for free. Fields: 상호 / 사업자등록번호 / 대표자 /
주소, 이용자 성명, 객실, 이용 기간, 결제 금액 (객실료 · 침구비 · 보증금
breakdown from `booking.estimated_total` + `DEPOSIT_USD` via `formatUSD`),
결제수단 PayPal + capture id, 결제일, 발행일, 직인. Add a `receipt` slot pair to
the `document_templates` table's (type, lang) matrix and to
`/admin/document-templates`.

### 3. Make the letter immigration-shaped, and add a bilingual variant
In `LETTER_TEXT` / `buildLetter` (`build.ts:81-241`):
- Add **최초입실일 / Date of first entry** as its own labeled field, distinct
  from the 체류 기간 range. This is the field officers look for.
- Add an optional **외국인등록번호** input to `GuestDocumentForm`
  (`lib/documents/types.ts`) for guests who already have an ARC and are only
  filing a 체류지 변경신고.
- Add a footer line listing the required attachments (사업자등록증 사본,
  숙박료 영수증) so the guest knows the letter alone is not the submission.

**Bilingual (영문병기) variant.** Extend `DocumentLang` in
`lib/documents/types.ts` with a third value (`"bi"`), matching how the HiKorea
form is actually distributed: labels print as `성명 / Name`, values once. This
is the variant the admin should reach for by default when a guest is filing at
출입국. Mechanically it slots in wherever `lang` is already switched on —
`LETTER_TEXT`, `formatDocumentDate` (`build.ts:31`), `issuerName` /
`issuerAddress` / `issuerRepresentative`, `stayPeriod`, and `letterStatement`
(which prints the KO sentence then the EN one). Note the knock-on: the
`document_templates` (type, lang) matrix grows to 3 langs × 3 types = 9 slots in
`/admin/document-templates`. If that feels heavy, restrict `"bi"` to the letter
only — it is the only document immigration reads.

### 4. Align the contract with `/policies` — all 15 sections, 1–2 pages

Target: every policy section represented, **money and termination terms printed
near-verbatim**, everything else one line, closing with an incorporation clause.
The split is not stylistic — under 약관규제법 §3 (명시·설명의무) a 중요한 내용
that exists only behind a URL can be excluded from the contract (편입 배제) and
becomes unenforceable, so terms that cost the guest money or end the stay must
be on the paper they sign. And under §5② (작성자 불이익 원칙) any divergence
between summary and page is read against us, so the condensed wording must not
read softer *or* harder than `/policies`.

**Print in near-full** (the enforceable core):
- §3 취소·환불 — the full 5-row table (30일+ 100% / 15–29일 90% / 8–14일 70% /
  1–7일 50% / 당일·노쇼 0%), 입실 후 객실료 환불 불가, $15 침구비 환불 불가.
- §6 보증금 — $70, PayPal 환불, 퇴실 후 영업일 5일 내 개시, 공제 사유,
  미이행 체크아웃 시 전액 차감.
- §11 계약 해지 사유 — including 3일 이상 미납, and that 해지 시 환불 없음.
- §12 미납 시 개인 물품 처리 — 3일 후 폐기, 보상 청구 불가.

**One line each** (referenced, not argued):
§4 변경·연장, §5 체크인 15:00 / 체크아웃 11:00, §7 하우스 룰 (정숙시간
23:00–06:00, **건물 전체 금연** — replacing the narrower 객실 내 흡연 line at
`build.ts:301`, 반려동물 불가, 외부인 숙박 불가, 분리수거, 안전시설), §8 남성
전용, §9 책임 제한, §10 무단 출입 사유, §13 불가항력, §14 개인정보.

Keep the non-lease disclaimer at `build.ts:303` **verbatim** — it is the clause
holding the whole 주택임대차보호법 framing together.

**Closing clause:** names the policy URL and the **version date being
summarized** (policy §15 pins the version in force at booking), and states that
the full 약관 governs where the summary is silent. Restructure `CONTRACT_RULES`
from a flat string array into the labeled `DocumentSection[]` shape the builder
already uses (`build.ts:324`) so the printed contract has scannable headings
rather than a 20-bullet wall.

### 5. Fix the check-in passport line
`app/policies/ko/page.tsx:373` and its English counterpart: reword from "bring
your passport at check-in" to verification **before arrival**, matching how
self check-in actually works.

## Verification

- `pnpm run verify` — unit (`lib/documents/build.test.ts` extended with receipt
  builder cases in KO/EN/bi, the 최초입실일 field, and a bilingual-label
  assertion), production build, e2e (`e2e/documents.spec.ts` extended: receipt
  sends land in the `E2E_TEST_MODE` outbox with an audit row).
- Manual, admin browser session: every variant through the live preview and the
  print dialog, checking that the address on each document is byte-identical to
  the 사업자등록증, and that the contract still fits **2 pages** after §4.
- Diff the rendered contract against `/policies` section by section: confirm all
  15 sections are represented, and that no condensed clause reads softer or
  harder than the page it summarizes.

## Coordination note

Another session is editing `app/admin/requests/[id]/documents/print/page.tsx`
and `components/documents/document-view.tsx` right now. Steps 2 and 3 touch the
document model those files render — sequence after that session lands, or expect
conflicts.
