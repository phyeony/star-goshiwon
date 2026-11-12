import { describe, expect, it } from "vitest";
import {
  addMonths,
  buildKakaoMessage,
  formatManwon,
  normalizeKoreanMobile,
} from "./ko-site";
import { koBookingRequestSchema } from "./validation";

describe("formatManwon", () => {
  it("formats whole and half 만원 amounts", () => {
    expect(formatManwon(350000)).toBe("35만원");
    expect(formatManwon(355000)).toBe("35.5만원");
    expect(formatManwon(1200000)).toBe("120만원");
  });
});

describe("normalizeKoreanMobile", () => {
  it("accepts common spellings", () => {
    expect(normalizeKoreanMobile("01012345678")).toBe("010-1234-5678");
    expect(normalizeKoreanMobile("010 1234 5678")).toBe("010-1234-5678");
    expect(normalizeKoreanMobile("011-123-4567")).toBe("011-123-4567");
  });
  it("rejects non-mobile numbers", () => {
    expect(normalizeKoreanMobile("02-123-4567")).toBeNull();
    expect(normalizeKoreanMobile("1234")).toBeNull();
  });
});

describe("addMonths", () => {
  it("adds calendar months", () => {
    expect(addMonths("2026-12-01", 3)).toBe("2027-03-01");
  });
  it("clamps to the last day of shorter months", () => {
    expect(addMonths("2027-01-31", 1)).toBe("2027-02-28");
  });
});

describe("buildKakaoMessage", () => {
  it("lists the booking details", () => {
    const msg = buildKakaoMessage({
      roomName: "샤워실 포함",
      moveInDate: "2026-12-01",
      stayMonths: 3,
      guestName: "홍길동",
      guestPhone: "010-1234-5678",
      requestId: "abcdef12-3456",
    });
    expect(msg).toContain("방: 샤워실 포함");
    expect(msg).toContain("입실 희망일: 12월 1일");
    expect(msg).toContain("기간: 3개월");
    expect(msg).toContain("요청 번호: abcdef12");
  });
});

describe("koBookingRequestSchema", () => {
  const valid = {
    guest_name: "홍길동",
    guest_phone: "010-1234-5678",
    room_slug: "economy-room",
    move_in_date: "2099-01-01",
    stay_months: 3,
    privacy_accepted: true,
    men_only_acknowledged: true,
    policies_accepted: true,
  };
  it("accepts a complete request", () => {
    expect(koBookingRequestSchema.safeParse(valid).success).toBe(true);
  });
  it("requires privacy, men-only and policy consent", () => {
    for (const key of ["privacy_accepted", "men_only_acknowledged", "policies_accepted"]) {
      expect(koBookingRequestSchema.safeParse({ ...valid, [key]: false }).success).toBe(false);
    }
  });
  it("rejects past move-in dates and bad phones", () => {
    expect(
      koBookingRequestSchema.safeParse({ ...valid, move_in_date: "2020-01-01" }).success
    ).toBe(false);
    expect(
      koBookingRequestSchema.safeParse({ ...valid, guest_phone: "02-123-4567" }).success
    ).toBe(false);
  });
});
