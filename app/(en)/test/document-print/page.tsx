import { notFound } from "next/navigation";
import { DocumentView } from "@/components/documents/document-view";
import { ISSUER } from "@/lib/documents/issuer";
import { resolveDocument } from "@/lib/documents/resolve";
import { fixtureBooking, fixtureForm } from "@/lib/documents/test-fixtures";
import type { DocumentLang, DocumentType } from "@/lib/documents/types";

export const dynamic = "force-dynamic";

/**
 * E2E-only mirror of /admin/requests/[id]/documents/print.
 *
 * The real print route sits behind Supabase admin auth, which Playwright
 * cannot complete, so print layout had no automated coverage — and shipped
 * with text running off the page edge. This page renders the same component
 * tree from a fixture (no DB), surrounded by the same kinds of chrome the
 * real page has, so the print CSS can be asserted. 404s outside the harness.
 */
export default async function TestDocumentPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; lang?: string }>;
}) {
  if (process.env.E2E_TEST_MODE !== "true") notFound();

  const query = await searchParams;
  const type: DocumentType = query.type === "contract" ? "contract" : "letter";
  const lang: DocumentLang = query.lang === "en" ? "en" : "ko";

  const resolved = resolveDocument(
    null,
    type,
    fixtureBooking,
    fixtureForm,
    ISSUER,
    lang
  );

  return (
    <>
      {/* Stands in for AdminNav — lives outside the print root, must not print. */}
      <div data-testid="page-chrome" className="border-b p-4">
        관리자 메뉴
      </div>

      <main className="document-print-root bg-white min-h-screen p-8">
        <div className="print:hidden mb-4 flex justify-end">
          <button type="button" data-testid="print-button">
            인쇄 / PDF 저장
          </button>
        </div>
        {/* A stray form control inside the print root: must never reach paper. */}
        <input
          data-testid="stray-input"
          aria-label="stray"
          defaultValue="should not print"
        />
        <DocumentView resolved={resolved} />
      </main>
    </>
  );
}
