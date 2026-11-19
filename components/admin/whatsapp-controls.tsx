"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { copyText } from "@/lib/copy-text";
import { CATEGORY_LABEL, SWITCHABLE } from "@/lib/whatsapp/admin-labels";
import type { Category, Mode } from "@/lib/whatsapp-agent/types";

async function patch(url: string, body: unknown): Promise<boolean> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.ok;
}

const btn =
  "rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";

/** Agent on/off for all chats, and the per-topic auto-answer switches. */
export function WhatsAppSettingsForm({
  mode,
  autoSend,
  stats,
}: {
  mode: Mode;
  autoSend: Record<Category, boolean>;
  stats: Record<string, { good: number; bad: number }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const live = mode === "live";

  async function save(body: unknown) {
    setBusy(true);
    setError("");
    const ok = await patch("/api/admin/whatsapp/settings", body);
    setBusy(false);
    if (!ok) setError("저장하지 못했습니다. 다시 시도해 주세요.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">AI 자동 답변</h2>
          <p className="text-sm text-gray-600 mt-1">
            {live
              ? "켜짐: 아래에서 켠 주제는 AI가 바로 답하고, 나머지는 매니저에게 넘깁니다."
              : "꺼짐: AI가 아무것도 보내지 않습니다. 모든 메시지는 WhatsApp 앱에서 직접 답해 주세요."}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (live || confirm("AI 자동 답변을 켤까요? 손님에게 실제로 메시지가 나갑니다.")) {
              save({ mode: live ? "off" : "live" });
            }
          }}
          className={`${btn} ${live ? "border-gray-300 text-gray-700 hover:bg-gray-50" : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"}`}
        >
          {live ? "끄기" : "켜기"}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <h2 className="text-lg font-bold text-gray-900">주제별 자동 답변</h2>
        <p className="text-sm text-gray-600 mt-1">
          끈 주제는 항상 매니저에게 넘깁니다. 할인, 예약 상태, 불편 사항 같은 주제는 항상 매니저 몫이라 여기 없습니다.
        </p>
        <ul className="mt-4 divide-y divide-gray-100">
          {SWITCHABLE.map((c) => {
            const s = stats[c];
            return (
              <li key={c} className="flex items-center justify-between gap-4 py-2.5">
                <div>
                  <span className="text-sm font-medium text-gray-900">{CATEGORY_LABEL[c]}</span>
                  {s && (
                    <span className="ml-2 text-xs text-gray-500">
                      평가 ✓ {s.good} · ✗ {s.bad}
                    </span>
                  )}
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={autoSend[c]}
                    disabled={busy}
                    onChange={(e) => save({ autoSend: { [c]: e.target.checked } })}
                  />
                  {autoSend[c] ? "자동" : "매니저"}
                </label>
              </li>
            );
          })}
        </ul>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

/** Per-chat switch: the agent answers here, or leaves this chat alone. */
export function BotStateControl({
  conversationId,
  botState,
  pausedUntil,
}: {
  conversationId: string;
  botState: "active" | "paused_by_manager" | "off";
  pausedUntil: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const paused = botState === "paused_by_manager" && pausedUntil && Date.parse(pausedUntil) > Date.now();

  async function set(state: "active" | "off") {
    setBusy(true);
    await patch(`/api/admin/whatsapp/conversations/${conversationId}`, { botState: state });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-700">
        {botState === "off"
          ? "이 채팅은 AI가 답하지 않습니다."
          : paused
            ? `매니저 답장으로 일시정지 중 (${new Date(pausedUntil!).toLocaleString("ko-KR")}까지). 초안만 만듭니다.`
            : "AI가 이 채팅에 답합니다."}
      </p>
      <div className="flex flex-wrap gap-2">
        {(botState === "off" || paused) && (
          <button
            type="button"
            disabled={busy}
            onClick={() => set("active")}
            className={`${btn} border-emerald-600 text-emerald-700 hover:bg-emerald-50`}
          >
            {paused ? "일시정지 해제" : "AI 다시 켜기"}
          </button>
        )}
        {botState !== "off" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => set("off")}
            className={`${btn} border-gray-300 text-gray-700 hover:bg-gray-50`}
          >
            이 채팅 AI 끄기
          </button>
        )}
      </div>
    </div>
  );
}

/** Copy the AI's draft, and rate the turn ✓ / ✗. */
export function RunActions({
  runId,
  draft,
  rating,
}: {
  runId: string;
  draft: string;
  rating: "good" | "bad" | null;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function rate(value: "good" | "bad") {
    setBusy(true);
    await patch(`/api/admin/whatsapp/runs/${runId}`, { rating: rating === value ? null : value });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {draft && (
        <button
          type="button"
          onClick={async () => {
            if (await copyText(draft)) {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          }}
          className={`${btn} border-indigo-300 text-indigo-700 hover:bg-indigo-50`}
        >
          {copied ? "복사됨" : "초안 복사"}
        </button>
      )}
      <span className="text-xs text-gray-500 ml-1">이대로 보내도 될 답변인가요?</span>
      <button
        type="button"
        disabled={busy}
        onClick={() => rate("good")}
        aria-pressed={rating === "good"}
        className={`${btn} ${rating === "good" ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
      >
        ✓ 좋음
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => rate("bad")}
        aria-pressed={rating === "bad"}
        className={`${btn} ${rating === "bad" ? "border-red-600 bg-red-600 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
      >
        ✗ 별로
      </button>
    </div>
  );
}
