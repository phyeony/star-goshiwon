// Booking conversion funnel for /admin/funnel. Pure functions only, so the
// stage and outcome rules can be unit tested without Supabase.
//
// Two things about the real data shape the rules here:
// - Admins often answer by email (follow_up template) without moving the
//   request out of "new", so "responded" also counts any sent email.
// - Guests frequently submit one request per room type within minutes of each
//   other. Requests from the same email within INQUIRY_GAP_DAYS are grouped
//   into one inquiry, and the inquiry takes the furthest stage any of its
//   requests reached.

import type { BookingRequest, BookingStatus } from "./types";
import { daysBetween } from "./dates";

export const INQUIRY_GAP_DAYS = 14;
const HOUR_MS = 60 * 60 * 1000;

export type FunnelRequest = Pick<
  BookingRequest,
  | "id"
  | "guest_name"
  | "guest_email"
  | "room_slug"
  | "check_in_date"
  | "check_out_date"
  | "status"
  | "payment_status"
  | "payment_amount"
  | "payment_currency"
  | "payment_created_at"
  | "payment_paid_at"
  | "created_at"
>;

// First successful email per request, from email_sends.
export type FirstEmailByRequest = Map<string, string>;

export const STAGES = [
  { key: "requested", label: "예약 요청" },
  { key: "responded", label: "답장 받음" },
  { key: "offered", label: "결제 링크 받음" },
  { key: "paid", label: "결제 완료" },
  { key: "stayed", label: "입실" },
] as const;

export type StageIndex = 0 | 1 | 2 | 3 | 4;

export type Outcome =
  | "stayed"
  | "upcoming"
  | "open"
  | "no_reply"
  | "went_quiet"
  | "unpaid_link"
  | "declined";

export const OUTCOME_LABELS: Record<Outcome, string> = {
  stayed: "입실 완료",
  upcoming: "결제 완료 · 입실 예정",
  open: "진행 중 (입실일 전)",
  no_reply: "답장 없이 지나감",
  went_quiet: "답장 후 고객 연락 끊김",
  unpaid_link: "결제 링크 미결제 · 만료",
  declined: "거절 · 종료",
};

export const LOST_OUTCOMES: Outcome[] = [
  "no_reply",
  "went_quiet",
  "unpaid_link",
  "declined",
];

const OPEN_STATUSES: BookingStatus[] = ["new", "reviewing", "contacted"];

export function isPaid(r: FunnelRequest) {
  // "confirmed" without a PayPal capture means it was paid another way.
  return (
    r.payment_status === "paid" ||
    r.payment_status === "refunded" ||
    r.status === "confirmed"
  );
}

export function requestStage(
  r: FunnelRequest,
  firstEmail: FirstEmailByRequest,
  today: string
): StageIndex {
  if (isPaid(r)) return r.check_in_date <= today ? 4 : 3;
  if (
    r.payment_created_at ||
    r.status === "approved" ||
    r.payment_status !== "none"
  ) {
    return 2;
  }
  if (r.status !== "new" || firstEmail.has(r.id)) return 1;
  return 0;
}

export type Inquiry = {
  key: string;
  guestName: string;
  guestEmail: string;
  requests: FunnelRequest[];
  // The request that got furthest; ties go to the latest one.
  lead: FunnelRequest;
  stage: StageIndex;
  outcome: Outcome;
};

function outcomeFor(lead: FunnelRequest, stage: StageIndex, today: string): Outcome {
  if (stage === 4) return "stayed";
  if (stage === 3) return "upcoming";
  if (lead.status === "declined" || lead.status === "closed") return "declined";
  if (lead.check_in_date >= today && lead.status !== "expired") return "open";
  if (stage === 2) return "unpaid_link";
  if (stage === 1) return "went_quiet";
  return "no_reply";
}

export function groupInquiries(
  requests: FunnelRequest[],
  firstEmail: FirstEmailByRequest,
  today: string
): Inquiry[] {
  const sorted = [...requests].sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );
  const groups: FunnelRequest[][] = [];
  const openGroupByEmail = new Map<string, FunnelRequest[]>();

  for (const r of sorted) {
    const email = r.guest_email.trim().toLowerCase();
    const group = openGroupByEmail.get(email);
    const last = group?.[group.length - 1];
    if (
      group &&
      last &&
      daysBetween(last.created_at.slice(0, 10), r.created_at.slice(0, 10)) <=
        INQUIRY_GAP_DAYS
    ) {
      group.push(r);
    } else {
      const next = [r];
      groups.push(next);
      openGroupByEmail.set(email, next);
    }
  }

  return groups.map((group) => {
    let lead = group[0];
    let stage = requestStage(lead, firstEmail, today);
    for (const r of group.slice(1)) {
      const s = requestStage(r, firstEmail, today);
      if (s >= stage) {
        lead = r;
        stage = s;
      }
    }
    return {
      key: group[0].id,
      guestName: lead.guest_name,
      guestEmail: lead.guest_email,
      requests: group,
      lead,
      stage,
      outcome: outcomeFor(lead, stage, today),
    };
  });
}

export type Breakdown = {
  label: string;
  inquiries: number;
  paid: number;
};

function breakdown(
  inquiries: Inquiry[],
  buckets: { label: string; match: (i: Inquiry) => boolean }[]
): Breakdown[] {
  return buckets.map(({ label, match }) => {
    const rows = inquiries.filter(match);
    return {
      label,
      inquiries: rows.length,
      paid: rows.filter((i) => i.stage >= 3).length,
    };
  });
}

function nights(i: Inquiry) {
  return daysBetween(i.lead.check_in_date, i.lead.check_out_date);
}

function leadDays(i: Inquiry) {
  return daysBetween(i.lead.created_at.slice(0, 10), i.lead.check_in_date);
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function hoursBetween(from: string, to: string) {
  return (new Date(to).getTime() - new Date(from).getTime()) / HOUR_MS;
}

export function needsCleanup(r: FunnelRequest, today: string) {
  if (r.check_in_date >= today) return false;
  if (OPEN_STATUSES.includes(r.status)) return true;
  return r.status === "approved" && r.payment_status === "pending";
}

export type FunnelReport = {
  requestCount: number;
  inquiries: Inquiry[];
  stageCounts: number[];
  outcomeCounts: Record<Outcome, number>;
  byRoom: Breakdown[];
  byNights: Breakdown[];
  byLeadTime: Breakdown[];
  medianHoursToReply: number | null;
  repliedWithin24h: { replied: number; within: number };
  medianHoursLinkToPaid: number | null;
  paidRevenueUsd: number;
  cleanup: FunnelRequest[];
};

export function buildFunnelReport(
  requests: FunnelRequest[],
  firstEmail: FirstEmailByRequest,
  roomLabel: (slug: string) => string,
  today: string
): FunnelReport {
  const inquiries = groupInquiries(requests, firstEmail, today);

  const stageCounts = STAGES.map(
    (_, idx) => inquiries.filter((i) => i.stage >= idx).length
  );

  const outcomeCounts = Object.fromEntries(
    Object.keys(OUTCOME_LABELS).map((k) => [k, 0])
  ) as Record<Outcome, number>;
  for (const i of inquiries) outcomeCounts[i.outcome] += 1;

  const roomSlugs = [...new Set(inquiries.map((i) => i.lead.room_slug))].sort();
  const byRoom = breakdown(
    inquiries,
    roomSlugs.map((slug) => ({
      label: roomLabel(slug),
      match: (i) => i.lead.room_slug === slug,
    }))
  );
  const byNights = breakdown(inquiries, [
    { label: "1–13박", match: (i) => nights(i) < 14 },
    { label: "14–29박", match: (i) => nights(i) >= 14 && nights(i) < 30 },
    { label: "30–89박", match: (i) => nights(i) >= 30 && nights(i) < 90 },
    { label: "90박 이상", match: (i) => nights(i) >= 90 },
  ]);
  const byLeadTime = breakdown(inquiries, [
    { label: "3일 이내", match: (i) => leadDays(i) <= 3 },
    { label: "4–30일 전", match: (i) => leadDays(i) > 3 && leadDays(i) <= 30 },
    { label: "31일 이상 전", match: (i) => leadDays(i) > 30 },
  ]);

  // Reply speed is per inquiry: the first email to any of its requests.
  const replyHours: number[] = [];
  for (const i of inquiries) {
    const sent = i.requests
      .map((r) => firstEmail.get(r.id))
      .filter((v): v is string => Boolean(v))
      .sort();
    if (sent.length) {
      replyHours.push(
        Math.max(0, hoursBetween(i.requests[0].created_at, sent[0]))
      );
    }
  }

  const paidRequests = requests.filter(
    (r) => r.payment_status === "paid" || r.payment_status === "refunded"
  );
  const linkToPaid = paidRequests
    .filter((r) => r.payment_created_at && r.payment_paid_at)
    .map((r) =>
      Math.max(0, hoursBetween(r.payment_created_at!, r.payment_paid_at!))
    );
  const paidRevenueUsd = paidRequests
    .filter((r) => !r.payment_currency || r.payment_currency === "USD")
    .reduce((sum, r) => sum + (r.payment_amount ?? 0), 0);

  return {
    requestCount: requests.length,
    inquiries,
    stageCounts,
    outcomeCounts,
    byRoom,
    byNights,
    byLeadTime,
    medianHoursToReply: median(replyHours),
    repliedWithin24h: {
      replied: replyHours.length,
      within: replyHours.filter((h) => h <= 24).length,
    },
    medianHoursLinkToPaid: median(linkToPaid),
    paidRevenueUsd,
    cleanup: requests
      .filter((r) => needsCleanup(r, today))
      .sort((a, b) => a.check_in_date.localeCompare(b.check_in_date)),
  };
}
