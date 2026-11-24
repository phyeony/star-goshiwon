import { describe, expect, it } from "vitest";
import { checkReply, findAmounts } from "./guard";

const ctx = { allowedAmounts: [11, 70, 15, 16000, 104000], allowedUrls: ["https://goshiwonseoul.com/request-to-book"], forbidden: ["701", "813"] };

describe("guard", () => {
  it("finds USD and KRW amounts", () => {
    expect(findAmounts("$11 a night, ~₩16,000, deposit 70 USD, 100,000 won, 10만원")).toEqual([11, 16000, 70, 100000, 100000]);
  });
  it("passes a clean reply", () => {
    expect(checkReply("It's $11 per night (~₩16,000) plus a $70 deposit.", ctx)).toEqual([]);
  });
  it("flags made-up prices", () => {
    expect(checkReply("For you it's $9 a night.", ctx)).toHaveLength(1);
  });
  it("flags links not on the list and payment links", () => {
    expect(checkReply("Book here: https://example.com/x", ctx)).toHaveLength(1);
    expect(checkReply("Pay at https://paypal.me/x", ctx).length).toBeGreaterThan(0);
    expect(checkReply("Request here: https://goshiwonseoul.com/request-to-book.", ctx)).toEqual([]);
  });
  it("flags room numbers and codes", () => {
    expect(checkReply("Your room is 701 and the key box code is 813.", ctx)).toHaveLength(2);
    expect(checkReply("It's 7 minutes away.", ctx)).toEqual([]);
  });
});

describe("ID documents (WhatsApp policy)", () => {
  const ctx = { allowedAmounts: [], allowedUrls: [], forbidden: [] };
  it("blocks any reply that mentions passports or ID", () => {
    expect(checkReply("Please send a clear photo of your passport here.", ctx)).toContain("mentions ID documents");
    expect(checkReply("Could you share a photo of your ID?", ctx)).toContain("mentions ID documents");
    expect(checkReply("여권 사진 보내주세요", ctx)).toContain("mentions ID documents");
  });
  it("allows the secure-link wording", () => {
    expect(
      checkReply("After your request we'll send a secure link to verify your identity on our website.", ctx),
    ).toEqual([]);
  });
});
