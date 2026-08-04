import { escapeHtml, wrapEmailHtml } from "../email-html";
import type { DocumentModel } from "./types";

const PDF_HINT = {
  ko: "이 이메일을 브라우저에서 열고 인쇄(Ctrl/Cmd + P)를 누른 뒤 'PDF로 저장'을 선택하시면 문서를 PDF 파일로 보관하실 수 있습니다.",
  en: "To keep a PDF copy, open this email in a browser, press Print (Ctrl/Cmd + P), and choose 'Save as PDF'.",
} as const;

export function documentEmailSubject(model: DocumentModel): string {
  return `${model.title} — ${model.subtitle}`;
}

/**
 * Renders a built document model as the email body. Shares the site email
 * chrome (wrapEmailHtml) with every other outgoing message. The on-screen
 * "missing fields" warning is deliberately never rendered here — it is an
 * admin affordance, not something a guest should see.
 */
export function renderDocumentEmailHtml(model: DocumentModel): string {
  const parts: string[] = [];

  parts.push(
    `<h1 style="margin: 8px 0 4px; font-size: 22px; font-weight: 700; text-align: center;">${escapeHtml(model.title)}</h1>`,
    `<p style="margin: 0 0 24px; font-size: 13px; color: #6b7280; text-align: center;">${escapeHtml(model.subtitle)}</p>`
  );

  for (const section of model.sections) {
    parts.push(
      `<h2 style="margin: 20px 0 8px; font-size: 14px; font-weight: 700; color: #0b1f4d; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">${escapeHtml(section.heading)}</h2>`
    );
    if (section.fields.length > 0) {
      const rows = section.fields
        .map(
          (field) =>
            `<tr><td style="padding: 4px 12px 4px 0; font-size: 13px; color: #6b7280; white-space: nowrap; vertical-align: top;">${escapeHtml(field.label)}</td>` +
            `<td style="padding: 4px 0; font-size: 14px; color: #1f2937;">${escapeHtml(field.value)}</td></tr>`
        )
        .join("");
      parts.push(
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">${rows}</table>`
      );
    }
    for (const paragraph of section.paragraphs) {
      parts.push(
        `<p style="margin: 0 0 8px; font-size: 14px; line-height: 1.55;">${escapeHtml(paragraph)}</p>`
      );
    }
  }

  for (const paragraph of model.statement) {
    parts.push(
      `<p style="margin: 20px 0 0; font-size: 14px; line-height: 1.7;">${escapeHtml(paragraph)}</p>`
    );
  }

  parts.push(
    `<p style="margin: 24px 0 4px; font-size: 14px; text-align: center;">${escapeHtml(model.issueDateLine)}</p>`
  );

  const signatureNote = model.lang === "ko" ? "(서명 또는 인)" : "(signature)";
  for (const signature of model.signatures) {
    parts.push(
      `<p style="margin: 8px 0 0; font-size: 14px; text-align: right;">${escapeHtml(signature.role)}: ${escapeHtml(signature.name)} ${escapeHtml(signatureNote)}</p>`
    );
  }

  parts.push(
    `<p style="margin: 28px 0 0; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; line-height: 1.6;">${escapeHtml(PDF_HINT[model.lang])}</p>`
  );

  return wrapEmailHtml(parts.join("\n"), { preheader: model.title });
}

export function renderDocumentText(model: DocumentModel): string {
  const lines: string[] = [model.title, model.subtitle, ""];

  for (const section of model.sections) {
    lines.push(`[${section.heading}]`);
    for (const field of section.fields) {
      lines.push(`${field.label}: ${field.value}`);
    }
    for (const paragraph of section.paragraphs) {
      lines.push(`- ${paragraph}`);
    }
    lines.push("");
  }

  for (const paragraph of model.statement) {
    lines.push(paragraph, "");
  }

  lines.push(model.issueDateLine);
  for (const signature of model.signatures) {
    lines.push(`${signature.role}: ${signature.name}`);
  }
  lines.push("", PDF_HINT[model.lang]);

  return lines.join("\n");
}

/**
 * Email body for an uploaded HTML template. The template body is already
 * HTML (sanitized at save time), so it is injected as-is rather than escaped.
 */
export function renderTemplateEmailHtml(
  title: string,
  bodyHtml: string,
  lang: "ko" | "en"
): string {
  return wrapEmailHtml(
    [
      `<h1 style="margin: 8px 0 20px; font-size: 22px; font-weight: 700; text-align: center;">${escapeHtml(title)}</h1>`,
      `<div style="font-size: 14px; line-height: 1.7; color: #1f2937;">${bodyHtml}</div>`,
      `<p style="margin: 28px 0 0; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; line-height: 1.6;">${escapeHtml(PDF_HINT[lang])}</p>`,
    ].join("\n"),
    { preheader: title }
  );
}

/** Plain-text fallback for an uploaded HTML template. */
export function renderTemplateText(
  title: string,
  bodyHtml: string,
  lang: "ko" | "en"
): string {
  const text = bodyHtml
    .replace(/<\/(p|div|h[1-6]|tr|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return [title, "", text, "", PDF_HINT[lang]].join("\n");
}
