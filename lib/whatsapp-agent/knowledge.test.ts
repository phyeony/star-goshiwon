import { describe, expect, it } from "vitest";
import { deriveTier } from "@/lib/pricing";
import { guides } from "@/lib/guides";
import { buildKnowledgePack } from "./knowledge";
import { policiesPlainText } from "./policies-text";
import { policiesText } from "./policies-plain";

const rooms = [{ name: "Economy Room", slug: "economy-room", nightly_rate_usd: 11, long_stay_discount: 0.4 }];

describe("knowledge pack", () => {
  const input = { rooms, economyTier: deriveTier(11, 0.4), policiesText: policiesPlainText(40), guides, siteUrl: "https://goshiwonseoul.com" };

  it("is deterministic", () => {
    expect(buildKnowledgePack(input)).toBe(buildKnowledgePack(input));
  });

  it("contains the key facts", () => {
    const pack = buildKnowledgePack(input);
    expect(pack).toContain("Men-only");
    expect(pack).toContain("$11 per night");
    expect(pack).toContain("$70");
    expect(pack).toContain("3 PM");
    expect(pack).toContain("5 business days after checkout");
    expect(pack).toContain("## 15. Updates to These Policies");
  });

  it("policies text keeps the discount from the page", () => {
    expect(policiesPlainText(40)).toContain("40% long-stay discount");
    expect(policiesPlainText(40)).not.toContain("<");
  });
});

describe("pre-rendered policies (used by the live agent)", () => {
  it("matches the /policies page; run `pnpm gen:policies-text` if this fails", () => {
    expect(policiesText(40)).toBe(policiesPlainText(40));
    expect(policiesText(35)).toBe(policiesPlainText(35));
  });
});
