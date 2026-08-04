import { describe, expect, it } from "vitest";
import {
  documentEmailSubject,
  renderDocumentEmailHtml,
  renderDocumentText,
  renderTemplateEmailHtml,
  renderTemplateText,
} from "./email-html";
import type { DocumentModel } from "./types";

const model: DocumentModel = {
  type: "letter",
  lang: "ko",
  title: "체류(숙소) 확인서",
  subtitle: "스타고시원",
  sections: [
    {
      heading: "체류자 정보",
      fields: [
        { label: "성명", value: "Jane Traveler" },
        { label: "여권번호", value: "M12345678" },
      ],
      paragraphs: [],
    },
    {
      heading: "이용 규칙",
      fields: [],
      paragraphs: ["객실 내 흡연 <금지>"],
    },
  ],
  statement: ["위 사람은 실제로 체류하고 있음을 확인합니다."],
  issueDateLine: "발급일: 2026년 8월 4일",
  signatures: [{ role: "대표자", name: "홍길동", showStamp: true }],
  missingFields: [],
};

describe("documentEmailSubject", () => {
  it("combines the title and issuer", () => {
    expect(documentEmailSubject(model)).toBe("체류(숙소) 확인서 — 스타고시원");
  });
});

describe("renderDocumentEmailHtml", () => {
  it("renders the title, fields, paragraphs, and signature", () => {
    const html = renderDocumentEmailHtml(model);

    expect(html).toContain("체류(숙소) 확인서");
    expect(html).toContain("여권번호");
    expect(html).toContain("M12345678");
    expect(html).toContain("발급일: 2026년 8월 4일");
    expect(html).toContain("홍길동");
  });

  it("escapes HTML in document values", () => {
    const html = renderDocumentEmailHtml(model);
    expect(html).toContain("객실 내 흡연 &lt;금지&gt;");
    expect(html).not.toContain("<금지>");
  });

  it("includes a save-as-PDF hint in the document language", () => {
    expect(renderDocumentEmailHtml(model)).toContain("PDF로 저장");
    expect(renderDocumentEmailHtml({ ...model, lang: "en" })).toContain(
      "Save as PDF"
    );
  });

  it("never leaks the missing-field warning into the email", () => {
    const html = renderDocumentEmailHtml({
      ...model,
      missingFields: ["여권번호"],
    });
    expect(html).not.toContain("필수 정보 누락");
  });
});

describe("renderDocumentText", () => {
  it("renders a readable plain-text fallback", () => {
    const text = renderDocumentText(model);

    expect(text).toContain("체류(숙소) 확인서");
    expect(text).toContain("성명: Jane Traveler");
    expect(text).toContain("여권번호: M12345678");
    expect(text).toContain("발급일: 2026년 8월 4일");
    // No HTML tags leak in — literal angle brackets in the document text
    // (e.g. "흡연 <금지>") are content and must survive.
    expect(text).not.toMatch(/<\/?(p|div|table|tr|td|h[1-6]|span)\b/i);
    expect(text).toContain("객실 내 흡연 <금지>");
  });
});

describe("renderTemplateEmailHtml", () => {
  it("injects template HTML unescaped and keeps the PDF hint", () => {
    const html = renderTemplateEmailHtml(
      "숙소 이용 계약서",
      "<p>이용자: Jane</p><table><tr><td>보증금</td></tr></table>",
      "ko"
    );

    expect(html).toContain("<p>이용자: Jane</p>");
    expect(html).toContain("<table>");
    expect(html).toContain("PDF로 저장");
  });

  it("escapes the title even when the body is raw HTML", () => {
    const html = renderTemplateEmailHtml("<script>x</script>", "<p>ok</p>", "en");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>x</script>");
  });
});

describe("renderTemplateText", () => {
  it("strips tags and decodes entities", () => {
    const text = renderTemplateText(
      "Accommodation Agreement",
      "<h1>Terms</h1><p>Guest: Jane &amp; Co.</p><p>Room&nbsp;301</p>",
      "en"
    );

    expect(text).toContain("Terms");
    expect(text).toContain("Guest: Jane & Co.");
    expect(text).toContain("Room 301");
    expect(text).not.toContain("<");
    expect(text).toContain("Save as PDF");
  });
});
