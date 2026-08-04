"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminModal } from "@/components/admin/admin-modal";
import { DocumentView } from "@/components/documents/document-view";
import { ISSUER } from "@/lib/documents/issuer";
import { resolveDocument } from "@/lib/documents/resolve";
import {
  EMPTY_DOCUMENT_FORM,
  type DocumentLang,
  type DocumentType,
  type GuestDocumentForm,
} from "@/lib/documents/types";
import type { BookingRequestWithRoom, DocumentTemplate } from "@/lib/types";

type SendState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success" }
  | { kind: "error"; message: string };

/** sessionStorage key holding the ephemeral guest legal fields for one booking. */
export function documentDraftKey(requestId: string) {
  return `goshiwon:document-draft:${requestId}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  request: BookingRequestWithRoom;
  templates: DocumentTemplate[];
}

export function DocumentsCard({ request, templates }: Props) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<DocumentType>("letter");
  const [lang, setLang] = useState<DocumentLang>("ko");
  const [form, setForm] = useState<GuestDocumentForm>({
    ...EMPTY_DOCUMENT_FORM,
    issueDate: todayIso(),
  });
  const [send, setSend] = useState<SendState>({ kind: "idle" });

  // Restore any draft typed earlier in this browser session.
  useEffect(() => {
    const raw = window.sessionStorage.getItem(documentDraftKey(request.id));
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as Partial<GuestDocumentForm>;
      setForm((prev) => ({ ...prev, ...saved }));
    } catch {
      // Corrupt draft — ignore and keep the empty form.
    }
  }, [request.id]);

  // Mirror the draft so the print route (a separate tab) can read it.
  useEffect(() => {
    window.sessionStorage.setItem(
      documentDraftKey(request.id),
      JSON.stringify(form)
    );
  }, [form, request.id]);

  const template = useMemo(
    () => templates.find((t) => t.type === type && t.lang === lang) ?? null,
    [templates, type, lang]
  );

  const resolved = useMemo(
    () => resolveDocument(template, type, request, form, ISSUER, lang),
    [template, type, request, form, lang]
  );

  function update(patch: Partial<GuestDocumentForm>) {
    setForm((prev) => ({ ...prev, ...patch }));
    setSend({ kind: "idle" });
  }

  function openPrintView() {
    window.open(
      `/admin/requests/${request.id}/documents/print?type=${type}&lang=${lang}`,
      "_blank",
      "noopener"
    );
  }

  async function handleSend() {
    setSend({ kind: "sending" });
    try {
      const res = await fetch(
        `/api/admin/requests/${request.id}/send-document`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, lang, form }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSend({ kind: "error", message: body?.error || `HTTP ${res.status}` });
        return;
      }
      setSend({ kind: "success" });
    } catch (err) {
      setSend({ kind: "error", message: (err as Error).message });
    }
  }

  const toggleBase = "px-3 py-1.5 text-sm font-medium transition-colors";
  const inputClass =
    "block w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

  const editor = (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            type="button"
            onClick={() => setType("letter")}
            className={`${toggleBase} ${type === "letter" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            체류 확인서
          </button>
          <button
            type="button"
            onClick={() => setType("contract")}
            className={`${toggleBase} border-l border-gray-300 ${type === "contract" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            이용 계약서
          </button>
        </div>

        <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            type="button"
            onClick={() => setLang("ko")}
            className={`${toggleBase} ${lang === "ko" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            한국어
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`${toggleBase} border-l border-gray-300 ${lang === "en" ? "bg-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            English
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        {template
          ? `업로드한 양식(${template.source_filename || "직접 편집"})으로 발급됩니다. 아래 정보는 저장되지 않습니다.`
          : "기본 양식으로 발급됩니다. 아래 정보는 저장되지 않으며, 브라우저를 닫으면 사라집니다."}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="doc-passport"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            여권번호
          </label>
          <input
            id="doc-passport"
            type="text"
            value={form.passportNumber}
            onChange={(e) => update({ passportNumber: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="doc-nationality"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            국적
          </label>
          <input
            id="doc-nationality"
            type="text"
            value={form.nationality}
            onChange={(e) => update({ nationality: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="doc-dob"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            생년월일
          </label>
          <input
            id="doc-dob"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => update({ dateOfBirth: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="doc-issue-date"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            발급일
          </label>
          <input
            id="doc-issue-date"
            type="date"
            value={form.issueDate}
            onChange={(e) => update({ issueDate: e.target.value })}
            className={inputClass}
          />
        </div>
        {type === "contract" && (
          <>
            <div className="sm:col-span-2">
              <label
                htmlFor="doc-home-address"
                className="block text-xs font-bold text-gray-700 uppercase mb-1"
              >
                본국 주소
              </label>
              <input
                id="doc-home-address"
                type="text"
                value={form.homeAddress}
                onChange={(e) => update({ homeAddress: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="doc-special-terms"
                className="block text-xs font-bold text-gray-700 uppercase mb-1"
              >
                특약사항
              </label>
              <textarea
                id="doc-special-terms"
                rows={3}
                value={form.specialTerms}
                onChange={(e) => update({ specialTerms: e.target.value })}
                className={inputClass}
              />
            </div>
          </>
        )}
      </div>

      {resolved.missingFields.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          필수 정보 누락: {resolved.missingFields.join(", ")}
        </div>
      )}
      {resolved.unknownTokens.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          양식에 알 수 없는 항목이 있습니다:{" "}
          {resolved.unknownTokens.map((t) => `{{${t}}}`).join(", ")} —{" "}
          <Link href="/admin/document-templates" className="underline">
            양식 관리
          </Link>
          에서 확인해 주세요.
        </div>
      )}

      {send.kind === "success" && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          문서를 {request.guest_email}로 발송했습니다. 이메일 기록에서 확인할 수
          있습니다.
        </div>
      )}
      {send.kind === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          발송 실패: {send.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={openPrintView}
          className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
        >
          인쇄 / PDF 저장
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={send.kind === "sending"}
          className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {send.kind === "sending" ? "발송 중..." : "게스트에게 발송"}
        </button>
      </div>
    </div>
  );

  const preview = (
    <div className="flex flex-col lg:h-full">
      <div className="text-xs font-bold text-gray-700 uppercase mb-1">
        미리보기
      </div>
      <div className="border border-gray-200 rounded-lg bg-gray-50 overflow-y-auto lg:flex-1 max-h-[60vh]">
        <div className="origin-top scale-[0.72] w-[139%]">
          <DocumentView resolved={resolved} />
        </div>
      </div>
    </div>
  );

  const customCount = templates.length;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">문서 발급</h2>
          <Link
            href="/admin/document-templates"
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            양식 관리
          </Link>
        </div>
        <p className="text-xs text-gray-500">
          체류 확인서 · 이용 계약서를 미리보기 후 인쇄하거나 게스트에게
          발송합니다.
          {customCount > 0 && ` 등록된 사용자 양식 ${customCount}개.`}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          문서 발급 열기
        </button>
      </div>

      {open && (
        <AdminModal
          title={`문서 발급 — ${request.guest_name}`}
          onClose={() => setOpen(false)}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {editor}
            {preview}
          </div>
        </AdminModal>
      )}
    </>
  );
}
