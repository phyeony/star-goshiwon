import { describe, expect, it } from "vitest";
import { calculateEstimate } from "@/lib/pricing";
import { bookingLink, checkAvailability, getQuote } from "./tools";

const rooms = [{ id: "r1", name: "Economy Room", slug: "economy-room", nightly_rate_usd: 11, long_stay_discount: 0.4 }];

describe("getQuote", () => {
  it("matches calculateEstimate", () => {
    const q = getQuote(rooms, "economy-room", "2026-12-01", "2026-12-15", "2026-11-18");
    const est = calculateEstimate({ nightly: 11, discount: 0.4 }, "2026-12-01", "2026-12-15");
    expect(q.ok && q.totalUsd).toBe(est.total);
    expect(q.ok && q.nights).toBe(14);
  });
  it("applies the long-stay discount at 28 nights", () => {
    const q = getQuote(rooms, "economy-room", "2026-12-01", "2026-12-29", "2026-11-18");
    expect(q.ok && q.longStayDiscountUsd).toBe(Math.round(11 * 28 * 0.4));
  });
  it("rejects short, past and unknown requests", () => {
    expect(getQuote(rooms, "economy-room", "2026-12-01", "2026-12-04", "2026-11-18")).toEqual({ ok: false, reason: "too_short" });
    expect(getQuote(rooms, "economy-room", "2026-10-01", "2026-10-20", "2026-11-18")).toEqual({ ok: false, reason: "past" });
    expect(getQuote(rooms, "nope", "2026-12-01", "2026-12-20", "2026-11-18")).toEqual({ ok: false, reason: "unknown_room" });
  });
});

describe("checkAvailability", () => {
  it("returns counts only", async () => {
    const unit = (name: string, blocked: boolean) => ({ id: name, room_id: "r1", name, status: "active", notes: "", sort_order: 0, created_at: "", updated_at: "", room_unit_blocks: blocked ? [{}] : [] });
    const res = await checkAvailability(rooms, async () => [unit("701", false), unit("702", true)] as never, "2026-12-01", "2026-12-20");
    expect(res).toEqual([{ room: "Economy Room", slug: "economy-room", free: 1 }]);
    expect(JSON.stringify(res)).not.toContain("701");
  });
});

describe("bookingLink", () => {
  it("links to the room page or the request page", () => {
    expect(bookingLink("https://goshiwonseoul.com/", "economy-room")).toBe("https://goshiwonseoul.com/rooms/economy-room");
    expect(bookingLink("https://goshiwonseoul.com")).toBe("https://goshiwonseoul.com/request-to-book");
  });
});
