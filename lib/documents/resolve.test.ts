import { describe, expect, it } from "vitest";
import { resolveDocument } from "./resolve";
import { ISSUER } from "./issuer";
import { fixtureBooking, fixtureForm } from "./test-fixtures";
import { EMPTY_DOCUMENT_FORM } from "./types";
import type { DocumentTemplate } from "../types";

const template: DocumentTemplate = {
  id: "tpl-1",
  type: "contract",
  lang: "ko",
  title: "숙소 이용 계약서 ({{issuer_name}})",
  body_html:
    "<p>이용자: {{guest_name}} / 여권: {{passport_number}}</p><p>객실: {{room_name}}</p>",
  source_filename: "계약서.docx",
  updated_at: "2026-08-05T00:00:00.000Z",
  updated_by_email: "admin@example.com",
};

describe("resolveDocument", () => {
  it("falls back to the built-in document when there is no template", () => {
    const resolved = resolveDocument(
      null,
      "contract",
      fixtureBooking,
      fixtureForm,
      ISSUER,
      "ko"
    );

    expect(resolved.kind).toBe("model");
    expect(resolved.title).toBe("숙소 이용 계약서");
    if (resolved.kind === "model") {
      expect(resolved.model.sections.length).toBeGreaterThan(0);
    }
  });

  it("falls back when a template row exists but its body is empty", () => {
    const resolved = resolveDocument(
      { ...template, body_html: "   " },
      "contract",
      fixtureBooking,
      fixtureForm,
      ISSUER,
      "ko"
    );
    expect(resolved.kind).toBe("model");
  });

  it("renders the uploaded template with tokens filled in", () => {
    const resolved = resolveDocument(
      template,
      "contract",
      fixtureBooking,
      fixtureForm,
      ISSUER,
      "ko"
    );

    expect(resolved.kind).toBe("html");
    expect(resolved.title).toBe("숙소 이용 계약서 (스타고시원)");
    if (resolved.kind === "html") {
      expect(resolved.html).toContain("이용자: Jane Traveler");
      expect(resolved.html).toContain("여권: M12345678");
      expect(resolved.html).toContain("객실: 샤워실 있는 방 (301)");
      expect(resolved.html).not.toContain("{{");
    }
  });

  it("reports unknown tokens from the template", () => {
    const resolved = resolveDocument(
      { ...template, body_html: "<p>{{guest_name}} {{room_nmae}}</p>" },
      "contract",
      fixtureBooking,
      fixtureForm,
      ISSUER,
      "ko"
    );
    expect(resolved.unknownTokens).toEqual(["room_nmae"]);
  });

  it("reports missing ephemeral fields for templates too", () => {
    const resolved = resolveDocument(
      template,
      "contract",
      fixtureBooking,
      { ...EMPTY_DOCUMENT_FORM, issueDate: "2026-08-05" },
      ISSUER,
      "ko"
    );
    expect(resolved.missingFields).toEqual([
      "여권번호",
      "국적",
      "생년월일",
      "본국 주소",
    ]);
  });

  it("falls back to the built-in title when the template title is blank", () => {
    const resolved = resolveDocument(
      { ...template, title: "" },
      "contract",
      fixtureBooking,
      fixtureForm,
      ISSUER,
      "ko"
    );
    expect(resolved.title).toBe("숙소 이용 계약서");
  });
});
