import { daysBetween } from "../dates";
import { DEPOSIT_USD, formatUSD } from "../pricing";
import type { BookingRequestWithRoom } from "../types";
import type { Issuer } from "./issuer";
import type {
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

export function formatDocumentDate(iso: string, lang: DocumentLang): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return lang === "ko" ? `${y}년 ${m}월 ${d}일` : `${d} ${MONTHS_EN[m - 1]} ${y}`;
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

export function issuerRepresentative(
  issuer: Issuer,
  lang: DocumentLang
): string {
  return lang === "ko" ? issuer.representativeKo : issuer.representativeEn;
}

export function roomLabel(
  booking: BookingRequestWithRoom,
  lang: DocumentLang
): string {
  const room = booking.rooms;
  const name = lang === "ko" ? room?.name_ko || room?.name : room?.name;
  const base = name || booking.room_slug;
  const unit = booking.room_units?.name;
  return unit ? `${base} (${unit})` : base;
}

export function stayPeriod(
  booking: BookingRequestWithRoom,
  lang: DocumentLang
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
  lang: DocumentLang
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
  lang: DocumentLang
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
  lang: DocumentLang
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
  lang: DocumentLang
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

export function buildDocument(
  type: DocumentType,
  booking: BookingRequestWithRoom,
  form: GuestDocumentForm,
  issuer: Issuer,
  lang: DocumentLang
): DocumentModel {
  return type === "letter"
    ? buildLetter(booking, form, issuer, lang)
    : buildContract(booking, form, issuer, lang);
}
