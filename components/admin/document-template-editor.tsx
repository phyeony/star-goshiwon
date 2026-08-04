"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DOCUMENT_TOKENS } from "@/lib/documents/templates";
import type { DocumentLang, DocumentType } from "@/lib/documents/types";
import type { DocumentTemplate } from "@/lib/types";

type SaveState =
  | { kind: "idle" }
  | { kind: "busy"; what: "upload" | "save" | "delete" }
  | { kind: "saved"; warnings: string[] }
  | { kind: "error"; message: string };

export interface SlotDescriptor {
  type: DocumentType;
  lang: DocumentLang;
  label: string;
  builtInTitle: string;
}

interface Props {
  slot: SlotDescriptor;
  template: DocumentTemplate | null;
}

export function DocumentTemplateEditor({ slot, template }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(template?.title ?? "");
  const [bodyHtml, setBodyHtml] = useState(template?.body_html ?? "");
  const [sourceFilename, setSourceFilename] = useState(
    template?.source_filename ?? ""
  );
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const [conversionWarnings, setConversionWarnings] = useState<string[]>([]);

  const isCustom = Boolean(template);
  const busy = state.kind === "busy";

  const previewHtml = useMemo(() => bodyHtml, [bodyHtml]);

  async function handleUpload(file: File) {
    setState({ kind: "busy", what: "upload" });
    setConversionWarnings([]);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/admin/document-templates/convert", {
        method: "POST",
        body: data,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({
          kind: "error",
          message:
            body?.error === "docx_required"
              ? ".docx 파일만 업로드할 수 있습니다. 한글(HWP)은 먼저 .docx로 내보내 주세요."
              : body?.error === "file_too_large"
                ? "파일이 너무 큽니다 (최대 5MB)."
                : body?.error || `HTTP ${res.status}`,
        });
        return;
      }
      setBodyHtml(body.html ?? "");
      setSourceFilename(body.source_filename ?? file.name);
      setConversionWarnings(body.warnings ?? []);
      setState({ kind: "idle" });
    } catch (err) {
      setState({ kind: "error", message: (err as Error).message });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    setState({ kind: "busy", what: "save" });
    try {
      const res = await fetch("/api/admin/document-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: slot.type,
          lang: slot.lang,
          title,
          body_html: bodyHtml,
          source_filename: sourceFilename,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({ kind: "error", message: body?.error || `HTTP ${res.status}` });
        return;
      }
      setState({ kind: "saved", warnings: body.warnings ?? [] });
      router.refresh();
    } catch (err) {
      setState({ kind: "error", message: (err as Error).message });
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `${slot.label} 양식을 삭제하면 기본 양식으로 되돌아갑니다. 계속하시겠습니까?`
      )
    ) {
      return;
    }
    setState({ kind: "busy", what: "delete" });
    try {
      const res = await fetch(
        `/api/admin/document-templates?type=${slot.type}&lang=${slot.lang}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setState({ kind: "error", message: body?.error || `HTTP ${res.status}` });
        return;
      }
      setTitle("");
      setBodyHtml("");
      setSourceFilename("");
      setState({ kind: "idle" });
      router.refresh();
    } catch (err) {
      setState({ kind: "error", message: (err as Error).message });
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{slot.label}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {isCustom ? (
              <>
                업로드한 양식 사용 중
                {template?.source_filename
                  ? ` · ${template.source_filename}`
                  : ""}
              </>
            ) : (
              <>기본 양식 사용 중 · {slot.builtInTitle}</>
            )}
          </p>
        </div>
        <span
          className={`shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
            isCustom
              ? "bg-indigo-50 text-indigo-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {isCustom ? "사용자 양식" : "기본"}
        </span>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
          Word 파일(.docx) 업로드
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
          }}
          className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <p className="text-xs text-gray-500 mt-1">
          업로드하면 아래 HTML로 변환됩니다. 파일 자체는 저장되지 않습니다.
          한글(HWP)은 먼저 .docx로 내보내 주세요. 서식은 근사치로 변환되므로
          미리보기를 확인하고 필요하면 직접 수정하세요.
        </p>
      </div>

      {conversionWarnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <p className="font-medium mb-1">변환 시 참고 사항</p>
          <ul className="list-disc list-inside space-y-0.5">
            {conversionWarnings.slice(0, 5).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label
          htmlFor={`title-${slot.type}-${slot.lang}`}
          className="block text-xs font-bold text-gray-700 uppercase mb-1"
        >
          문서 제목
        </label>
        <input
          id={`title-${slot.type}-${slot.lang}`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={slot.builtInTitle}
          className="block w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label
          htmlFor={`body-${slot.type}-${slot.lang}`}
          className="block text-xs font-bold text-gray-700 uppercase mb-1"
        >
          본문 (HTML)
        </label>
        <textarea
          id={`body-${slot.type}-${slot.lang}`}
          rows={12}
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
          className="block w-full border border-gray-300 rounded-lg p-3 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <details className="text-xs text-gray-600">
        <summary className="cursor-pointer font-medium text-gray-700">
          사용 가능한 항목 ({DOCUMENT_TOKENS.length})
        </summary>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
          {DOCUMENT_TOKENS.map((token) => (
            <div key={token.name}>
              <code className="text-indigo-700">{`{{${token.name}}}`}</code>{" "}
              <span className="text-gray-500">{token.description}</span>
            </div>
          ))}
        </div>
      </details>

      {bodyHtml.trim() && (
        <div>
          <div className="text-xs font-bold text-gray-700 uppercase mb-1">
            미리보기 (항목 미치환)
          </div>
          <div className="border border-gray-200 rounded-lg bg-gray-50 p-4 max-h-64 overflow-y-auto">
            <div
              className="document-template-body bg-white p-4 text-sm"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      )}

      {state.kind === "saved" && (
        <div className="space-y-2">
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            저장되었습니다.
          </div>
          {state.warnings.map((w, i) => (
            <div
              key={i}
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
            >
              ⚠ {w}
            </div>
          ))}
        </div>
      )}
      {state.kind === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy || !bodyHtml.trim()}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {state.kind === "busy" && state.what === "save"
            ? "저장 중..."
            : "저장"}
        </button>
        {isCustom && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
          >
            기본 양식으로 되돌리기
          </button>
        )}
      </div>
    </div>
  );
}
