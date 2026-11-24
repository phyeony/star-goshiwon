import { describe, expect, it } from "vitest";
import { isInternalCall } from "./runtime";
import { timingSafeEqual } from "./signature";

const token = "a".repeat(64);

describe("internal token", () => {
  it("accepts only the exact Bearer token", () => {
    expect(isInternalCall(`Bearer ${token}`, token)).toBe(true);
    expect(isInternalCall(`Bearer ${token}x`, token)).toBe(false);
    expect(isInternalCall(`Bearer ${"b".repeat(64)}`, token)).toBe(false);
    expect(isInternalCall(token, token)).toBe(false);
    expect(isInternalCall(null, token)).toBe(false);
  });

  it("refuses every call while the token is unset or too short", () => {
    expect(isInternalCall("Bearer ", "")).toBe(false);
    expect(isInternalCall("Bearer test", "test")).toBe(false);
  });

  it("compares without stopping at the first difference", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });
});
