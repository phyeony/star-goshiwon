import { describe, expect, it } from "vitest";
import {
  buildDocumentVarMap,
  contractWordingWarnings,
  renderTemplateBody,
  sanitizeTemplateHtml,
  unknownTokens,
} from "./templates";
import { ISSUER } from "./issuer";
import { fixtureBooking, fixtureForm } from "./test-fixtures";

const vars = buildDocumentVarMap(fixtureBooking, fixtureForm, ISSUER, "ko");

describe("buildDocumentVarMap", () => {
  it("exposes booking, form, and issuer values as tokens", () => {
    expect(vars.guest_name).toBe("Jane Traveler");
    expect(vars.room_name).toBe("샤워실 있는 방 (301)");
    expect(vars.period).toBe("2026년 6월 1일 ~ 2026년 7월 1일 (30박)");
    expect(vars.passport_number).toBe("M12345678");
    expect(vars.date_of_birth).toBe("1995년 3월 14일");
    expect(vars.total_usd).toBe("$700");
    expect(vars.deposit_usd).toBe("$70");
    expect(vars.issuer_registration_number).toBe(ISSUER.registrationNumber);
  });

  it("uses English formatting for the English variant", () => {
    const en = buildDocumentVarMap(fixtureBooking, fixtureForm, ISSUER, "en");
    expect(en.room_name).toBe("Room with Private Shower (301)");
    expect(en.period).toBe("1 June 2026 – 1 July 2026 (30 nights)");
  });

  it("leaves blank ephemeral fields empty rather than dashed", () => {
    const blank = buildDocumentVarMap(
      fixtureBooking,
      { ...fixtureForm, passportNumber: "", dateOfBirth: "" },
      ISSUER,
      "ko"
    );
    expect(blank.passport_number).toBe("");
    expect(blank.date_of_birth).toBe("");
  });
});

describe("renderTemplateBody", () => {
  it("substitutes known tokens", () => {
    const html = renderTemplateBody(
      "<p>이용자: {{guest_name}} / 객실: {{room_name}}</p>",
      vars
    );
    expect(html).toBe("<p>이용자: Jane Traveler / 객실: 샤워실 있는 방 (301)</p>");
  });

  it("leaves unknown tokens visible so typos surface in the preview", () => {
    const html = renderTemplateBody("<p>{{guest_nmae}}</p>", vars);
    expect(html).toBe("<p>{{guest_nmae}}</p>");
  });
});

describe("unknownTokens", () => {
  it("lists tokens no variable will fill", () => {
    expect(
      unknownTokens("<p>{{guest_name}} {{guest_nmae}} {{room_no}}</p>", vars)
    ).toEqual(["guest_nmae", "room_no"]);
  });

  it("returns an empty list when every token is known", () => {
    expect(unknownTokens("<p>{{guest_name}}</p>", vars)).toEqual([]);
  });
});

describe("sanitizeTemplateHtml", () => {
  it("strips script and style blocks with their contents", () => {
    const html = sanitizeTemplateHtml(
      "<p>ok</p><script>alert(1)</script><style>p{color:red}</style>"
    );
    expect(html).toBe("<p>ok</p>");
  });

  it("strips inline event handlers", () => {
    const html = sanitizeTemplateHtml(`<p onclick="alert(1)">hi</p>`);
    expect(html).toBe("<p>hi</p>");
  });

  it("neutralises javascript: URLs", () => {
    const html = sanitizeTemplateHtml(`<a href="javascript:alert(1)">x</a>`);
    expect(html).toContain('href="#"');
    expect(html).not.toContain("javascript:");
  });

  it("keeps ordinary document markup intact", () => {
    const source =
      '<h1>숙소 이용 계약서</h1><p style="text-align:center">본문</p><table><tr><td>보증금</td></tr></table>';
    expect(sanitizeTemplateHtml(source)).toBe(source);
  });
});

describe("contractWordingWarnings", () => {
  it("warns when a contract is worded as a residential lease", () => {
    const warnings = contractWordingWarnings(
      "contract",
      "주택임대차계약서",
      "<p>본 계약은 주택임대차보호법에 따른다</p>"
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("임대차계약서");
  });

  it("warns when the non-lease clause is missing", () => {
    const warnings = contractWordingWarnings(
      "contract",
      "숙소 이용 계약서",
      "<p>이용자는 객실을 사용한다</p>"
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("조항이 보이지 않습니다");
  });

  it("stays silent on a well-formed contract", () => {
    expect(
      contractWordingWarnings(
        "contract",
        "숙소 이용 계약서",
        "<p>본 계약은 숙박시설 이용 계약으로, 주택임대차보호법상의 임대차계약이 아닙니다.</p>"
      )
    ).toEqual([]);
  });

  it("accepts the English non-lease wording", () => {
    expect(
      contractWordingWarnings(
        "contract",
        "Accommodation Agreement",
        "<p>This agreement is not a residential lease under Korean law.</p>"
      )
    ).toEqual([]);
  });

  it("never warns about letters", () => {
    expect(contractWordingWarnings("letter", "체류 확인서", "<p>x</p>")).toEqual(
      []
    );
  });
});
