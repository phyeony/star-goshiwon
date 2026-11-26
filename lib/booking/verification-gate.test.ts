import { describe, expect, it } from "vitest";
import { needsVerification } from "./verification-gate";

describe("approval waits for verification", () => {
  it("blocks English-site requests until the photo is checked", () => {
    expect(needsVerification({ locale: "en", passport_checked_at: null })).toBe(true);
    expect(needsVerification({ locale: null })).toBe(true);
    expect(needsVerification({ locale: "en", passport_checked_at: "2026-11-26T00:00:00Z" })).toBe(false);
  });
  it("doesn't apply to Korean-site requests", () => {
    expect(needsVerification({ locale: "ko", passport_checked_at: null })).toBe(false);
  });
});
