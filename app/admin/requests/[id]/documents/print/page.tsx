import { notFound } from "next/navigation";
import { getBookingRequestById } from "@/lib/queries";
import { getDocumentTemplate } from "@/lib/documents/queries";
import { DocumentPrintClient } from "@/components/admin/document-print-client";
import type { DocumentLang, DocumentType } from "@/lib/documents/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string; lang?: string }>;
}

const PRINT_TITLES: Record<DocumentType, Record<DocumentLang, string>> = {
  letter: {
    ko: "체류확인서",
    en: "Accommodation Residence Confirmation",
  },
  contract: {
    ko: "숙소이용계약서",
    en: "Accommodation Agreement",
  },
};

/**
 * The browser's Save-as-PDF uses document.title as the default filename.
 * Without this the file lands as the site's default metadata title.
 */
export async function generateMetadata({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const type: DocumentType = query.type === "contract" ? "contract" : "letter";
  const lang: DocumentLang = query.lang === "en" ? "en" : "ko";
  const request = await getBookingRequestById(id);

  const base = PRINT_TITLES[type][lang];
  return {
    title: request ? `${base} - ${request.guest_name}` : base,
  };
}

export default async function DocumentPrintPage({
  params,
  searchParams,
}: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const request = await getBookingRequestById(id);
  if (!request) notFound();

  const type: DocumentType = query.type === "contract" ? "contract" : "letter";
  const lang: DocumentLang = query.lang === "en" ? "en" : "ko";
  const template = await getDocumentTemplate(type, lang);

  return (
    // document-print-root drives the @media print rules in globals.css: only
    // this subtree reaches the PDF, and @page supplies the page margins.
    <main className="document-print-root bg-white min-h-screen p-8">
      <DocumentPrintClient
        request={request}
        template={template}
        type={type}
        lang={lang}
      />
    </main>
  );
}
