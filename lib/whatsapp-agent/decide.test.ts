import { describe, expect, it } from "vitest";
import { decide, nextMenOnlyState, type DecideInput } from "./decide";
import { CATEGORIES, type Category, type Understanding } from "./types";

const allOn = Object.fromEntries(CATEGORIES.map((c) => [c, true])) as Record<Category, boolean>;

function u(over: Partial<Understanding> = {}): Understanding {
  return {
    categories: ["location"],
    needs_human: false,
    men_only_signal: "none",
    guest_language: "en",
    room_slug: null,
    check_in: null,
    check_out: null,
    reason_ko: "없음",
    summary_ko: "",
    guest_message_ko: "",
    ...over,
  };
}

function input(over: Partial<DecideInput> = {}, state: Partial<DecideInput["state"]> = {}): DecideInput {
  return {
    settings: { mode: "live", autoSend: allOn },
    state: { menOnlyState: "confirmed", botState: "active", isFirstContact: false, linkedBooking: null, ...state },
    understanding: u(),
    facts: { hasQuote: false, freeRooms: null },
    guardProblems: [],
    ...over,
  };
}

const confirmedBooking = { status: "confirmed" as const, check_in_date: "2026-12-01", check_out_date: "2026-12-31", room_name: "Economy Room" };

describe("men-only state", () => {
  it("moves through asked → confirmed / not_eligible", () => {
    expect(nextMenOnlyState("unasked", true, "none")).toBe("asked");
    expect(nextMenOnlyState("asked", false, "confirmed")).toBe("confirmed");
    expect(nextMenOnlyState("asked", false, "declined")).toBe("not_eligible");
    expect(nextMenOnlyState("asked", false, "none")).toBe("asked");
    expect(nextMenOnlyState("confirmed", false, "declined")).toBe("confirmed");
  });
});

describe("decide", () => {
  it("sends a safe answer and marks read", () => {
    const d = decide(input());
    expect(d).toMatchObject({ outcome: "send", markRead: true, appendMenOnlyCheck: false });
  });

  it("first contact with a safe question: answers and appends the men-only check", () => {
    const d = decide(input({}, { menOnlyState: "unasked", isFirstContact: true }));
    expect(d).toMatchObject({ outcome: "send", appendMenOnlyCheck: true, newMenOnlyState: "asked" });
  });

  it("first contact with a handoff question: sends only the check and leaves it unread", () => {
    const d = decide(input({ understanding: u({ categories: ["special_request"] }) }, { menOnlyState: "unasked", isFirstContact: true }));
    expect(d).toMatchObject({ outcome: "send_check_only", markRead: false });
  });

  it("guest saying it's for a woman gets the decline", () => {
    const d = decide(input({ understanding: u({ categories: ["men_only"], men_only_signal: "declined" }) }, { menOnlyState: "asked" }));
    expect(d).toMatchObject({ outcome: "send_decline", newMenOnlyState: "not_eligible", markRead: true });
  });

  it("nothing more is sent in a not-eligible chat", () => {
    expect(decide(input({}, { menOnlyState: "not_eligible" })).outcome).toBe("draft");
  });

  it("batching: one handoff part makes the whole turn a handoff", () => {
    const d = decide(input({ understanding: u({ categories: ["pricing", "special_request"] }) }));
    expect(d.outcome).toBe("draft");
    expect(d.markRead).toBe(false);
  });

  it("needs_human, non-English, and guard problems all hand off", () => {
    expect(decide(input({ understanding: u({ needs_human: true }) })).outcome).toBe("draft");
    expect(decide(input({ understanding: u({ guest_language: "ko" }) })).outcome).toBe("draft");
    expect(decide(input({ guardProblems: ["amount not from the site"] })).outcome).toBe("draft");
  });

  it("availability: sends only if a room is free", () => {
    const q = u({ categories: ["availability"] });
    expect(decide(input({ understanding: q, facts: { hasQuote: false, freeRooms: 2 } })).outcome).toBe("send");
    expect(decide(input({ understanding: q, facts: { hasQuote: false, freeRooms: 0 } })).outcome).toBe("draft");
    // No dates yet: the reply asks for them.
    expect(decide(input({ understanding: q })).outcome).toBe("send");
  });

  it("short stays are answered automatically", () => {
    expect(decide(input({ understanding: u({ categories: ["short_stay"] }) })).outcome).toBe("send");
  });

  it("shadow mode, paused bot, and switched-off category never send", () => {
    expect(decide(input({ settings: { mode: "shadow", autoSend: allOn } })).outcome).toBe("draft");
    expect(decide(input({}, { botState: "paused_by_manager" })).outcome).toBe("draft");
    expect(decide(input({ settings: { mode: "live", autoSend: { ...allOn, location: false } } })).outcome).toBe("draft");
    expect(decide(input({}, { botState: "off" })).outcome).toBe("skip");
  });

  it("model failure hands off", () => {
    expect(decide(input({ understanding: null })).outcome).toBe("draft");
  });

  describe("confirmed guests", () => {
    const st = { linkedBooking: confirmedBooking, menOnlyState: "unasked" as const };
    it("get generic answers without the men-only check", () => {
      expect(decide(input({}, st))).toMatchObject({ outcome: "send", appendMenOnlyCheck: false });
    });
    it("get a price only with a computed quote", () => {
      const q = u({ categories: ["pricing"] });
      expect(decide(input({ understanding: q, facts: { hasQuote: true, freeRooms: null } }, st)).outcome).toBe("send");
      expect(decide(input({ understanding: q }, st)).outcome).toBe("draft");
    });
    it("hand off extensions, complaints and booking questions", () => {
      for (const c of ["availability", "booking_how_to", "complaint", "booking_status"] as const) {
        expect(decide(input({ understanding: u({ categories: [c] }) }, st)).outcome).toBe("draft");
      }
    });
    it("asking for a residence confirmation sends the 'being prepared' note", () => {
      expect(decide(input({ understanding: u({ categories: ["residence_document"] }) }, st)).outcome).toBe("send_document_pending");
    });
  });
});
