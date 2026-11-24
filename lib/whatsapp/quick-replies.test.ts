import { describe, expect, it } from "vitest";
import { verificationMessage } from "@/lib/passport/messages";
import { LINK_PLACEHOLDER, QUICK_REPLIES, canSendText, quickReply } from "./quick-replies";

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
    expect(quickReply("men_only")?.asksMenOnly).toBe(true);
    expect(quickReply("nope")).toBeUndefined();
  });

  it("the verification reply carries the upload link and never names an ID document", () => {
    const r = quickReply("verification")!;
    expect(r.sendsVerificationLink).toBe(true);
    expect(r.text).toBe(verificationMessage(LINK_PLACEHOLDER));
    const sent = verificationMessage("https://staging.goshiwonseoul.com/verify/abc");
    expect(sent).toContain("https://staging.goshiwonseoul.com/verify/abc");
    expect(sent).not.toMatch(/passport|\bid\b|identity|여권|신분증/i);
  });

  it("every link reply sends the real link, never an ID word", () => {
    const linkReplies = QUICK_REPLIES.filter((q) => q.sendsVerificationLink);
    expect(linkReplies.map((q) => q.key)).toEqual(["verification", "id_not_here"]);
    for (const q of linkReplies) {
      expect(q.text).toBe(q.withLink!(LINK_PLACEHOLDER));
      const sent = q.withLink!("https://example.com/verify/x");
      expect(sent).toContain("https://example.com/verify/x");
      expect(sent).not.toMatch(/passport|\bid\b|identity|여권|신분증/i);
    }
  });
});
