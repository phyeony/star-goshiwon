"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  pickTemplateContent,
  buildVarMap,
  substitute,
  type TemplateLang,
} from "@/lib/admin-email-templates";
import { wrapEmailHtml, textToEmailHtml } from "@/lib/email-html";
import type { BookingRequestWithRoom, EmailTemplate } from "@/lib/types";

export type EmailComposerMode = "approve_payment" | "follow_up";

type SendState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success" }
  | { kind: "error"; message: string };

type EditsMap = Record<string, { subject: string; body: string }>;

export interface EmailComposerProps {
  request: BookingRequestWithRoom;
  templates: EmailTemplate[];
  mode?: EmailComposerMode;
  /** "stacked" puts preview below body (mobile-friendly). "side" places preview on the right (modal/drawer). */
  orientation?: "stacked" | "side";
  /** Hide the card chrome (used when wrapped inside a modal/drawer that already has its own container). */
  bare?: boolean;
  /** Called after a successful send so the parent (e.g. a modal) can close. */
  onSent?: () => void;
}

function defaultSlugFor(
  mode: EmailComposerMode,
  templates: EmailTemplate[],
): string {
  const want = mode === "approve_payment" ? "approved" : "follow_up";
  const match = templates.find((t) => t.slug === want);
  return match?.slug ?? templates[0]?.slug ?? "";
}

function editsKey(slug: string, lang: TemplateLang) {
  return `${slug}::${lang}`;
}

export function EmailComposer({
  request,
  templates,
  mode = "follow_up",
  orientation = "stacked",
  bare = false,
  onSent,
}: EmailComposerProps) {
  const router = useRouter();

  const [selectedSlug, setSelectedSlug] = useState<string>(() =>
    defaultSlugFor(mode, templates),
  );
  const [lang, setLang] = useState<TemplateLang>("en");
  const [edits, setEdits] = useState<EditsMap>({});
  const [send, setSend] = useState<SendState>({ kind: "idle" });

  const vars = useMemo(() => buildVarMap(request), [request]);

  const renderInitial = useCallback(
    (tpl: EmailTemplate, l: TemplateLang) => {
      const { subject, body } = pickTemplateContent(tpl, l);
      return {
        subject: substitute(subject, vars),
        body: substitute(body, vars),
      };
    },
    [vars],
  );

  const selected = useMemo(
    () =>
      templates.find((t) => t.slug === selectedSlug) ?? templates[0] ?? null,
    [templates, selectedSlug],
  );

  const current = useMemo(() => {
    if (!selected) return { subject: "", body: "" };
    const saved = edits[editsKey(selected.slug, lang)];
    if (saved) return saved;
    return renderInitial(selected, lang);
  }, [selected, lang, edits, renderInitial]);

  function updateCurrent(next: { subject?: string; body?: string }) {
    if (!selected) return;
    setEdits((prev) => ({
      ...prev,
      [editsKey(selected.slug, lang)]: {
        subject: next.subject ?? current.subject,
        body: next.body ?? current.body,
      },
    }));
  }

  function isEdited(slug: string, l: TemplateLang) {
    return Boolean(edits[editsKey(slug, l)]);
  }

  function applyTemplate(slug: string) {
    if (selected && isEdited(selected.slug, lang)) {
      if (
        !window.confirm(
          "템플릿을 변경하면 새 템플릿의 내용이 표시됩니다. (수정한 내용은 언어별로 그대로 보존됩니다.) 계속하시겠습니까?",
        )
      ) {
        return;
      }
    }
    setSelectedSlug(slug);
    setSend({ kind: "idle" });
  }

  const previewHtml = useMemo(
    () =>
      wrapEmailHtml(
        textToEmailHtml(current.body, {
          ctaUrl: vars.payment_url,
          ctaLabel:
            mode === "approve_payment" ? "Review and pay securely" : "Open link",
        }),
      ),
    [current.body, mode, vars.payment_url],
  );

  async function handleSend() {
    if (!selected) return;
    setSend({ kind: "sending" });
    const endpoint =
      mode === "approve_payment"
        ? `/api/admin/requests/${request.id}/approve-and-email`
        : `/api/admin/requests/${request.id}/send-email`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: current.subject,
          text: current.body,
          templateSlug: selected.slug,
          templateLocale: lang,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSend({
          kind: "error",
          message: body?.error || `HTTP ${res.status}`,
        });
        return;
      }
      setSend({ kind: "success" });
      router.refresh();
      onSent?.();
    } catch (err) {
      setSend({ kind: "error", message: (err as Error).message });
    }
  }

  const isEmpty = templates.length === 0;
  const wrapperClasses = bare
    ? "space-y-4"
    : "bg-white rounded-2xl shadow-xl border border-gray-200 p-6 space-y-4";

  const sendLabel =
    send.kind === "sending"
      ? "전송 중..."
      : mode === "approve_payment"
        ? "승인 및 전송"
        : `${request.guest_email}로 전송`;

  const previewBlock = (
    <div
      className={
        orientation === "side" ? "flex flex-col lg:h-full" : "flex flex-col"
      }
    >
      <div className="text-xs font-bold text-gray-700 uppercase mb-1">
        미리보기
      </div>
      <div
        className={`border border-gray-200 rounded-lg overflow-hidden bg-gray-50 ${
          orientation === "side" ? "lg:flex-1 min-h-[360px]" : ""
        }`}
      >
        <iframe
          title="Email preview"
          srcDoc={`<!doctype html><html><body style="margin:0;padding:16px;background:#f9fafb;">${previewHtml}</body></html>`}
          sandbox=""
          className={
            orientation === "side" ? "w-full h-[360px] lg:h-full" : "w-full"
          }
          style={{
            border: 0,
            background: "white",
            ...(orientation === "stacked" ? { height: 360 } : {}),
          }}
        />
      </div>
    </div>
  );

  const editorBlock = (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-gray-700 mt-1">
          수신:{" "}
          <span className="font-medium text-gray-700">
            {request.guest_email}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-700 uppercase">언어</span>
        <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`px-3 py-1.5 text-sm font-medium ${
              lang === "en"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLang("ko")}
            className={`px-3 py-1.5 text-sm font-medium border-l border-gray-300 ${
              lang === "ko"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            한국어
          </button>
        </div>
        {selected && isEdited(selected.slug, lang) && (
          <span className="text-xs text-gray-500">(수정됨)</span>
        )}
      </div>

      {isEmpty ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          등록된 템플릿이 없습니다.{" "}
          <a
            className="underline font-medium"
            href="/admin/email-templates/new"
          >
            /admin/email-templates/new
          </a>
          에서 새로 만들어 보세요.
        </div>
      ) : (
        <div>
          <label
            htmlFor="template"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            템플릿
          </label>
          <select
            id="template"
            value={selectedSlug}
            onChange={(e) => applyTemplate(e.target.value)}
            className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.label}
              </option>
            ))}
          </select>
          {selected && (
            <p className="text-xs text-gray-500 mt-1">{selected.description}</p>
          )}
        </div>
      )}

      <div>
        <label
          htmlFor="subject"
          className="block text-xs font-bold text-gray-700 uppercase mb-1"
        >
          제목
        </label>
        <input
          id="subject"
          type="text"
          value={current.subject}
          onChange={(e) => updateCurrent({ subject: e.target.value })}
          className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label
          htmlFor="body"
          className="block text-xs font-bold text-gray-700 uppercase mb-1"
        >
          본문
        </label>
        <textarea
          id="body"
          rows={orientation === "side" ? 18 : 12}
          value={current.body}
          onChange={(e) => updateCurrent({ body: e.target.value })}
          className="block w-full border border-gray-300 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {send.kind === "success" && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          이메일이 전송되었습니다.
        </div>
      )}
      {send.kind === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          전송 실패: {send.message}
        </div>
      )}

      <button
        type="button"
        onClick={handleSend}
        disabled={
          send.kind === "sending" ||
          !selected ||
          current.subject.trim().length === 0 ||
          current.body.trim().length === 0
        }
        className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
      >
        {sendLabel}
      </button>
    </div>
  );

  if (orientation === "side") {
    return (
      <div className={wrapperClasses}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {editorBlock}
          {previewBlock}
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      {editorBlock}
      {previewBlock}
    </div>
  );
}
