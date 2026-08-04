import { describe, expect, it } from "vitest";
import {
  buildContract,
  buildDocument,
  buildLetter,
  formatDocumentDate,
} from "./build";
import { ISSUER } from "./issuer";
import { EMPTY_DOCUMENT_FORM, type GuestDocumentForm } from "./types";
import type { BookingRequestWithRoom } from "../types";

export const fixtureBooking = {
  id: "req-1",
  guest_name: "Jane Traveler",
  guest_email: "jane@example.com",
  guest_count: 1,
  room_id: "room-1",
  assigned_room_unit_id: "unit-1",
  room_slug: "room-with-private-shower",
  check_in_date: "2026-06-01",
  check_out_date: "2026-07-01",
  estimated_total: 700,
  bedding_prepaid: true,
  payment_status: "paid",
  payment_provider: "paypal",
  payment_order_id: null,
  payment_capture_id: null,
  payment_approval_url: null,
  payment_amount: 700,
  payment_currency: "USD",
  payment_created_at: null,
  payment_paid_at: null,
  payment_expires_at: null,
  payment_token_hash: null,
  payment_token_created_at: null,
  payment_error: "",
  refund_amount: 0,
  refunded_at: null,
  refund_id: null,
  notes: "",
  status: "confirmed",
  admin_notes: "",
  created_at: "2026-05-01T00:00:00.000Z",
  updated_at: "2026-05-01T00:00:00.000Z",
  rooms: {
    name: "Room with Private Shower",
    name_ko: "샤워실 있는 방",
    slug: "room-with-private-shower",
    nightly_rate_usd: 21,
    long_stay_discount: 0.15,
  },
  room_units: { name: "301" },
} as BookingRequestWithRoom;

export const fixtureForm: GuestDocumentForm = {
  ...EMPTY_DOCUMENT_FORM,
  passportNumber: "M12345678",
  nationality: "United States",
  dateOfBirth: "1995-03-14",
  homeAddress: "1 Main St, Springfield, USA",
  specialTerms: "",
  issueDate: "2026-08-04",
};

const fieldValue = (
  model: { sections: { fields: { label: string; value: string }[] }[] },
  label: string
) => model.sections.flatMap((s) => s.fields).find((f) => f.label === label)?.value;

describe("formatDocumentDate", () => {
  it("formats Korean dates", () => {
    expect(formatDocumentDate("2026-06-01", "ko")).toBe("2026년 6월 1일");
  });

  it("formats English dates", () => {
    expect(formatDocumentDate("2026-06-01", "en")).toBe("1 June 2026");
  });

  it("returns an empty string for a blank input", () => {
    expect(formatDocumentDate("", "ko")).toBe("");
  });
});

describe("buildLetter", () => {
  it("builds the Korean letter with guest, stay, and issuer facts", () => {
    const model = buildLetter(fixtureBooking, fixtureForm, ISSUER, "ko");

    expect(model.type).toBe("letter");
    expect(model.title).toBe("체류(숙소) 확인서");

    expect(fieldValue(model, "성명")).toBe("Jane Traveler");
    expect(fieldValue(model, "국적")).toBe("United States");
    expect(fieldValue(model, "여권번호")).toBe("M12345678");
    expect(fieldValue(model, "생년월일")).toBe("1995년 3월 14일");
    expect(fieldValue(model, "객실")).toBe("샤워실 있는 방 (301)");
    expect(fieldValue(model, "체류 기간")).toBe(
      "2026년 6월 1일 ~ 2026년 7월 1일 (30박)"
    );
    expect(fieldValue(model, "사업자등록번호")).toBe(ISSUER.registrationNumber);
    expect(model.issueDateLine).toBe("발급일: 2026년 8월 4일");
    expect(model.signatures).toHaveLength(1);
    expect(model.missingFields).toEqual([]);
  });

  it("builds the English letter with the English room name", () => {
    const model = buildLetter(fixtureBooking, fixtureForm, ISSUER, "en");

    expect(model.title).toBe("Accommodation (Residence) Confirmation");
    expect(fieldValue(model, "Room")).toBe("Room with Private Shower (301)");
    expect(fieldValue(model, "Period of stay")).toBe(
      "1 June 2026 – 1 July 2026 (30 nights)"
    );
    expect(model.issueDateLine).toBe("Date of issue: 4 August 2026");
  });

  it("falls back to the room slug and blanks missing optional data", () => {
    const booking = {
      ...fixtureBooking,
      rooms: null,
      room_units: null,
    } as BookingRequestWithRoom;
    const model = buildLetter(booking, fixtureForm, ISSUER, "en");

    expect(fieldValue(model, "Room")).toBe("room-with-private-shower");
  });

  it("reports blank required guest fields instead of throwing", () => {
    const model = buildLetter(
      fixtureBooking,
      { ...EMPTY_DOCUMENT_FORM, issueDate: "2026-08-04" },
      ISSUER,
      "ko"
    );

    expect(model.missingFields).toEqual(["여권번호", "국적", "생년월일"]);
    expect(fieldValue(model, "여권번호")).toBe("—");
  });
});

describe("buildContract", () => {
  it("builds the Korean contract with parties, pricing, and rules", () => {
    const model = buildContract(fixtureBooking, fixtureForm, ISSUER, "ko");

    expect(model.type).toBe("contract");
    expect(model.title).toBe("숙소 이용 계약서");

    expect(fieldValue(model, "이용자 성명")).toBe("Jane Traveler");
    expect(fieldValue(model, "여권번호")).toBe("M12345678");
    expect(fieldValue(model, "본국 주소")).toBe("1 Main St, Springfield, USA");
    expect(fieldValue(model, "객실")).toBe("샤워실 있는 방 (301)");
    expect(fieldValue(model, "이용 기간")).toBe(
      "2026년 6월 1일 ~ 2026년 7월 1일 (30박)"
    );
    expect(fieldValue(model, "이용 요금 총액")).toBe("$700");
    expect(fieldValue(model, "보증금")).toBe("$70");
    expect(fieldValue(model, "침구 세트")).toBe("포함 (선결제)");

    expect(model.signatures.map((s) => s.role)).toEqual(["대표자", "이용자"]);
    expect(model.signatures[1].name).toBe("Jane Traveler");
  });

  it("states that the agreement is not a residential lease", () => {
    const ko = buildContract(fixtureBooking, fixtureForm, ISSUER, "ko");
    const en = buildContract(fixtureBooking, fixtureForm, ISSUER, "en");

    const koText = ko.sections.flatMap((s) => s.paragraphs).join(" ");
    const enText = en.sections.flatMap((s) => s.paragraphs).join(" ");

    expect(koText).toContain("주택임대차보호법");
    expect(ko.title).not.toContain("임대차계약서");
    expect(enText).toContain("not a residential lease");
    expect(en.title).toBe("Accommodation Agreement");
  });

  it("omits the special-terms section when none are given", () => {
    const without = buildContract(fixtureBooking, fixtureForm, ISSUER, "ko");
    expect(without.sections.some((s) => s.heading === "특약사항")).toBe(false);

    const withTerms = buildContract(
      fixtureBooking,
      { ...fixtureForm, specialTerms: "퇴실 시 열쇠 반납" },
      ISSUER,
      "ko"
    );
    const section = withTerms.sections.find((s) => s.heading === "특약사항");
    expect(section?.paragraphs).toEqual(["퇴실 시 열쇠 반납"]);
  });

  it("reports the home address as missing when blank", () => {
    const model = buildContract(
      fixtureBooking,
      { ...fixtureForm, homeAddress: "" },
      ISSUER,
      "ko"
    );
    expect(model.missingFields).toContain("본국 주소");
  });
});

describe("buildDocument", () => {
  it("dispatches on document type", () => {
    expect(
      buildDocument("letter", fixtureBooking, fixtureForm, ISSUER, "ko").type
    ).toBe("letter");
    expect(
      buildDocument("contract", fixtureBooking, fixtureForm, ISSUER, "ko").type
    ).toBe("contract");
  });
});
