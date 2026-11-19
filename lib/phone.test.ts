import { describe, expect, it } from "vitest";
import { normalizeE164 } from "./phone";

describe("normalizeE164", () => {
  it.each([
    ["+44 7700 900123", "+447700900123"],
    ["+1 (415) 555-0100", "+14155550100"],
    ["0044 7700 900123", "+447700900123"],
    ["010-1234-5678", "+821012345678"],
    ["+82 010 1234 5678", "+821012345678"],
    ["+82-10-1234-5678", "+821012345678"],
  ])("%s → %s", (input, want) => {
    expect(normalizeE164(input)).toBe(want);
  });

  it.each(["", "7700 900123", "+44", "abc", "+44 7700+900123", "+0 123456789", "+1234567890123456"])(
    "rejects %j",
    (input) => {
      expect(normalizeE164(input)).toBeNull();
    },
  );
});
