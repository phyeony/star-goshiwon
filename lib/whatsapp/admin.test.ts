import { describe, expect, it } from "vitest";
import { bookingRequestSchema } from "@/lib/validation";
import {
  chatStatus,
  datesToCheck,
  seoulMonthStart,
  summarizeFreeRooms,
  summarizeUsage,
  type AdminMessage,
  type AdminRun,
} from "./admin-queries";
import { estimateCostUsd } from "@/lib/whatsapp-agent/model-prices";
import { reasonLabel } from "./admin-labels";

const msg = (sender: AdminMessage["sender"], at: string, handled = true): AdminMessage => ({
  id: at,
  direction: sender === "guest" ? "in" : "out",
  sender,
  message_type: "text",
  body: "x",
  handled_at: handled ? at : null,
  run_id: null,
  sent_at: at,
});
const run = (outcome: string, at: string, extra: Partial<AdminRun> = {}) =>
  ({ id: "r", conversation_id: "c", outcome, created_at: at, error: null, send_error: null, ...extra }) as AdminRun;

describe("chatStatus", () => {
  it("guest messages the AI hasn't reached yet are processing", () => {
    expect(chatStatus([msg("guest", "2026-11-19T01:00:00Z", false)], null)).toBe("processing");
  });

  it("a handoff with nobody writing since needs a reply", () => {
    const m = [msg("guest", "2026-11-19T01:00:00Z")];
    expect(chatStatus(m, run("draft", "2026-11-19T01:01:00Z"))).toBe("needs_reply");
    // the after-hours line doesn't count as an answer
    expect(chatStatus([...m, msg("bot", "2026-11-19T01:01:00Z")], run("draft", "2026-11-19T01:01:00Z"))).toBe(
      "needs_reply",
    );
  });

  it("a manager reply after the handoff answers it", () => {
    const m = [msg("guest", "2026-11-19T01:00:00Z"), msg("manager", "2026-11-19T02:00:00Z")];
    expect(chatStatus(m, run("draft", "2026-11-19T01:01:00Z"))).toBe("answered");
  });

  it("an auto-answer is answered, a failed send is not", () => {
    const m = [msg("guest", "2026-11-19T01:00:00Z"), msg("bot", "2026-11-19T01:01:00Z")];
    expect(chatStatus(m, run("send", "2026-11-19T01:01:00Z"))).toBe("answered");
    expect(chatStatus(m.slice(0, 1), run("send", "2026-11-19T01:01:00Z", { send_error: "HTTP 500" }))).toBe(
      "needs_reply",
    );
  });
});

describe("reasonLabel", () => {
  it("translates code reasons", () => {
    expect(reasonLabel("needs manager: complaint")).toBe("매니저 필요: 불편·고장");
    expect(reasonLabel("not in English")).toBe("영어가 아님");
    expect(reasonLabel("something new")).toBe("something new");
  });
});

describe("booking form WhatsApp number", () => {
  const base = {
    guest_name: "Alex Kim",
    guest_email: "alex@example.com",
    guest_count: 1,
    room_slug: "economy-room",
    check_in_date: "2099-01-01",
    check_out_date: "2099-01-15",
    policies_accepted: true,
    men_only_acknowledged: true,
  };

  it("is required", () => {
    for (const whatsapp_number of [undefined, "", "   "]) {
      const r = bookingRequestSchema.safeParse({ ...base, whatsapp_number });
      expect(r.success).toBe(false);
      expect(!r.success && r.error.issues[0].path).toEqual(["whatsapp_number"]);
    }
  });

  it("opt-in defaults to off", () => {
    const r = bookingRequestSchema.safeParse({ ...base, whatsapp_number: "+44 7700 900123" });
    expect(r.success && r.data.whatsapp_opt_in).toBe(false);
  });

  it("is stored as E.164, matching Meta's sender id with a +", () => {
    const r = bookingRequestSchema.safeParse({ ...base, whatsapp_number: "+44 7700 900-123" });
    expect(r.success && r.data.whatsapp_number).toBe("+447700900123");
  });

  it("asks for the country code when it's missing", () => {
    const r = bookingRequestSchema.safeParse({ ...base, whatsapp_number: "7700 900123" });
    expect(r.success).toBe(false);
    expect(!r.success && r.error.issues[0].path).toEqual(["whatsapp_number"]);
  });
});

describe("AI usage", () => {
  it("prices a run from its label, cached tokens at the cached rate", () => {
    // 1,000,000 input of which 400,000 cached, 100,000 output on GPT-6 Luna
    const c = estimateCostUsd("openai/gpt-6-luna", { input: 1_000_000, cachedInput: 400_000, output: 100_000 });
    expect(c).toBeCloseTo(0.06 + 0.004 + 0.05, 10);
    expect(estimateCostUsd("someone/unknown-model", { input: 1, cachedInput: 0, output: 1 })).toBeNull();
  });

  it("adds up only runs that called the model, and lists unpriced models", () => {
    const since = new Date("2026-10-31T15:00:00Z");
    const s = summarizeUsage(
      [
        { model: "openai/gpt-6-luna", input_tokens: 2000, cached_input_tokens: 1000, output_tokens: 200 },
        { model: "openai/gpt-6-luna", input_tokens: 0, cached_input_tokens: 0, output_tokens: 0 },
        { model: "x/new-model", input_tokens: 500, cached_input_tokens: 0, output_tokens: 50 },
      ],
      since,
    );
    expect(s.turns).toBe(2);
    expect(s.inputTokens).toBe(2500);
    expect(s.outputTokens).toBe(250);
    expect(s.unpricedModels).toEqual(["x/new-model"]);
    expect(s.costUsd).toBeCloseTo((1000 * 0.1 + 1000 * 0.01 + 200 * 0.5) / 1e6, 12);
  });

  it("starts the month at midnight Korea time", () => {
    expect(seoulMonthStart(new Date("2026-11-21T08:00:00Z")).toISOString()).toBe("2026-10-31T15:00:00.000Z");
    // 1 Dec 03:00 KST is still 30 Nov in UTC, but already December here
    expect(seoulMonthStart(new Date("2026-11-30T18:00:00Z")).toISOString()).toBe("2026-11-30T15:00:00.000Z");
  });
});

describe("free rooms on the chat page", () => {
  const block = (guest: string, id: string | null) =>
    ({ guest_name: guest, booking_request_id: id, status: "confirmed", source: "direct" }) as never;
  const unit = (name: string, blocks: unknown[] = []) => ({ name, room_unit_blocks: blocks }) as never;

  it("lists free and taken rooms per type, the asked-about type first", () => {
    const types = summarizeFreeRooms(
      [
        { id: "r1", slug: "economy-room", name: "Economy" },
        { id: "r2", slug: "shower-room", name: "Shower" },
      ],
      { r1: [unit("501"), unit("502", [block("Kim", "b1")])], r2: [unit("601")] },
      "shower-room",
    );
    expect(types.map((t) => t.slug)).toEqual(["shower-room", "economy-room"]);
    expect(types[1]).toMatchObject({ freeCount: 1, units: [{ name: "501", free: true }, { name: "502", free: false }] });
    expect(types[1].units[1].takenBy[0]).toMatchObject({ guestName: "Kim", bookingRequestId: "b1" });
  });

  it("checks the dates the guest asked about last, else the linked booking", () => {
    const withDates = (ci: string | null, co: string | null, slug: string | null = null) =>
      ({ understanding: { check_in: ci, check_out: co, room_slug: slug } }) as AdminRun;
    const booking = { check_in_date: "2027-01-01", check_out_date: "2027-01-10" };
    expect(datesToCheck([withDates("2026-12-01", "2026-12-15", "economy-room"), withDates(null, null)], booking)).toEqual({
      checkIn: "2026-12-01",
      checkOut: "2026-12-15",
      roomSlug: "economy-room",
      from: "guest",
    });
    expect(datesToCheck([withDates(null, null)], booking)).toMatchObject({ checkIn: "2027-01-01", from: "booking" });
    expect(datesToCheck([], null)).toBeNull();
  });
});
