import { describe, expect, it } from "vitest";
import {
  buildContract,
  buildDocument,
  buildLetter,
  formatDocumentDate,
} from "./build";
import { ISSUER } from "./issuer";
import { EMPTY_DOCUMENT_FORM } from "./types";
import type { BookingRequestWithRoom } from "../types";
import {
  CURRENT_POLICY_VERSION,
  formatPolicyDate,
} from "../policy-versions";
import { BEDDING_FEE_USD, DEPOSIT_USD, formatUSD } from "../pricing";
import { siteConfig, stayTimes } from "../site-data";
import { fixtureBooking, fixtureForm } from "./test-fixtures";

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

describe("contract terms vs. /policies", () => {
  const paragraphsOf = (model: { sections: { paragraphs: string[] }[] }) =>
    model.sections.flatMap((s) => s.paragraphs).join(" ");

  it("carries every policy section, in both languages", () => {
    const ko = buildContract(fixtureBooking, fixtureForm, ISSUER, "ko");
    const en = buildContract(fixtureBooking, fixtureForm, ISSUER, "en");

    expect(ko.sections.map((s) => s.heading)).toEqual(
      expect.arrayContaining([
        "취소 및 환불",
        "보증금",
        "이용 규칙",
        "계약 해지 및 퇴거",
        "기타 약정",
        "약관의 적용",
      ])
    );
    expect(en.sections.map((s) => s.heading)).toEqual(
      expect.arrayContaining([
        "Cancellation and refunds",
        "Deposit",
        "House rules",
        "Termination and eviction",
        "Other terms",
        "Governing terms",
      ])
    );
  });

  it("prints the full refund tier table", () => {
    const model = buildContract(fixtureBooking, fixtureForm, ISSUER, "ko");

    expect(fieldValue(model, "체크인 30일 이상 전")).toBe("100%");
    expect(fieldValue(model, "체크인 15~29일 전")).toBe("90% (10% 행정 수수료)");
    expect(fieldValue(model, "체크인 8~14일 전")).toBe("70%");
    expect(fieldValue(model, "체크인 1~7일 전")).toBe("50%");
    expect(fieldValue(model, "체크인 당일 / 노쇼")).toBe("0%");
  });

  it("quotes the deposit and bedding fees from the pricing constants", () => {
    const text = paragraphsOf(
      buildContract(fixtureBooking, fixtureForm, ISSUER, "en")
    );
    expect(text).toContain(formatUSD(DEPOSIT_USD));
    expect(text).toContain(formatUSD(BEDDING_FEE_USD));
  });

  // Regression: the old wording banned smoking only 객실 내, while /policies
  // bans it building-wide. A contract narrower than the policy is unenforceable
  // beyond what it states, so the two must agree.
  it("bans smoking building-wide, not just in the room", () => {
    expect(
      paragraphsOf(buildContract(fixtureBooking, fixtureForm, ISSUER, "ko"))
    ).toContain("건물 내부 전 구역에서 흡연이 금지");
    expect(
      paragraphsOf(buildContract(fixtureBooking, fixtureForm, ISSUER, "en"))
    ).toContain("Smoking is prohibited everywhere inside the building");
  });

  it("incorporates the policies by URL and by the version in force at booking", () => {
    const model = buildContract(fixtureBooking, fixtureForm, ISSUER, "en");
    const clause = model.sections.find((s) => s.heading === "Governing terms");

    expect(clause?.paragraphs[0]).toContain(`${siteConfig.url}/policies`);
    expect(clause?.paragraphs[0]).toContain(
      formatPolicyDate(CURRENT_POLICY_VERSION.effectiveFrom, "en")
    );
    expect(clause?.paragraphs[0]).toContain("form part of this agreement");
  });

  it("links the Korean contract to the Korean policy page", () => {
    const model = buildContract(fixtureBooking, fixtureForm, ISSUER, "ko");
    const clause = model.sections.find((s) => s.heading === "약관의 적용");
    expect(clause?.paragraphs[0]).toContain(`${siteConfig.url}/policies/ko`);
  });

  it("quotes the shared check-in and check-out times", () => {
    expect(
      paragraphsOf(buildContract(fixtureBooking, fixtureForm, ISSUER, "ko"))
    ).toContain(`체크인은 ${stayTimes.checkInKo}`);
    expect(
      paragraphsOf(buildContract(fixtureBooking, fixtureForm, ISSUER, "en"))
    ).toContain(`Check-in is at ${stayTimes.checkInEn}`);
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
