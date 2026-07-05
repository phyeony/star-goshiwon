"use client";

import { useState } from "react";

export function ReviewInviteButton({
  requestId,
  guestName,
  guestEmail,
  roomTypeName,
}: {
  requestId: string;
  guestName: string;
  guestEmail: string;
  roomTypeName: string;
}) {
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState<{ id: string; url: string } | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [emailState, setEmailState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/review-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: guestName,
          guest_email: guestEmail,
          room_type: roomTypeName,
          booking_request_id: requestId,
        }),
      });
      const body = (await res.json()) as {
        invite?: { id: string };
        url?: string;
        error?: string;
      };
      if (!res.ok || !body.url || !body.invite) {
        setError(body.error ?? "초대 생성 실패");
        return;
      }
      setInvite({ id: body.invite.id, url: body.url });
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!invite) return;
    await navigator.clipboard.writeText(invite.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSendEmail() {
    if (!invite) return;
    setEmailState("sending");
    const res = await fetch(
      `/api/admin/review-invites/${invite.id}/send-email`,
      { method: "POST" }
    );
    setEmailState(res.ok ? "sent" : "error");
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="text-base font-bold text-gray-900">후기 요청</h3>
      {!invite ? (
        <>
          <p className="mt-1 text-sm text-gray-500">
            이 고객에게 보낼 일회용 후기 링크를 만듭니다.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={handleCreate}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? "생성 중…" : "후기 링크 만들기"}
          </button>
        </>
      ) : (
        <div className="mt-3 space-y-3">
          <code className="block truncate rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
            {invite.url}
          </code>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {copied ? "복사됨 ✓" : "링크 복사 (WhatsApp용)"}
            </button>
            <button
              type="button"
              disabled={emailState === "sending" || emailState === "sent"}
              onClick={handleSendEmail}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {emailState === "sent"
                ? "발송됨 ✓"
                : emailState === "sending"
                  ? "발송 중…"
                  : emailState === "error"
                    ? "실패 — 재시도"
                    : "이메일 보내기"}
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
