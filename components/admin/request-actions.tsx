"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  BookingRequestWithRoom,
  BookingStatus,
  EmailTemplate,
} from "@/lib/types";
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS_KO } from "@/lib/types";
import {
  EmailComposer,
  type EmailComposerMode,
} from "@/components/admin/email-composer";

const statusTransitions: BookingStatus[] = [
  "new",
  "reviewing",
  "contacted",
  "approved",
  "confirmed",
  "declined",
  "expired",
  "closed",
];

export function RequestActions({
  request,
  templates,
}: {
  request: BookingRequestWithRoom;
  templates: EmailTemplate[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(request.status);
  const [adminNotes, setAdminNotes] = useState(request.admin_notes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [composerMode, setComposerMode] = useState<EmailComposerMode | null>(
    null,
  );

  useEffect(() => {
    if (!composerMode) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setComposerMode(null);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [composerMode]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/admin/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_notes: adminNotes }),
      });

      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      alert("변경 사항 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  const isPaid = request.payment_status === "paid";

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6 lg:h-full">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">관리</h3>

          <label
            htmlFor="status"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            상태
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as BookingStatus)}
            className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {statusTransitions.map((s) => (
              <option key={s} value={s}>
                {BOOKING_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="admin_notes"
            className="block text-xs font-bold text-gray-700 uppercase mb-1"
          >
            관리자 메모
          </label>
          <textarea
            id="admin_notes"
            rows={20}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="이 요청에 대한 내부 메모..."
            className="block w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition duration-150 ease-in-out disabled:opacity-50"
        >
          {saving ? "저장 중..." : saved ? "저장됨!" : "변경 사항 저장"}
        </button>

        <hr className="border-gray-200" />

        <div className="space-y-3">
          {!isPaid && (
            <button
              type="button"
              onClick={() => setComposerMode("approve_payment")}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 shadow-sm transition duration-150 ease-in-out"
            >
              승인 및 결제 링크 전송
            </button>
          )}
          <button
            type="button"
            onClick={() => setComposerMode("follow_up")}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out"
          >
            이메일 보내기
          </button>
        </div>
      </div>

      {composerMode && (
        <ComposerModal onClose={() => setComposerMode(null)}>
          <EmailComposer
            request={request}
            templates={templates}
            mode={composerMode}
            orientation="side"
            bare
            onSent={() => setComposerMode(null)}
          />
        </ComposerModal>
      )}
    </>
  );
}

function ComposerModal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            고객에게 이메일 보내기
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
