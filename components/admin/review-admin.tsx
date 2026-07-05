"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Review, ReviewInvite, ReviewStatus } from "@/lib/types";

type InviteWithUrl = ReviewInvite & { url: string };

const STATUS_LABELS_KO: Record<ReviewStatus, string> = {
  pending: "대기 중",
  approved: "게시됨",
  rejected: "거절됨",
};

function inviteStateKo(invite: ReviewInvite): string {
  if (invite.used_at) return "사용됨";
  if (new Date(invite.expires_at) <= new Date()) return "만료됨";
  return "대기 중";
}

function formatDateKo(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Seoul",
  });
}

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      {copied ? "복사됨 ✓" : "링크 복사"}
    </button>
  );
}

function ReviewModerationCard({ review }: { review: Review }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: ReviewStatus) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? "요청 실패");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const allCategories = [
    ...review.basic_categories,
    ...review.additional_categories,
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-bold text-gray-900">
            {review.guest_name}
            {review.country ? `, ${review.country}` : ""} · {review.room_type}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {formatDateKo(review.submitted_at)} ·{" "}
            {STATUS_LABELS_KO[review.status]}
          </p>
        </div>
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-indigo-600 text-lg font-bold text-white">
          {review.score}
        </div>
      </div>
      {review.title && (
        <p className="mt-3 text-sm font-semibold text-gray-800">
          {review.title}
        </p>
      )}
      {review.positive && (
        <p className="mt-2 text-sm text-gray-700">👍 {review.positive}</p>
      )}
      {review.negative && (
        <p className="mt-2 text-sm text-gray-700">👎 {review.negative}</p>
      )}
      {allCategories.length > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {allCategories.map((c) => `${c.label} ${c.score}`).join(" · ")}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        {review.status !== "approved" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setStatus("approved")}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            승인
          </button>
        )}
        {review.status !== "rejected" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setStatus("rejected")}
            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            거절
          </button>
        )}
        {review.status === "approved" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setStatus("pending")}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            게시 취소
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function NewInviteForm({ roomTypeNames }: { roomTypeNames: string[] }) {
  const router = useRouter();
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [roomType, setRoomType] = useState(roomTypeNames[0] ?? "");
  const [busy, setBusy] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setCreatedUrl(null);
    try {
      const res = await fetch("/api/admin/review-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: guestName,
          guest_email: guestEmail,
          room_type: roomType,
        }),
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !body.url) {
        setError(body.error ?? "생성 실패");
        return;
      }
      setCreatedUrl(body.url);
      setGuestName("");
      setGuestEmail("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none";

  return (
    <form
      onSubmit={handleCreate}
      className="rounded-lg border border-gray-200 bg-white p-5"
    >
      <h3 className="text-base font-bold text-gray-900">새 후기 초대</h3>
      <p className="mt-1 text-sm text-gray-500">
        플랫폼 외 예약 고객에게도 링크를 만들어 보낼 수 있습니다.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input
          type="text"
          required
          placeholder="고객 이름"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className={inputClass}
        />
        <input
          type="email"
          placeholder="이메일 (선택)"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          className={inputClass}
        />
        <select
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
          className={inputClass}
        >
          {roomTypeNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {busy ? "생성 중…" : "초대 링크 만들기"}
      </button>
      {createdUrl && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 p-3">
          <code className="min-w-0 flex-1 truncate text-xs text-gray-700">
            {createdUrl}
          </code>
          <CopyLinkButton url={createdUrl} />
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}

function InviteRow({ invite }: { invite: InviteWithUrl }) {
  const [emailState, setEmailState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const open = inviteStateKo(invite) === "대기 중";

  async function handleSendEmail() {
    setEmailState("sending");
    const res = await fetch(
      `/api/admin/review-invites/${invite.id}/send-email`,
      { method: "POST" }
    );
    setEmailState(res.ok ? "sent" : "error");
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">
          {invite.guest_name || "(이름 없음)"} · {invite.room_type}
        </p>
        <p className="text-xs text-gray-500">
          {formatDateKo(invite.created_at)} 생성 ·{" "}
          {formatDateKo(invite.expires_at)} 만료 · {inviteStateKo(invite)}
          {invite.guest_email ? ` · ${invite.guest_email}` : ""}
        </p>
      </div>
      {open && (
        <div className="flex gap-2">
          <CopyLinkButton url={invite.url} />
          {invite.guest_email && (
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
          )}
        </div>
      )}
    </div>
  );
}

export function ReviewAdmin({
  reviews,
  invites,
  roomTypeNames,
}: {
  reviews: Review[];
  invites: InviteWithUrl[];
  roomTypeNames: string[];
}) {
  const pending = reviews.filter((r) => r.status === "pending");
  const handled = reviews.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-8">
      <NewInviteForm roomTypeNames={roomTypeNames} />

      <section>
        <h2 className="text-lg font-bold text-gray-900">
          대기 중 후기 ({pending.length})
        </h2>
        <div className="mt-3 space-y-3">
          {pending.length === 0 && (
            <p className="text-sm text-gray-500">대기 중인 후기가 없습니다.</p>
          )}
          {pending.map((review) => (
            <ReviewModerationCard key={review.id} review={review} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900">
          초대 링크 ({invites.length})
        </h2>
        <div className="mt-3 space-y-2">
          {invites.length === 0 && (
            <p className="text-sm text-gray-500">초대 링크가 없습니다.</p>
          )}
          {invites.map((invite) => (
            <InviteRow key={invite.id} invite={invite} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-900">
          처리된 후기 ({handled.length})
        </h2>
        <div className="mt-3 space-y-3">
          {handled.map((review) => (
            <ReviewModerationCard key={review.id} review={review} />
          ))}
        </div>
      </section>
    </div>
  );
}
