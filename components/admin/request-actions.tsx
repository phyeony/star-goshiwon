"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  BookingRequestWithRoom,
  BookingStatus,
  EmailTemplate,
} from "@/lib/types";
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS_KO } from "@/lib/types";
import { DEPOSIT_USD, formatUSD } from "@/lib/pricing";
import { AdminModal } from "@/components/admin/admin-modal";
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

  const paidAmount = request.payment_amount ?? request.estimated_total;
  const refundedSoFar = request.refund_amount ?? 0;
  const remainingRefundable = Math.max(0, paidAmount - refundedSoFar);
  const [showRefund, setShowRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState(
    String(Math.min(DEPOSIT_USD, remainingRefundable)),
  );
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState("");

  async function handleRefund() {
    const amount = Number(refundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setRefundError("Enter an amount greater than 0.");
      return;
    }
    if (amount > remainingRefundable) {
      setRefundError(
        `Amount exceeds the refundable balance (${formatUSD(remainingRefundable)}).`,
      );
      return;
    }
    if (
      !window.confirm(
        `Refund ${formatUSD(amount)} to ${request.guest_name} via PayPal? This cannot be undone.`,
      )
    ) {
      return;
    }

    setRefunding(true);
    setRefundError("");
    try {
      const res = await fetch(`/api/admin/requests/${request.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_usd: amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Refund failed");
      }
      setShowRefund(false);
      router.refresh();
    } catch (err) {
      setRefundError(err instanceof Error ? err.message : "Refund failed");
    } finally {
      setRefunding(false);
    }
  }

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
  const canApprove = Boolean(request.assigned_room_unit_id);

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
          {!canApprove && !isPaid && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              이 요청을 승인하기 전에 예약 가능한 객실 번호를 배정하세요.
            </div>
          )}
          {!isPaid && (
            <button
              type="button"
              onClick={() => setComposerMode("approve_payment")}
              disabled={!canApprove}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 shadow-sm transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
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

        {(isPaid || refundedSoFar > 0) && (
          <>
            <hr className="border-gray-200" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">환불</h4>
                {refundedSoFar > 0 && (
                  <span className="text-xs text-gray-500">
                    환불됨: {formatUSD(refundedSoFar)} / {formatUSD(paidAmount)}
                  </span>
                )}
              </div>

              {isPaid && remainingRefundable > 0 && !showRefund && (
                <button
                  type="button"
                  onClick={() => {
                    setRefundError("");
                    setRefundAmount(
                      String(Math.min(DEPOSIT_USD, remainingRefundable)),
                    );
                    setShowRefund(true);
                  }}
                  className="w-full flex items-center justify-center px-4 py-2 border border-amber-300 rounded-lg text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 transition duration-150 ease-in-out"
                >
                  보증금 환불
                </button>
              )}

              {isPaid && showRefund && (
                <div className="space-y-2 rounded-lg border border-gray-200 p-3">
                  <label
                    htmlFor="refund_amount"
                    className="block text-xs font-bold text-gray-700 uppercase"
                  >
                    환불 금액 (USD)
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">$</span>
                    <input
                      id="refund_amount"
                      type="number"
                      min={1}
                      max={remainingRefundable}
                      step={1}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="block w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    환불 가능 잔액: {formatUSD(remainingRefundable)} (보증금{" "}
                    {formatUSD(DEPOSIT_USD)})
                  </p>
                  {refundError && (
                    <p className="text-xs text-red-700">{refundError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRefund}
                      disabled={refunding}
                      className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition duration-150 ease-in-out disabled:opacity-50"
                    >
                      {refunding ? "환불 처리 중..." : "PayPal로 환불"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRefund(false)}
                      disabled={refunding}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {refundError && !showRefund && (
                <p className="text-xs text-red-700">{refundError}</p>
              )}
            </div>
          </>
        )}
      </div>

      {composerMode && (
        <AdminModal
          title="고객에게 이메일 보내기"
          onClose={() => setComposerMode(null)}
        >
          <EmailComposer
            request={request}
            templates={templates}
            mode={composerMode}
            orientation="side"
            bare
            onSent={() => setComposerMode(null)}
          />
        </AdminModal>
      )}
    </>
  );
}
