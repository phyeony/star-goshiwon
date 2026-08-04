import { sanitizeTemplateHtml } from "./templates";

export interface DocxConversionResult {
  html: string;
  /** Conversion notes from mammoth (unsupported styles, dropped images, …). */
  warnings: string[];
}

/**
 * Converts an uploaded .docx to template HTML.
 *
 * Fidelity is approximate by design: headings, paragraphs, lists, and simple
 * tables survive; text boxes, columns, and exact fonts do not. The admin
 * previews and edits the result before saving.
 *
 * Isolated in this module so the whole DOCX path can be removed in one file
 * if the Workers runtime ever rejects mammoth — pasting HTML keeps working.
 */
export async function convertDocxToHtml(
  bytes: ArrayBuffer
): Promise<DocxConversionResult> {
  // Imported lazily so the parser is only pulled in when an upload actually
  // happens, and never on the request paths that just render documents.
  const mammoth = await import("mammoth");
  const result = await mammoth.convertToHtml({
    buffer: Buffer.from(bytes),
  });

  return {
    html: sanitizeTemplateHtml(result.value),
    warnings: result.messages
      .filter((m) => m.type === "warning" || m.type === "error")
      .map((m) => m.message),
  };
}
