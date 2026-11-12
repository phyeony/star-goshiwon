import { daysBetween } from "../dates";
import {
  CURRENT_POLICY_VERSION,
  formatPolicyDate,
  getPolicyVersionForDate,
} from "../policy-versions";
import { BEDDING_FEE_USD, DEPOSIT_USD, formatUSD } from "../pricing";
import { siteConfig, stayTimes } from "../site-data";
import type { BookingRequestWithRoom } from "../types";
import type { Issuer } from "./issuer";
import type {
  BaseLang,
  DocumentField,
  DocumentLang,
  DocumentModel,
  DocumentSection,
  DocumentType,
  GuestDocumentForm,
} from "./types";

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const BLANK = "—";

export function formatDocumentDate(iso: string, lang: BaseLang): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return lang === "ko" ? `${y}년 ${m}월 ${d}일` : `${d} ${MONTHS_EN[m - 1]} ${y}`;
}

function shown(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : BLANK;
}

export function issuerName(issuer: Issuer, lang: BaseLang): string {
  return lang === "ko" ? issuer.businessNameKo : issuer.businessNameEn;
}

export function issuerAddress(issuer: Issuer, lang: BaseLang): string {
  return lang === "ko" ? issuer.addressKo : issuer.addressEn;
}

export function issuerRepresentative(
  issuer: Issuer,
  lang: BaseLang
): string {
  return lang === "ko" ? issuer.representativeKo : issuer.representativeEn;
}

export function roomLabel(
  booking: BookingRequestWithRoom,
  lang: BaseLang
): string {
  const room = booking.rooms;
  const name = lang === "ko" ? room?.name_ko || room?.name : room?.name;
  const base = name || booking.room_slug;
  const unit = booking.room_units?.name;
  return unit ? `${base} (${unit})` : base;
}

export function stayPeriod(
  booking: BookingRequestWithRoom,
  lang: BaseLang
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
    alienRegistrationNumber: "외국인등록번호",
    accommodation: "숙소명",
    address: "숙소 주소",
    room: "객실",
    firstEntry: "최초입실일",
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
    alienRegistrationNumber: "Alien registration no.",
    accommodation: "Accommodation",
    address: "Address",
    room: "Room",
    firstEntry: "Date of first entry",
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
  lang: BaseLang
): string[] {
  if (lang === "ko") {
    return [
      `위 사람은 ${issuerName(issuer, lang)}(${issuerAddress(issuer, lang)})에 ` +
        `${stayPeriod(booking, lang)} 동안 숙소를 계약하고 실제로 체류하고 있음을 확인합니다.`,
      "본 확인서는 상기 숙박 예약 기록에 근거하여 사실대로 발급되었으며, 체류지 신고 등 행정 목적으로 사용될 수 있습니다.",
      // 출입국 asks for a three-part bundle; this letter is only the first part,
      // and it gets returned when submitted on its own.
      "※ 제출 시 본 확인서와 함께 숙소의 사업자등록증 사본 및 숙박료 영수증을 제출하시기 바랍니다.",
    ];
  }
  return [
    `This is to certify that the person named above has booked accommodation at ` +
      `${issuerName(issuer, lang)} (${issuerAddress(issuer, lang)}) and is staying there for ` +
      `${stayPeriod(booking, lang)}.`,
    "This confirmation is issued on the basis of the accommodation booking record above and may be used for administrative purposes such as reporting a place of residence.",
    "* Please submit this confirmation together with a copy of the accommodation's business registration certificate and the accommodation payment receipt.",
  ];
}

function missingGuestFields(
  form: GuestDocumentForm,
  lang: BaseLang
): string[] {
  const t = LETTER_TEXT[lang];
  const missing: string[] = [];
  if (!form.passportNumber.trim()) missing.push(t.passportNumber);
  if (!form.nationality.trim()) missing.push(t.nationality);
  if (!form.dateOfBirth.trim()) missing.push(t.dateOfBirth);
  return missing;
}

/**
 * Required ephemeral fields still blank, in the document's language. Used by
 * both the built-in documents and uploaded templates so the admin gets the
 * same warning either way.
 */
export function missingDocumentFields(
  type: DocumentType,
  form: GuestDocumentForm,
  lang: BaseLang
): string[] {
  const missing = missingGuestFields(form, lang);
  if (type === "contract" && !form.homeAddress.trim()) {
    missing.push(CONTRACT_TEXT[lang].homeAddress);
  }
  return missing;
}

function issuerFields(issuer: Issuer, lang: BaseLang): DocumentField[] {
  const t = LETTER_TEXT[lang];
  return [
    { label: t.businessName, value: shown(issuerName(issuer, lang)) },
    { label: t.registrationNumber, value: shown(issuer.registrationNumber) },
    {
      label: t.representative,
      value: shown(issuerRepresentative(issuer, lang)),
    },
    { label: t.address, value: shown(issuerAddress(issuer, lang)) },
    { label: t.phone, value: shown(issuer.phone) },
  ];
}

export function buildLetter(
  booking: BookingRequestWithRoom,
  form: GuestDocumentForm,
  issuer: Issuer,
  lang: BaseLang
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
          // Only guests already holding an ARC (filing a 체류지 변경신고) have
          // one, so the row is omitted rather than left blank for the rest.
          ...(form.alienRegistrationNumber.trim()
            ? [
                {
                  label: t.alienRegistrationNumber,
                  value: form.alienRegistrationNumber.trim(),
                },
              ]
            : []),
        ],
        paragraphs: [],
      },
      {
        heading: t.stayHeading,
        fields: [
          { label: t.accommodation, value: shown(issuerName(issuer, lang)) },
          { label: t.address, value: shown(issuerAddress(issuer, lang)) },
          { label: t.room, value: shown(roomLabel(booking, lang)) },
          // Printed separately from the period range: 최초입실일 is the field
          // 출입국 looks for, and reading it out of a range is what gets these
          // letters sent back.
          {
            label: t.firstEntry,
            value: formatDocumentDate(booking.check_in_date, lang),
          },
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

const CONTRACT_TEXT = {
  ko: {
    title: "숙소 이용 계약서",
    partiesHeading: "계약 당사자",
    stayHeading: "이용 객실 및 기간",
    priceHeading: "이용 요금",
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
    roomCharge: "객실료",
    beddingFee: "침구비",
    paidTotal: "결제 총액 (보증금 포함)",
    deposit: "보증금 (환급)",
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
    roomCharge: "Room charge",
    beddingFee: "Bedding fee",
    paidTotal: "Total paid (incl. deposit)",
    deposit: "Refundable deposit",
    bedding: "Bedding set",
    beddingIncluded: "Included (prepaid)",
    beddingExcluded: "Not included",
    issueDate: "Date of agreement",
    guestRole: "Guest",
  },
} as const;

interface RefundTier {
  ko: string;
  en: string;
  refund: string;
  noteKo?: string;
  noteEn?: string;
}

const REFUND_TIERS: RefundTier[] = [
  { ko: "체크인 30일 이상 전", en: "30+ days before check-in", refund: "100%" },
  {
    ko: "체크인 15~29일 전",
    en: "15–29 days before check-in",
    refund: "90%",
    noteKo: " (10% 행정 수수료)",
    noteEn: " (10% administration fee)",
  },
  { ko: "체크인 8~14일 전", en: "8–14 days before check-in", refund: "70%" },
  { ko: "체크인 1~7일 전", en: "1–7 days before check-in", refund: "50%" },
  { ko: "체크인 당일 / 노쇼", en: "Day of check-in / no-show", refund: "0%" },
];

function refundTierFields(lang: BaseLang): DocumentField[] {
  return REFUND_TIERS.map((tier) => ({
    label: lang === "ko" ? tier.ko : tier.en,
    value:
      tier.refund +
      (lang === "ko" ? tier.noteKo ?? "" : tier.noteEn ?? ""),
  }));
}

/**
 * `estimated_total` is the grand total the guest was charged — it already
 * includes the bedding fee and the refundable deposit (see `calculateEstimate`
 * in lib/pricing: `total = nightsSubtotal - discount + beddingFee + deposit`).
 * Printing it as "이용 요금 총액" with the deposit listed under it reads as if
 * the deposit were owed on top, so both money documents break it out instead.
 */
export interface PaymentBreakdown {
  room: number;
  bedding: number;
  deposit: number;
  total: number;
}

export function paymentBreakdown(
  booking: BookingRequestWithRoom
): PaymentBreakdown {
  const total = booking.estimated_total;
  const bedding = booking.bedding_prepaid ? BEDDING_FEE_USD : 0;
  return { room: total - bedding - DEPOSIT_USD, bedding, deposit: DEPOSIT_USD, total };
}

/** The money rows, shared by the contract and the receipt so they cannot drift. */
function priceFields(
  booking: BookingRequestWithRoom,
  lang: BaseLang
): DocumentField[] {
  const t = CONTRACT_TEXT[lang];
  const money = paymentBreakdown(booking);
  return [
    { label: t.roomCharge, value: formatUSD(money.room) },
    {
      label: t.beddingFee,
      value: money.bedding ? formatUSD(money.bedding) : t.beddingExcluded,
    },
    { label: t.deposit, value: formatUSD(money.deposit) },
    { label: t.paidTotal, value: formatUSD(money.total) },
  ];
}

function policyUrl(lang: BaseLang): string {
  return lang === "ko"
    ? `${siteConfig.url}/policies/ko`
    : `${siteConfig.url}/policies`;
}

/**
 * The terms of stay, condensed from /policies.
 *
 * The split between "printed in near-full" and "one line" is deliberate, not
 * stylistic: under 약관규제법 §3 (명시·설명의무) a 중요한 내용 that exists only
 * behind a URL can be excluded from the contract (편입 배제) and becomes
 * unenforceable. So anything that costs the guest money or ends the stay —
 * cancellation, deposit, termination, disposal of belongings — is on the paper
 * they sign. Everything else is a single line plus the governing-terms clause.
 *
 * Wording must not read softer *or* harder than /policies: under §5②
 * (작성자 불이익 원칙) any divergence between this summary and the page is
 * construed against us. Edit both together.
 */
function contractTerms(
  booking: BookingRequestWithRoom,
  lang: BaseLang
): DocumentSection[] {
  // Policy §15 pins the version in force when the guest booked, not today's.
  const version =
    getPolicyVersionForDate(booking.created_at.slice(0, 10)) ??
    CURRENT_POLICY_VERSION;
  const versionDate = formatPolicyDate(version.effectiveFrom, lang);
  const deposit = formatUSD(DEPOSIT_USD);
  const bedding = formatUSD(BEDDING_FEE_USD);

  if (lang === "ko") {
    return [
      {
        heading: "취소 및 환불",
        fields: refundTierFields(lang),
        paragraphs: [
          "위 환불 비율은 총 객실료(장기 할인 적용 후, 침구비 및 보증금 제외)를 기준으로 하며, 취소 시점은 서면(이메일 또는 WhatsApp) 수신 시각(한국 표준시)을 기준으로 합니다.",
          "체크인 이후에는 사유를 불문하고 객실료가 환불되지 않으며, 조기 퇴실 시 잔여 숙박일에 대해서도 환불되지 않습니다.",
          `침구가 준비·개봉 또는 사용된 후의 ${bedding} 침구 비용, 결제 수수료 및 환전 스프레드, 이미 제공된 부가 서비스는 환불되지 않습니다.`,
          `${deposit} 보증금은 취소 사유와 무관하게 전액 환불됩니다.`,
          "모든 환불은 결제하신 동일 PayPal 계정 또는 카드로 USD 지급되며, 현금 환불은 제공되지 않습니다.",
          "증빙 가능한 의료 응급 상황, 비자 거부, 기타 통제 범위를 벗어난 중대한 사유는 사안별로 검토합니다.",
        ],
      },
      {
        heading: "보증금",
        fields: [],
        paragraphs: [
          `보증금 ${deposit}은 예약 확정 시 객실료와 함께 PayPal로 선결제되며, 손해 배상·분실 물품·미납 요금의 담보로 보관됩니다.`,
          "객실에 손상이 없고 키와 비품이 모두 반환되며 객실이 적절한 상태로 정리된 경우, 퇴실 후 영업일 기준 5일 이내에 PayPal 환불이 개시됩니다. 입금까지는 통상 영업일 기준 5~10일이 추가로 소요됩니다.",
          "공제가 발생하는 경우 항목별로 서면 안내하며, 손상 사진은 공제 확정 전에 전달합니다. 수리 또는 교체 비용이 보증금을 초과하는 경우 차액은 별도로 청구됩니다.",
          "체크아웃을 이행하지 않는 경우(객실 무단 방치, 예정된 체크아웃일로부터 7일 이내 연락 두절) 청소비·키 교체비·잔여 물품 처리 비용을 위해 보증금이 전액 차감될 수 있습니다.",
        ],
      },
      {
        heading: "이용 규칙",
        fields: [],
        paragraphs: [
          "이용자는 계약된 객실만 사용하며, 사전 서면 승인 없이 제3자를 숙박시킬 수 없습니다. 방문객은 22시까지 퇴거해야 하며, 이용자가 방문객의 행위에 대해 책임을 집니다.",
          "정숙 시간은 23:00~06:00입니다.",
          "객실, 화장실, 복도, 주방, 세탁실 등 건물 내부 전 구역에서 흡연이 금지되며, 객실 내 취사도 금지됩니다. 공용 주방과 세탁실은 안내된 이용 시간에 따릅니다.",
          "반려동물은 동반할 수 없습니다.",
          "쓰레기는 서울시 분리수거 규정에 따라 배출하고, 잠금 장치·화재 경보기·스프링클러·소화기 등 안전 시설에 손대지 않습니다.",
          "본 시설은 남성 전용이며, 객실의 공유·전대·양도는 불가능합니다.",
          "마약 사용 또는 소지를 포함한 일체의 불법 행위는 즉시 계약 해지 사유입니다.",
        ],
      },
      {
        heading: "계약 해지 및 퇴거",
        fields: [],
        paragraphs: [
          "소란 행위(과도한 소음, 실내 흡연, 폭력, 절도, 불법 행위 등), 다른 입주자나 직원에 대한 위협·괴롭힘, 안전 시설 훼손, 신원 허위 기재, 사전 협의 없는 3일 이상의 요금 미납, 서면 경고 후 반복된 규칙 위반의 경우, 관리자는 숙박을 즉시 종료할 수 있습니다.",
          "위 사유로 해지되는 경우 환불 없이 퇴거가 집행되며, 보증금은 손해 배상 또는 미납 요금에 충당될 수 있습니다.",
          "해지 후 객실에 남아 있는 개인 물품은 반출될 수 있으며, 미납 상태가 3일 이상 지속되는 경우 폐기될 수 있고 이에 대해 보상을 청구할 수 없습니다. 폐기 전 등록된 이메일과 전화번호로 연락을 시도합니다.",
        ],
      },
      {
        heading: "기타 약정",
        fields: [],
        paragraphs: [
          `체크인은 ${stayTimes.checkInKo}, 체크아웃은 출발일 ${stayTimes.checkOutKo}까지입니다. 체크인은 셀프 체크인이며, 신원 확인은 도착 전에 완료되어야 합니다.`,
          "일정 변경은 체크인 7일 이상 전이고 새 일정에 객실이 가능한 경우 무료이며, 그 이후에는 위 취소 규정에 따릅니다. 연장은 예정된 체크아웃일 최소 7일 전에 문의해 주세요.",
          "각 객실에는 개별 잠금 장치가 있으나, 객실 내부 또는 공용 공간에서의 개인 물품 분실·도난에 대해 시설은 책임지지 않습니다. 별도의 여행자 보험 가입을 권장합니다.",
          "긴급 상황이나 즉시 처리해야 할 유지보수, 위생·화재 안전·전기·방역 등 정기 점검, 화재 경보를 포함한 비상 상황, 사전 협의 없는 3일 이상의 요금 미납의 경우 사전 통지 없이 객실에 출입할 수 있습니다.",
          "자연재해, 정부 명령, 공중 보건 조치, 화재 등 합리적 통제 범위를 벗어난 사유로 숙박이 불가능하거나 단축되는 경우, 미사용 숙박일의 요금을 표준 취소 패널티 없이 환불합니다.",
          "제출하신 개인정보는 예약 관리, 외국인 투숙객 등록 의무 이행, 숙박 관련 연락 목적으로만 사용되며, 마케팅 목적으로 제3자에게 판매하거나 공유하지 않습니다.",
          "본 계약은 숙박시설 이용에 관한 계약으로, 주택임대차보호법상의 주택 임대차계약이 아닙니다.",
        ],
      },
      {
        heading: "약관의 적용",
        fields: [],
        paragraphs: [
          `본 계약의 위 조항은 ${policyUrl(lang)} 에 게시된 이용 약관(${versionDate}부터 적용)을 요약한 것이며, 해당 약관은 본 계약의 일부를 구성합니다. 본 계약에 명시되지 않은 사항은 위 약관에 따릅니다.`,
        ],
      },
    ];
  }

  return [
    {
      heading: "Cancellation and refunds",
      fields: refundTierFields(lang),
      paragraphs: [
        "The percentages above apply to the total room rate (after any long-stay discount, excluding the bedding fee and the deposit). A cancellation takes effect when we receive it in writing (email or WhatsApp), in Korea Standard Time.",
        "After check-in the room rate is non-refundable for any reason, and no refund is given for unused nights if the guest departs early.",
        `The ${bedding} bedding fee once bedding has been prepared, opened, or used, payment-processing fees and currency spreads, and add-on services already provided are not refundable.`,
        `The ${deposit} deposit is refunded in full regardless of the reason for cancellation.`,
        "All refunds are paid in USD to the same PayPal account or card used for payment. No cash refunds are given.",
        "Documented medical emergencies, visa refusals, and other serious circumstances beyond the guest's control are reviewed case by case.",
      ],
    },
    {
      heading: "Deposit",
      fields: [],
      paragraphs: [
        `The ${deposit} deposit is prepaid via PayPal together with the room rate when the booking is confirmed, and is held against damage, missing items, and unpaid charges.`,
        "If the room is undamaged, all keys and fixtures are returned, and the room is left in reasonable condition, the PayPal refund is initiated within 5 business days of check-out. Settlement usually takes a further 5–10 business days.",
        "Any deduction is itemised in writing, and photographs of the damage are sent before the deduction is finalised. Where repair or replacement costs exceed the deposit, the difference is invoiced separately.",
        "If the guest fails to check out (abandoning the room, or unreachable within 7 days of the scheduled check-out date), the deposit may be applied in full to cleaning, key replacement, and disposal of remaining belongings.",
      ],
    },
    {
      heading: "House rules",
      fields: [],
      paragraphs: [
        "The guest may use only the room stated above and may not host additional occupants without prior written approval. Visitors must leave by 10 PM, and the guest is responsible for their conduct.",
        "Quiet hours are 11 PM to 6 AM.",
        "Smoking is prohibited everywhere inside the building — rooms, bathrooms, hallways, kitchen, and laundry — and cooking inside the room is prohibited. The shared kitchen and laundry are used according to the posted hours.",
        "Pets are not allowed.",
        "Waste is separated and disposed of according to Seoul's recycling rules, and locks, fire alarms, sprinklers, and extinguishers must not be tampered with.",
        "This is a men-only facility. Rooms may not be shared, sublet, or transferred.",
        "Any illegal activity, including the use or possession of drugs, is grounds for immediate termination.",
      ],
    },
    {
      heading: "Termination and eviction",
      fields: [],
      paragraphs: [
        "The operator may end the stay immediately for disruptive conduct (excessive noise, smoking indoors, violence, theft, illegal activity), threats to or harassment of other residents or staff, tampering with safety equipment, misrepresenting identity, non-payment of 3 days or more without prior arrangement, or repeated rule violations after a written warning.",
        "In those cases the guest is required to leave without a refund, and the deposit may be applied to damages or unpaid charges.",
        "Belongings left in the room after termination may be removed, and may be disposed of if the non-payment continues for 3 days or more, with no claim for compensation. We attempt to make contact at the registered email and phone number before disposing of anything.",
      ],
    },
    {
      heading: "Other terms",
      fields: [],
      paragraphs: [
        `Check-in is at ${stayTimes.checkInEn} and check-out is by ${stayTimes.checkOutEn} on the departure date. Check-in is self check-in, so identity verification must be completed before arrival.`,
        "Date changes are free 7 or more days before check-in when the room is available on the new dates; after that the cancellation terms above apply. Requests to extend should reach us at least 7 days before the scheduled check-out.",
        "Each room has its own lock, but the facility is not liable for loss or theft of personal belongings in rooms or shared areas. Separate travel insurance is recommended.",
        "The room may be entered without prior notice for emergencies or urgent maintenance, scheduled inspections (hygiene, fire safety, electrical, pest control), emergencies including fire alarms, and non-payment of 3 days or more without prior arrangement.",
        "Where a stay becomes impossible or is cut short by circumstances beyond reasonable control — natural disaster, government order, public health measures, fire — unused nights are refunded without the standard cancellation penalty.",
        "Personal information provided is used only to manage the booking, meet Korea's foreign-guest registration obligations, and communicate about the stay. It is never sold or shared with third parties for marketing.",
        "This agreement covers the use of accommodation facilities and is not a residential lease under the Korean Housing Lease Protection Act.",
      ],
    },
    {
      heading: "Governing terms",
      fields: [],
      paragraphs: [
        `The clauses above summarise the policies published at ${policyUrl(lang)} (effective from ${versionDate}), which form part of this agreement. Anything not stated here is governed by those policies.`,
      ],
    },
  ];
}

export function buildContract(
  booking: BookingRequestWithRoom,
  form: GuestDocumentForm,
  issuer: Issuer,
  lang: BaseLang
): DocumentModel {
  const t = CONTRACT_TEXT[lang];
  const missing = missingDocumentFields("contract", form, lang);

  // Explicitly typed: without the annotation TypeScript infers `never[]` for
  // the empty `paragraphs`/`fields` arrays and rejects the push below.
  const sections: DocumentSection[] = [
    {
      heading: t.partiesHeading,
      fields: [
        { label: t.provider, value: shown(issuerName(issuer, lang)) },
        { label: t.registrationNumber, value: shown(issuer.registrationNumber) },
        {
          label: t.representative,
          value: shown(issuerRepresentative(issuer, lang)),
        },
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
      fields: priceFields(booking, lang),
      paragraphs: [],
    },
    ...contractTerms(booking, lang),
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
        : ["The provider and the guest agree to the terms above and sign below."],
    issueDateLine: `${t.issueDate}: ${formatDocumentDate(form.issueDate, lang)}`,
    signatures: [
      {
        role: t.representative,
        name: issuerRepresentative(issuer, lang),
        showStamp: true,
      },
      { role: t.guestRole, name: booking.guest_name, showStamp: false },
    ],
    missingFields: missing,
  };
}

const RECEIPT_TEXT = {
  ko: {
    title: "숙박료 영수증",
    providerHeading: "공급자",
    guestHeading: "이용자",
    stayHeading: "이용 내역",
    paymentHeading: "결제 내역",
    businessName: "상호",
    registrationNumber: "사업자등록번호",
    representative: "대표자",
    address: "숙소 주소",
    phone: "연락처",
    guestName: "성명",
    nationality: "국적",
    passportNumber: "여권번호",
    room: "객실",
    firstEntry: "최초입실일",
    period: "이용 기간",
    method: "결제 수단",
    paidOn: "결제일",
    reference: "결제 번호",
    issueDate: "발행일",
    unpaid: "미결제",
  },
  en: {
    title: "Accommodation Payment Receipt",
    providerHeading: "Provider",
    guestHeading: "Guest",
    stayHeading: "Stay",
    paymentHeading: "Payment",
    businessName: "Business name",
    registrationNumber: "Business registration no.",
    representative: "Representative",
    address: "Address",
    phone: "Contact",
    guestName: "Name",
    nationality: "Nationality",
    passportNumber: "Passport number",
    room: "Room",
    firstEntry: "Date of first entry",
    period: "Period of use",
    method: "Payment method",
    paidOn: "Paid on",
    reference: "Payment reference",
    issueDate: "Date of issue",
    unpaid: "Not yet paid",
  },
} as const;

/**
 * The payment proof half of the immigration bundle. 출입국 wants a 월세 영수증
 * or a 계좌이체 내역 naming the 업체명 — but guests pay in USD through PayPal,
 * so no Korean bank record naming this business will ever exist. A receipt
 * issued by the business showing the address, the stay period, and the guest's
 * name is the accepted substitute for hotel/Airbnb-type stays.
 */
function buildReceiptBase(
  booking: BookingRequestWithRoom,
  form: GuestDocumentForm,
  issuer: Issuer,
  lang: BaseLang
): DocumentModel {
  const t = RECEIPT_TEXT[lang];
  const paidOn = booking.payment_paid_at
    ? formatDocumentDate(booking.payment_paid_at.slice(0, 10), lang)
    : t.unpaid;

  return {
    type: "receipt",
    lang,
    title: t.title,
    subtitle: issuerName(issuer, lang),
    sections: [
      {
        heading: t.providerHeading,
        fields: [
          { label: t.businessName, value: shown(issuerName(issuer, lang)) },
          {
            label: t.registrationNumber,
            value: shown(issuer.registrationNumber),
          },
          {
            label: t.representative,
            value: shown(issuerRepresentative(issuer, lang)),
          },
          { label: t.address, value: shown(issuerAddress(issuer, lang)) },
          { label: t.phone, value: shown(issuer.phone) },
        ],
        paragraphs: [],
      },
      {
        heading: t.guestHeading,
        fields: [
          { label: t.guestName, value: shown(booking.guest_name) },
          { label: t.nationality, value: shown(form.nationality) },
          { label: t.passportNumber, value: shown(form.passportNumber) },
        ],
        paragraphs: [],
      },
      {
        heading: t.stayHeading,
        fields: [
          { label: t.room, value: shown(roomLabel(booking, lang)) },
          {
            label: t.firstEntry,
            value: formatDocumentDate(booking.check_in_date, lang),
          },
          { label: t.period, value: stayPeriod(booking, lang) },
        ],
        paragraphs: [],
      },
      {
        heading: t.paymentHeading,
        fields: [
          ...priceFields(booking, lang),
          { label: t.method, value: "PayPal" },
          { label: t.paidOn, value: paidOn },
          {
            label: t.reference,
            value: shown(booking.payment_capture_id ?? ""),
          },
        ],
        paragraphs: [],
      },
    ],
    statement:
      lang === "ko"
        ? ["위 금액을 숙박료로 정히 영수하였음을 확인합니다."]
        : ["We confirm receipt of the amount above as payment for the stay."],
    issueDateLine: `${t.issueDate}: ${formatDocumentDate(form.issueDate, lang)}`,
    signatures: [
      {
        role: t.representative,
        name: issuerRepresentative(issuer, lang),
        showStamp: true,
      },
    ],
    missingFields: missingDocumentFields("receipt", form, lang),
  };
}

/** Joins two label/heading strings for the 영문병기 layout. */
const pair = (ko: string, en: string) => (ko === en ? ko : `${ko} / ${en}`);

/**
 * Composes the KO and EN documents into one 영문병기 page rather than having a
 * third translation to maintain — the two halves cannot drift out of sync
 * because they are the same two documents the admin can already print.
 *
 * Values that render identically in both (passport numbers, money, room codes)
 * print once; only genuinely different ones get the `ko / en` treatment.
 */
export function mergeBilingual(
  ko: DocumentModel,
  en: DocumentModel
): DocumentModel {
  return {
    type: ko.type,
    lang: "bi",
    title: pair(ko.title, en.title),
    subtitle: pair(ko.subtitle, en.subtitle),
    sections: ko.sections.map((koSection, i) => {
      const enSection = en.sections[i];
      if (!enSection) return koSection;
      return {
        heading: pair(koSection.heading, enSection.heading),
        fields: koSection.fields.map((koField, j) => {
          const enField = enSection.fields[j];
          if (!enField) return koField;
          return {
            label: pair(koField.label, enField.label),
            value: pair(koField.value, enField.value),
          };
        }),
        // Prose reads better stacked than interleaved on one line.
        paragraphs: [...koSection.paragraphs, ...enSection.paragraphs],
      };
    }),
    statement: [...ko.statement, ...en.statement],
    issueDateLine: pair(ko.issueDateLine, en.issueDateLine),
    signatures: ko.signatures.map((koSig, i) => {
      const enSig = en.signatures[i];
      if (!enSig) return koSig;
      return {
        role: pair(koSig.role, enSig.role),
        name: pair(koSig.name, enSig.name),
        showStamp: koSig.showStamp,
      };
    }),
    missingFields: ko.missingFields,
  };
}

/** Document types that offer the 영문병기 variant. */
export const BILINGUAL_TYPES: DocumentType[] = ["letter", "receipt"];

export function buildDocument(
  type: DocumentType,
  booking: BookingRequestWithRoom,
  form: GuestDocumentForm,
  issuer: Issuer,
  lang: DocumentLang
): DocumentModel {
  if (lang === "bi") {
    return mergeBilingual(
      buildDocument(type, booking, form, issuer, "ko"),
      buildDocument(type, booking, form, issuer, "en")
    );
  }
  if (type === "letter") return buildLetter(booking, form, issuer, lang);
  if (type === "receipt") return buildReceiptBase(booking, form, issuer, lang);
  return buildContract(booking, form, issuer, lang);
}

export function buildReceipt(
  booking: BookingRequestWithRoom,
  form: GuestDocumentForm,
  issuer: Issuer,
  lang: DocumentLang
): DocumentModel {
  return buildDocument("receipt", booking, form, issuer, lang);
}
