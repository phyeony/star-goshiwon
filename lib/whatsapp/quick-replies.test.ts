import { describe, expect, it } from "vitest";
import { QUICK_REPLIES, canSendText, quickReply } from "./quick-replies";

describe("quick replies", () => {
  const now = new Date("2026-11-21T12:00:00Z");

  it("only allows a normal text inside the guest's 24-hour window", () => {
    expect(canSendText("2026-11-21T02:00:00Z", now)).toBe(true);
    expect(canSendText("2026-11-20T12:05:00Z", now)).toBe(false); // too close to the edge
    expect(canSendText(null, now)).toBe(false);
    expect(canSendText("garbage", now)).toBe(false);
  });

  it("has unique keys and English text with nothing to fill in", () => {
    const keys = QUICK_REPLIES.map((q) => q.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const q of QUICK_REPLIES) expect(q.text).not.toMatch(/\{\{|[가-힣]/);
    // WhatsApp policy: no gender question, no ID request.
    expect(quickReply("men_only")).toBeUndefined();
    for (const q of QUICK_REPLIES) expect(q.text).not.toMatch(/passport|\bmale\b|men only/i);
    expect(quickReply("nope")).toBeUndefined();
  });
});
