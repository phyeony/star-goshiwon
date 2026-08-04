"use client";

import { useEffect, useState } from "react";
import { DocumentView } from "@/components/documents/document-view";
import { documentDraftKey } from "@/components/admin/documents-card";
import { ISSUER } from "@/lib/documents/issuer";
import { resolveDocument } from "@/lib/documents/resolve";
import {
  EMPTY_DOCUMENT_FORM,
  type DocumentLang,
  type DocumentType,
  type GuestDocumentForm,
} from "@/lib/documents/types";
import type { BookingRequestWithRoom, DocumentTemplate } from "@/lib/types";

interface Props {
  request: BookingRequestWithRoom;
  template: DocumentTemplate | null;
  type: DocumentType;
  lang: DocumentLang;
}

export function DocumentPrintClient({
  request,
  template,
  type,
  lang,
}: Props) {
  // The form lives in sessionStorage so passport data never travels in a URL.
  // Opened directly (no draft), the document still renders with blanks.
  const [form, setForm] = useState<GuestDocumentForm | null>(null);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(documentDraftKey(request.id));
    if (!raw) {
      setForm({ ...EMPTY_DOCUMENT_FORM });
      return;
    }
    try {
      setForm({
        ...EMPTY_DOCUMENT_FORM,
        ...(JSON.parse(raw) as Partial<GuestDocumentForm>),
      });
    } catch {
      setForm({ ...EMPTY_DOCUMENT_FORM });
    }
  }, [request.id]);

  // Open the print dialog once the document is on screen.
  useEffect(() => {
    if (!form) return;
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, [form]);

  if (!form) return null;

  const resolved = resolveDocument(
    template,
    type,
    request,
    form,
    ISSUER,
    lang
  );

  return (
    <>
      {resolved.missingFields.length > 0 && (
        <div className="print:hidden mx-auto w-full max-w-[210mm] mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          필수 정보 누락: {resolved.missingFields.join(", ")} — 요청 상세
          페이지의 문서 발급 카드에서 입력한 뒤 다시 열어 주세요.
        </div>
      )}
      <div className="print:hidden mx-auto w-full max-w-[210mm] mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          인쇄 / PDF 저장
        </button>
      </div>
      <DocumentView resolved={resolved} />
    </>
  );
}
