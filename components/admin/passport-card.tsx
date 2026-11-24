"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface PassportCardProps {
  requestId: string;
  checkOutDate: string;
  hasPhoto: boolean;
  uploadedAt: string | null;
  checkedAt: string | null;
  /** Last photo was deleted (checked-out, ended or by the manager). */
  deletedAt: string | null;
  linkCreatedAt: string | null;
  hasWhatsApp: boolean;
  log: { action: string; actor: string; at: string }[];
}

const ACTION_LABELS: Record<string, string> = {
  upload: "고객 업로드",
  view: "열람",
  checked: "확인 완료",
  delete: "수동 삭제",
  auto_delete: "자동 삭제",
  link_created: "링크 생성",
  link_sent: "WhatsApp으로 링크 전송",
};

const SEND_ERRORS: Record<string, string> = {
  no_chat: "이 예약과 연결된 WhatsApp 대화가 없습니다. 링크를 복사해서 보내 주세요.",
  window_closed: "고객의 마지막 메시지가 24시간이 지나 보낼 수 없습니다. 링크를 복사해서 이메일로 보내 주세요.",
  send_failed: "WhatsApp 전송에 실패했습니다. 링크를 복사해서 보내 주세요.",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "short", timeStyle: "short" });
}

export function PassportCard(p: PassportCardProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showPhoto, setShowPhoto] = useState(false);
  const [photoNonce] = useState(() => Date.now());
  const base = `/api/admin/requests/${p.requestId}/passport`;

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setNote("");
    try {
      await fn();
    } catch {
      setNote("문제가 생겼습니다. 다시 시도해 주세요.");
    } finally {
      setBusy(null);
    }
  }

  const makeLink = (send: "none" | "whatsapp") =>
    run(send, async () => {
      const res = await fetch(`${base}/link`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ send }),
      });
      const data = (await res.json()) as { url?: string; sent?: boolean; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error);
      setLink(data.url);
      if (send === "whatsapp") {
        setNote(data.sent ? "WhatsApp으로 보냈습니다. 이전 링크는 더 이상 작동하지 않습니다." : SEND_ERRORS[data.error ?? ""] ?? SEND_ERRORS.send_failed);
      } else {
        setNote("새 링크를 만들었습니다. 이전 링크는 더 이상 작동하지 않습니다.");
      }
      router.refresh();
    });

  const markChecked = () =>
    run("checked", async () => {
      const res = await fetch(`${base}/checked`, { method: "POST" });
      if (!res.ok) throw new Error();
      router.refresh();
    });

  const deleteNow = () =>
    run("delete", async () => {
      if (!window.confirm("여권 사진을 지금 삭제할까요? 되돌릴 수 없습니다.")) return;
      const res = await fetch(base, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setShowPhoto(false);
      router.refresh();
    });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-900">여권 확인</h2>
        {p.checkedAt ? (
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">확인 완료</span>
        ) : p.hasPhoto ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">확인 필요</span>
        ) : (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">사진 없음</span>
        )}
      </div>

      {p.hasPhoto ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-gray-600">
            {p.uploadedAt && <>업로드 {fmt(p.uploadedAt)}. </>}
            퇴실일({p.checkOutDate}) 자동 삭제.
          </p>
          {showPhoto ? (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${base}?v=${photoNonce}`} alt="여권 사진" className="w-full object-contain" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowPhoto(true)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              사진 보기 (열람 기록이 남습니다)
            </button>
          )}
          <div className="flex gap-2">
            {!p.checkedAt && (
              <button
                type="button"
                disabled={busy !== null}
                onClick={markChecked}
                className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                확인 완료
              </button>
            )}
            <button
              type="button"
              disabled={busy !== null}
              onClick={deleteNow}
              className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              지금 삭제
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-600">
          {p.deletedAt
            ? `사진은 ${fmt(p.deletedAt)}에 삭제되었습니다.`
            : p.linkCreatedAt
              ? `링크를 ${fmt(p.linkCreatedAt)}에 만들었고, 아직 업로드가 없습니다.`
              : "고객에게 인증 링크를 보내 여권 사진을 받으세요. WhatsApp에서는 여권을 직접 요청하면 안 됩니다."}
        </p>
      )}

      <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
        {p.hasWhatsApp && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => makeLink("whatsapp")}
            className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy === "whatsapp" ? "보내는 중…" : "WhatsApp으로 인증 링크 보내기"}
          </button>
        )}
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => makeLink("none")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
        >
          {busy === "none" ? "만드는 중…" : "인증 링크 만들기 (복사용)"}
        </button>
        {link && (
          <div className="flex gap-2">
            <input readOnly value={link} className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-700" onFocus={(e) => e.target.select()} />
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(link).then(() => setNote("링크를 복사했습니다."))}
              className="rounded-lg border border-gray-300 px-3 text-xs font-medium hover:bg-gray-50"
            >
              복사
            </button>
          </div>
        )}
        {note && <p className="text-xs text-gray-600">{note}</p>}
      </div>

      {p.log.length > 0 && (
        <details className="mt-4 text-xs text-gray-500">
          <summary className="cursor-pointer">기록 {p.log.length}건</summary>
          <ul className="mt-2 space-y-1">
            {p.log.map((l, i) => (
              <li key={i}>
                {fmt(l.at)} · {ACTION_LABELS[l.action] ?? l.action}
                {l.actor && !l.actor.startsWith("system") && l.actor !== "guest" ? ` · ${l.actor}` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
