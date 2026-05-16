"use client";

import { useEffect, useState } from "react";
import type { EmailSend } from "@/lib/types";

const KIND_LABEL: Record<string, string> = {
  send: "이메일",
  approve_payment: "승인 + 결제 링크",
};

const STATUS_LABEL: Record<string, string> = {
  sent: "전송됨",
  failed: "실패",
  queued: "대기 중",
};

function kindBadgeClasses(kind: string): string {
  if (kind === "approve_payment") {
    return "bg-green-50 text-green-800 border-green-200";
  }
  return "bg-indigo-50 text-indigo-800 border-indigo-200";
}

function formatSentAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR");
  } catch {
    return iso;
  }
}

export function EmailHistory({ sends }: { sends: EmailSend[] }) {
  const [viewing, setViewing] = useState<EmailSend | null>(null);

  useEffect(() => {
    if (!viewing) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setViewing(null);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [viewing]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        이메일 발송 내역
      </h2>

      {sends.length === 0 ? (
        <p className="text-sm text-gray-500">
          이 고객에게 보낸 이메일이 아직 없습니다.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {sends.map((s) => (
            <li
              key={s.id}
              className="py-3 flex items-start justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${kindBadgeClasses(s.kind)}`}
                  >
                    {KIND_LABEL[s.kind] ?? s.kind}
                  </span>
                  {s.template_slug && (
                    <code className="text-xs text-gray-500">
                      {s.template_slug}
                      {s.template_locale ? `·${s.template_locale}` : ""}
                    </code>
                  )}
                  {s.send_status !== "sent" && (
                    <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      {STATUS_LABEL[s.send_status] ?? s.send_status}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm font-medium text-gray-900 truncate">
                  {s.subject}
                </div>
                <div className="mt-0.5 text-xs text-gray-500">
                  {formatSentAt(s.sent_at)} · 수신: {s.sent_to_email}
                  {s.sent_by_email ? ` · 발신: ${s.sent_by_email}` : ""}
                </div>
                {s.send_error && (
                  <div className="mt-1 text-xs text-red-700">{s.send_error}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewing(s)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-700 border border-indigo-300 hover:bg-indigo-50"
              >
                보기
              </button>
            </li>
          ))}
        </ul>
      )}

      {viewing && (
        <EmailViewModal send={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}

function EmailViewModal({
  send,
  onClose,
}: {
  send: EmailSend;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {send.subject}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatSentAt(send.sent_at)} · 수신: {send.sent_to_email}
              {send.sent_by_email ? ` · 발신: ${send.sent_by_email}` : ""}
              {send.template_slug
                ? ` · 템플릿 ${send.template_slug}${send.template_locale ? ` (${send.template_locale})` : ""}`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase mb-1">
              HTML 미리보기
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <iframe
                title="Sent email"
                srcDoc={`<!doctype html><html><body style="margin:0;padding:16px;background:#f9fafb;">${send.body_html}</body></html>`}
                sandbox=""
                className="w-full"
                style={{ height: 560, border: 0, background: "white" }}
              />
            </div>
          </div>
          <details>
            <summary className="cursor-pointer text-xs font-bold text-gray-500 uppercase">
              텍스트 버전
            </summary>
            <pre className="mt-2 text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-200">
              {send.body_text}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
