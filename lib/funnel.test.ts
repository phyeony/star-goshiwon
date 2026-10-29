import { describe, expect, it } from "vitest";
import {
  buildFunnelReport,
  groupInquiries,
  needsCleanup,
  requestStage,
  type FunnelRequest,
} from "./funnel";

const TODAY = "2026-10-29";

function req(overrides: Partial<FunnelRequest> = {}): FunnelRequest {
  return {
    id: "req-1",
    guest_name: "Guest",
    guest_email: "guest@example.com",
    room_slug: "economy-room",
    check_in_date: "2026-09-01",
    check_out_date: "2026-09-15",
    status: "new",
    payment_status: "none",
    payment_amount: null,
    payment_currency: null,
    payment_created_at: null,
    payment_paid_at: null,
    created_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("requestStage", () => {
  it("counts a sent email as a reply even when status is still new", () => {
    const r = req();
    expect(requestStage(r, new Map(), TODAY)).toBe(0);
    expect(requestStage(r, new Map([["req-1", "2026-08-01T02:00:00Z"]]), TODAY)).toBe(1);
  });

  it("treats a payment link or approval as offered", () => {
    expect(requestStage(req({ status: "approved", payment_status: "pending" }), new Map(), TODAY)).toBe(2);
    expect(requestStage(req({ status: "expired", payment_status: "expired" }), new Map(), TODAY)).toBe(2);
  });

  it("splits paid into stayed vs upcoming by check-in date", () => {
    expect(requestStage(req({ status: "confirmed", payment_status: "paid" }), new Map(), TODAY)).toBe(4);
    expect(
      requestStage(req({ status: "confirmed", check_in_date: "2026-12-01" }), new Map(), TODAY)
    ).toBe(3);
  });
});

describe("groupInquiries", () => {
  it("merges same-email requests within the gap and keeps the furthest stage", () => {
    const inquiries = groupInquiries(
      [
        req({ id: "a", room_slug: "economy-room" }),
        req({
          id: "b",
          guest_email: "GUEST@example.com ",
          room_slug: "room-with-private-shower",
          status: "confirmed",
          payment_status: "paid",
          created_at: "2026-08-02T00:00:00.000Z",
        }),
        req({ id: "c", created_at: "2026-10-20T00:00:00.000Z", check_in_date: "2026-11-10" }),
      ],
      new Map(),
      TODAY
    );
    expect(inquiries).toHaveLength(2);
    expect(inquiries[0].requests.map((r) => r.id)).toEqual(["a", "b"]);
    expect(inquiries[0].lead.id).toBe("b");
    expect(inquiries[0].outcome).toBe("stayed");
    expect(inquiries[1].outcome).toBe("open");
  });

  it("labels why past inquiries were lost", () => {
    const outcomes = groupInquiries(
      [
        req({ id: "a", guest_email: "a@x.com" }),
        req({ id: "b", guest_email: "b@x.com" }),
        req({ id: "c", guest_email: "c@x.com", status: "expired", payment_status: "expired" }),
        req({ id: "d", guest_email: "d@x.com", status: "declined" }),
      ],
      new Map([["b", "2026-08-01T01:00:00Z"]]),
      TODAY
    ).map((i) => i.outcome);
    expect(outcomes).toEqual(["no_reply", "went_quiet", "unpaid_link", "declined"]);
  });
});

describe("needsCleanup", () => {
  it("flags past requests left open or awaiting payment", () => {
    expect(needsCleanup(req(), TODAY)).toBe(true);
    expect(needsCleanup(req({ status: "approved", payment_status: "pending" }), TODAY)).toBe(true);
    expect(needsCleanup(req({ status: "confirmed" }), TODAY)).toBe(false);
    expect(needsCleanup(req({ check_in_date: "2026-11-01" }), TODAY)).toBe(false);
  });
});

describe("buildFunnelReport", () => {
  it("builds cumulative stage counts, revenue and timings", () => {
    const report = buildFunnelReport(
      [
        req({ id: "a", guest_email: "a@x.com" }),
        req({
          id: "b",
          guest_email: "b@x.com",
          status: "confirmed",
          payment_status: "paid",
          payment_amount: 355,
          payment_currency: "USD",
          payment_created_at: "2026-08-01T02:00:00Z",
          payment_paid_at: "2026-08-01T05:00:00Z",
        }),
      ],
      new Map([["b", "2026-08-01T02:00:00Z"]]),
      (slug) => slug,
      TODAY
    );
    expect(report.stageCounts).toEqual([2, 1, 1, 1, 1]);
    expect(report.paidRevenueUsd).toBe(355);
    expect(report.medianHoursToReply).toBe(2);
    expect(report.medianHoursLinkToPaid).toBe(3);
    expect(report.byRoom).toEqual([{ label: "economy-room", inquiries: 2, paid: 1 }]);
    expect(report.cleanup.map((r) => r.id)).toEqual(["a"]);
  });
});
