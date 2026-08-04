import type { BookingRequestWithRoom, DocumentTemplate } from "../types";
import { buildDocument, missingDocumentFields } from "./build";
import type { Issuer } from "./issuer";
import {
  buildDocumentVarMap,
  renderTemplateBody,
  unknownTokens,
} from "./templates";
import type {
  DocumentLang,
  DocumentModel,
  DocumentType,
  GuestDocumentForm,
} from "./types";

/**
 * A document ready to render. Either the code-built structured model or an
 * admin-uploaded HTML template with its tokens filled in. Every surface —
 * preview, print route, email — goes through this one seam.
 */
export type ResolvedDocument =
  | {
      kind: "model";
      title: string;
      model: DocumentModel;
      missingFields: string[];
      unknownTokens: string[];
    }
  | {
      kind: "html";
      title: string;
      html: string;
      missingFields: string[];
      unknownTokens: string[];
    };

/**
 * Pure: the caller fetches the template (or null) and passes it in. A null
 * template — never uploaded, or deleted — falls back to the built-in
 * document, so the feature always has something valid to render.
 */
export function resolveDocument(
  template: DocumentTemplate | null,
  type: DocumentType,
  booking: BookingRequestWithRoom,
  form: GuestDocumentForm,
  issuer: Issuer,
  lang: DocumentLang
): ResolvedDocument {
  const missingFields = missingDocumentFields(type, form, lang);

  if (!template || !template.body_html.trim()) {
    const model = buildDocument(type, booking, form, issuer, lang);
    return {
      kind: "model",
      title: model.title,
      model,
      missingFields,
      unknownTokens: [],
    };
  }

  const vars = buildDocumentVarMap(booking, form, issuer, lang);
  const title = template.title.trim()
    ? renderTemplateBody(template.title, vars)
    : buildDocument(type, booking, form, issuer, lang).title;

  return {
    kind: "html",
    title,
    html: renderTemplateBody(template.body_html, vars),
    missingFields,
    unknownTokens: unknownTokens(
      `${template.title}\n${template.body_html}`,
      vars
    ),
  };
}
