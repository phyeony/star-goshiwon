import { describe, expect, it } from "vitest";
import { bookingRequestSchema } from "@/lib/validation";
import { chatStatus, type AdminMessage, type AdminRun } from "./admin-queries";
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

  it("is optional", () => {
    const r = bookingRequestSchema.safeParse(base);
    expect(r.success && r.data.whatsapp_number).toBe(null);
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
