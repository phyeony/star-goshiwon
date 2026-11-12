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
    bi: "체류확인서 Confirmation of Residence",
  },
  contract: {
    ko: "숙소이용계약서",
    en: "Accommodation Agreement",
    bi: "숙소이용계약서 Accommodation Agreement",
  },
  receipt: {
    ko: "숙박료영수증",
    en: "Accommodation Payment Receipt",
    bi: "숙박료영수증 Accommodation Payment Receipt",
  },
};

const DOCUMENT_TYPES: DocumentType[] = ["letter", "contract", "receipt"];
const DOCUMENT_LANGS: DocumentLang[] = ["ko", "en", "bi"];

function parseType(value: string | undefined): DocumentType {
  return DOCUMENT_TYPES.includes(value as DocumentType)
    ? (value as DocumentType)
    : "letter";
}

function parseLang(value: string | undefined): DocumentLang {
  return DOCUMENT_LANGS.includes(value as DocumentLang)
    ? (value as DocumentLang)
    : "ko";
}

/**
 * The browser's Save-as-PDF uses document.title as the default filename.
 * Without this the file lands as the site's default metadata title.
 */
export async function generateMetadata({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const type: DocumentType = parseType(query.type);
  const lang: DocumentLang = parseLang(query.lang);
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

  const type: DocumentType = parseType(query.type);
  const lang: DocumentLang = parseLang(query.lang);
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
