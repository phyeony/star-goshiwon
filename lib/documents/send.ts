import { sendEmail } from "../email";
import { createEmailSend, getBookingRequestById } from "../queries";
import {
  documentEmailSubject,
  renderDocumentEmailHtml,
  renderDocumentText,
  renderTemplateEmailHtml,
  renderTemplateText,
} from "./email-html";
import { ISSUER } from "./issuer";
import { getDocumentTemplate } from "./queries";
import { resolveDocument } from "./resolve";
import type { DocumentLang, DocumentType, GuestDocumentForm } from "./types";

export interface SendDocumentInput {
  requestId: string;
  type: DocumentType;
  lang: DocumentLang;
  /** Ephemeral guest legal fields — arrive in the request body, never persisted as columns. */
  form: GuestDocumentForm;
  sentByEmail: string;
}

export type SendDocumentResult =
  | { status: "sent"; emailSendId: string; to: string; subject: string }
  | { status: "not_found" }
  | { status: "send_failed"; error: string };

/**
 * Builds the document (uploaded template if one exists, built-in otherwise),
 * emails it to the guest, and records the audit row. Shared by the admin
 * route and the E2E fixture route so both exercise the same path. Guest legal
 * fields are never logged.
 */
export async function sendDocumentEmail(
  input: SendDocumentInput
): Promise<SendDocumentResult> {
  const request = await getBookingRequestById(input.requestId);
  if (!request) return { status: "not_found" };

  const template = await getDocumentTemplate(input.type, input.lang);
  const resolved = resolveDocument(
    template,
    input.type,
    request,
    input.form,
    ISSUER,
    input.lang
  );

  const subject =
    resolved.kind === "model"
      ? documentEmailSubject(resolved.model)
      : `${resolved.title} — ${ISSUER[input.lang === "ko" ? "businessNameKo" : "businessNameEn"]}`;
  const html =
    resolved.kind === "model"
      ? renderDocumentEmailHtml(resolved.model)
      : renderTemplateEmailHtml(resolved.title, resolved.html, input.lang);
  const text =
    resolved.kind === "model"
      ? renderDocumentText(resolved.model)
      : renderTemplateText(resolved.title, resolved.html, input.lang);

  let sendError: string | null = null;
  try {
    await sendEmail(request.guest_email, subject, text, html);
  } catch (err) {
    sendError = err instanceof Error ? err.message : "send_failed";
    console.error("send-document failed:", sendError);
  }

  let emailSendId = "";
  try {
    const row = await createEmailSend({
      booking_request_id: request.id,
      kind: "document",
      template_slug: `document_${input.type}`,
      template_locale: input.lang,
      subject,
      body_text: text,
      body_html: html,
      sent_by_email: input.sentByEmail,
      sent_to_email: request.guest_email,
      send_status: sendError ? "failed" : "sent",
      send_error: sendError ?? "",
    });
    emailSendId = row.id;
  } catch (err) {
    console.error("send-document audit insert failed:", err);
  }

  if (sendError) return { status: "send_failed", error: sendError };
  return { status: "sent", emailSendId, to: request.guest_email, subject };
}
