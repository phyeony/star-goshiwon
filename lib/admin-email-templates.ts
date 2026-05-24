import { siteConfig } from "./site-data";
import { formatUSD, DEPOSIT_USD } from "./pricing";
import type { BookingRequestWithRoom, EmailTemplate } from "./types";

export interface TemplateVar {
  name: string;
  description: string;
}

export const AVAILABLE_VARS: TemplateVar[] = [
  { name: "guest_name", description: "Guest's full name" },
  { name: "guest_email", description: "Guest's email address" },
  { name: "room_name", description: "Room display name (falls back to slug)" },
  { name: "check_in_date", description: "Check-in date, YYYY-MM-DD" },
  { name: "check_out_date", description: "Check-out date, YYYY-MM-DD" },
  { name: "guest_count", description: "Number of guests" },
  { name: "total_usd", description: "Estimated total in USD, formatted (e.g. $420)" },
  { name: "deposit_usd", description: "Refundable deposit in USD" },
  { name: "site_url", description: "Public site URL" },
  { name: "site_email", description: "Star Goshiwon contact email" },
  { name: "response_time", description: "Stated response time (e.g. \"24 hours\")" },
  { name: "payment_url", description: "Booking review + PayPal link (set when approving)" },
  { name: "payment_deadline", description: "Payment deadline in Korea time" },
];

function getPaymentReviewUrlFor(requestId: string) {
  const base = siteConfig.url.replace(/\/$/, "");
  return `${base}/booking-payment/pay?request_id=${requestId}`;
}

export function buildVarMap(req: BookingRequestWithRoom): Record<string, string> {
  return {
    guest_name: req.guest_name,
    guest_email: req.guest_email,
    room_name: req.rooms?.name ?? req.room_slug,
    check_in_date: req.check_in_date,
    check_out_date: req.check_out_date,
    guest_count: String(req.guest_count),
    total_usd: formatUSD(req.estimated_total),
    deposit_usd: formatUSD(DEPOSIT_USD),
    site_url: siteConfig.url,
    site_email: siteConfig.email,
    response_time: siteConfig.responseTime,
    payment_url: getPaymentReviewUrlFor(req.id),
    payment_deadline: formatPaymentDeadline(req.payment_expires_at),
  };
}

export function formatPaymentDeadline(value?: string | null): string {
  if (!value) return "48 hours after approval";
  return new Date(value).toLocaleString("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export type TemplateLang = "en" | "ko";

export function pickTemplateContent(
  template: EmailTemplate,
  lang: TemplateLang
): { subject: string; body: string } {
  if (lang === "ko") {
    return {
      subject: template.subject_ko || template.subject,
      body: template.body_ko || template.body,
    };
  }
  return { subject: template.subject, body: template.body };
}

const VAR_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

export function substitute(input: string, vars: Record<string, string>): string {
  return input.replace(VAR_RE, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      return vars[key];
    }
    return match;
  });
}

export interface RenderedTemplate {
  subject: string;
  body: string;
}

export function renderTemplate(
  template: EmailTemplate,
  req: BookingRequestWithRoom,
  lang: TemplateLang = "en"
): RenderedTemplate {
  const vars = buildVarMap(req);
  const { subject, body } = pickTemplateContent(template, lang);
  return {
    subject: substitute(subject, vars),
    body: substitute(body, vars),
  };
}

const SLUG_RE = /^[a-z0-9_]+$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug) && slug.length >= 1 && slug.length <= 64;
}
