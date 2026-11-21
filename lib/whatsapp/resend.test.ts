import { describe, expect, it, vi } from "vitest";
import { resendRun, type ResendDeps } from "./resend";

const now = new Date("2026-11-21T12:00:00Z");

function deps(over: Partial<ResendDeps> = {}): ResendDeps {
  return {
    getRun: async () => ({ conversation_id: "c1", outgoing: "We're near Noryangjin Station.", send_error: "HTTP 500" }),
    claimConversation: async () => ({
      id: "c1",
      wa_phone: "447700900123",
      booking_request_id: null,
      men_only_state: "confirmed",
      bot_state: "active",
      paused_until: null,
      after_hours_notice_at: null,
    }),
    releaseConversation: vi.fn(async () => {}),
    lastGuestMessageAt: async () => "2026-11-21T11:00:00Z",
    stillPending: async () => true,
    sendText: vi.fn(async () => "wamid.R"),
    insertOutbound: vi.fn(async () => {}),
    markResent: vi.fn(async () => {}),
    ...over,
  };
}

describe("resendRun", () => {
  it("resends the failed reply, marks it answered and stores it", async () => {
    const d = deps();
    expect(await resendRun(d, "run1", now)).toEqual({ status: "sent" });
    expect(d.sendText).toHaveBeenCalledWith("447700900123", "We're near Noryangjin Station.");
    expect(d.markResent).toHaveBeenCalledWith("run1", now);
    expect(d.insertOutbound).toHaveBeenCalledWith("c1", "wamid.R", "We're near Noryangjin Station.", now);
    expect(d.releaseConversation).toHaveBeenCalled();
  });

  it("refuses what can't or shouldn't be resent", async () => {
    expect(await resendRun(deps({ getRun: async () => null }), "x", now)).toEqual({ status: "not_found" });
    const sentFine = deps({ getRun: async () => ({ conversation_id: "c1", outgoing: "Hi", send_error: null }) });
    expect(await resendRun(sentFine, "r", now)).toEqual({ status: "nothing_to_resend" });
    expect(await resendRun(deps({ stillPending: async () => false }), "r", now)).toEqual({ status: "nothing_to_resend" });
    expect(await resendRun(deps({ claimConversation: async () => null }), "r", now)).toEqual({ status: "busy" });
    const old = deps({ lastGuestMessageAt: async () => "2026-11-20T11:00:00Z" });
    expect(await resendRun(old, "r", now)).toEqual({ status: "window_closed" });
    expect(old.sendText).not.toHaveBeenCalled();
  });

  it("reports a second failure and changes nothing", async () => {
    const d = deps({ sendText: vi.fn(async () => Promise.reject(new Error("HTTP 401"))) });
    expect(await resendRun(d, "r", now)).toEqual({ status: "send_failed", detail: "HTTP 401" });
    expect(d.markResent).not.toHaveBeenCalled();
    expect(d.releaseConversation).toHaveBeenCalled();
  });
});
