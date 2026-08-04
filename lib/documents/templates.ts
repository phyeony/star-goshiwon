import { substitute } from "../admin-email-templates";
import { DEPOSIT_USD, formatUSD } from "../pricing";
import type { BookingRequestWithRoom } from "../types";
import {
  formatDocumentDate,
  issuerAddress,
  issuerName,
  issuerRepresentative,
  roomLabel,
  stayPeriod,
} from "./build";
import type { Issuer } from "./issuer";
import type { DocumentLang, DocumentType, GuestDocumentForm } from "./types";

export interface DocumentTokenDoc {
  name: string;
  description: string;
}

/** Shown in the admin template editor so the owner knows what to type. */
export const DOCUMENT_TOKENS: DocumentTokenDoc[] = [
  { name: "guest_name", description: "게스트 이름" },
  { name: "guest_email", description: "게스트 이메일" },
  { name: "room_name", description: "객실명 (배정된 호실 포함)" },
  { name: "period", description: "체류 기간 (시작 ~ 종료, 박수)" },
  { name: "check_in_date", description: "체크인 날짜" },
  { name: "check_out_date", description: "체크아웃 날짜" },
  { name: "passport_number", description: "여권번호 (발급 시 입력)" },
  { name: "nationality", description: "국적 (발급 시 입력)" },
  { name: "date_of_birth", description: "생년월일 (발급 시 입력)" },
  { name: "home_address", description: "본국 주소 (발급 시 입력)" },
  { name: "special_terms", description: "특약사항 (발급 시 입력)" },
  { name: "total_usd", description: "이용 요금 총액 (예: $700)" },
  { name: "deposit_usd", description: "보증금 (예: $70)" },
  { name: "issue_date", description: "발급일 / 작성일" },
  { name: "issuer_name", description: "상호" },
  { name: "issuer_registration_number", description: "사업자등록번호" },
  { name: "issuer_representative", description: "대표자명" },
  { name: "issuer_address", description: "숙소 주소" },
  { name: "issuer_phone", description: "연락처" },
];

export function buildDocumentVarMap(
  booking: BookingRequestWithRoom,
  form: GuestDocumentForm,
  issuer: Issuer,
  lang: DocumentLang
): Record<string, string> {
  return {
    guest_name: booking.guest_name,
    guest_email: booking.guest_email,
    room_name: roomLabel(booking, lang),
    period: stayPeriod(booking, lang),
    check_in_date: formatDocumentDate(booking.check_in_date, lang),
    check_out_date: formatDocumentDate(booking.check_out_date, lang),
    passport_number: form.passportNumber,
    nationality: form.nationality,
    date_of_birth: form.dateOfBirth
      ? formatDocumentDate(form.dateOfBirth, lang)
      : "",
    home_address: form.homeAddress,
    special_terms: form.specialTerms,
    total_usd: formatUSD(booking.estimated_total),
    deposit_usd: formatUSD(DEPOSIT_USD),
    issue_date: formatDocumentDate(form.issueDate, lang),
    issuer_name: issuerName(issuer, lang),
    issuer_registration_number: issuer.registrationNumber,
    issuer_representative: issuerRepresentative(issuer, lang),
    issuer_address: issuerAddress(issuer, lang),
    issuer_phone: issuer.phone,
  };
}

const DANGEROUS_TAGS =
  /<\s*\/?\s*(script|iframe|object|embed|link|meta|base|form|input|button)\b[^>]*>/gi;
const EVENT_ATTRS = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URLS = /(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi;

/**
 * Strips the tags and attributes that could execute when the stored template
 * body is injected into the preview, print page, and email. Only allowlisted
 * admins can save a template, so this is defence in depth rather than a
 * boundary against untrusted input.
 */
export function sanitizeTemplateHtml(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, "")
    .replace(DANGEROUS_TAGS, "")
    .replace(EVENT_ATTRS, "")
    .replace(JS_URLS, "$1=\"#\"");
}

/**
 * Fills {{tokens}} in a template body. Unknown tokens are deliberately left
 * visible (substitute() passes them through) so a typo shows up in the
 * preview instead of silently rendering an empty field.
 */
export function renderTemplateBody(
  bodyHtml: string,
  vars: Record<string, string>
): string {
  return substitute(bodyHtml, vars);
}

/** Tokens present in a body that no variable will fill. */
export function unknownTokens(
  bodyHtml: string,
  vars: Record<string, string>
): string[] {
  const found = new Set<string>();
  for (const match of bodyHtml.matchAll(
    /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g
  )) {
    const name = match[1];
    if (!Object.prototype.hasOwnProperty.call(vars, name)) found.add(name);
  }
  return [...found];
}

const LEASE_WORDING = /임대차\s*계약서|residential\s+lease\s+agreement/i;
const NON_LEASE_CLAUSE =
  /주택임대차보호법|not\s+a\s+residential\s+lease|is\s+not\s+a\s+lease/i;

/**
 * Non-blocking legal check for uploaded contract bodies. Titling a short
 * foreign stay as a 주택임대차계약서 would invoke 주택임대차보호법 tenancy
 * rights, so the editor warns — but the owner decides, and saving proceeds.
 */
export function contractWordingWarnings(
  type: DocumentType,
  title: string,
  bodyHtml: string
): string[] {
  if (type !== "contract") return [];

  const warnings: string[] = [];
  const text = `${title}\n${bodyHtml}`;

  if (LEASE_WORDING.test(text)) {
    warnings.push(
      "본문에 '임대차계약서' 표현이 있습니다. 단기 숙박을 주택임대차계약으로 표기하면 주택임대차보호법상 임차인 권리가 발생할 수 있습니다."
    );
  }
  if (!NON_LEASE_CLAUSE.test(text)) {
    warnings.push(
      "'본 계약은 주택임대차보호법상의 임대차계약이 아닙니다'에 해당하는 조항이 보이지 않습니다. 추가를 권장합니다."
    );
  }
  return warnings;
}
