"use client";

import { useState } from "react";
import {
  DocumentTemplateEditor,
  type SlotDescriptor,
} from "@/components/admin/document-template-editor";
import type { DocumentLang, DocumentType } from "@/lib/documents/types";
import type { DocumentTemplate } from "@/lib/types";

export const DOCUMENT_SLOTS: SlotDescriptor[] = [
  {
    type: "letter",
    lang: "ko",
    label: "체류 확인서 (한국어)",
    builtInTitle: "체류(숙소) 확인서",
  },
  {
    type: "letter",
    lang: "en",
    label: "체류 확인서 (English)",
    builtInTitle: "Accommodation (Residence) Confirmation",
  },
  {
    type: "contract",
    lang: "ko",
    label: "이용 계약서 (한국어)",
    builtInTitle: "숙소 이용 계약서",
  },
  {
    type: "contract",
    lang: "en",
    label: "이용 계약서 (English)",
    builtInTitle: "Accommodation Agreement",
  },
];

/**
 * One card for all four document slots. The type/lang toggles mirror the
 * 문서 발급 card on the request detail page, so the admin picks a template the
 * same way they pick a document to issue.
 */
export function DocumentTemplateManager({
  templates,
}: {
  templates: DocumentTemplate[];
}) {
  const [type, setType] = useState<DocumentType>("contract");
  const [lang, setLang] = useState<DocumentLang>("ko");
  const [dirty, setDirty] = useState(false);

  const slot =
    DOCUMENT_SLOTS.find((s) => s.type === type && s.lang === lang) ??
    DOCUMENT_SLOTS[0];
  const template =
    templates.find((t) => t.type === type && t.lang === lang) ?? null;

  function hasTemplate(t: DocumentType, l: DocumentLang) {
    return templates.some((x) => x.type === t && x.lang === l);
  }

  /** Switching slots remounts the editor, so unsaved edits need a warning. */
  function switchTo(nextType: DocumentType, nextLang: DocumentLang) {
    if (nextType === type && nextLang === lang) return;
    if (
      dirty &&
      !window.confirm(
        "저장하지 않은 변경 사항이 있습니다. 다른 양식으로 이동하면 사라집니다. 계속하시겠습니까?"
      )
    ) {
      return;
    }
    setDirty(false);
    setType(nextType);
    setLang(nextLang);
  }

  const toggleBase = "px-3 py-1.5 text-sm font-medium transition-colors";
  const dot = (active: boolean) =>
    `ml-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${
      active ? "bg-indigo-400" : "bg-transparent"
    }`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 max-w-3xl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            type="button"
            onClick={() => switchTo("letter", lang)}
            className={`${toggleBase} ${type === "letter" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            체류 확인서
            <span className={dot(hasTemplate("letter", lang))} />
          </button>
          <button
            type="button"
            onClick={() => switchTo("contract", lang)}
            className={`${toggleBase} border-l border-gray-300 ${type === "contract" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            이용 계약서
            <span className={dot(hasTemplate("contract", lang))} />
          </button>
        </div>

        <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            type="button"
            onClick={() => switchTo(type, "ko")}
            className={`${toggleBase} ${lang === "ko" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            한국어
            <span className={dot(hasTemplate(type, "ko"))} />
          </button>
          <button
            type="button"
            onClick={() => switchTo(type, "en")}
            className={`${toggleBase} border-l border-gray-300 ${lang === "en" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            English
            <span className={dot(hasTemplate(type, "en"))} />
          </button>
        </div>

        {dirty && (
          <span className="text-xs text-amber-700">저장하지 않은 변경 사항</span>
        )}
      </div>

      <p className="text-xs text-gray-500 -mt-2">
        점이 표시된 항목은 사용자 양식이 등록되어 있습니다.
      </p>

      <div className="border-t border-gray-200 pt-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          {slot.label}
        </h2>
        {/* Keyed so switching slots resets the editor to that template. */}
        <DocumentTemplateEditor
          key={`${slot.type}-${slot.lang}`}
          slot={slot}
          template={template}
          onDirtyChange={setDirty}
        />
      </div>
    </div>
  );
}
