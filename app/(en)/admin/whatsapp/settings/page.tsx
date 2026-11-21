import Link from "next/link";
import { WhatsAppSettingsForm } from "@/components/admin/whatsapp-controls";
import { getAdminSettings, monthUsage, ratingStats, type UsageSummary } from "@/lib/whatsapp/admin-queries";
import { WhatsAppOutageBanner } from "../banner";

export const dynamic = "force-dynamic";

const n = (v: number) => v.toLocaleString("ko-KR");

/** This month's AI usage, added up from the stored token counts. */
function UsageCard({ usage }: { usage: UsageSummary }) {
  const since = new Date(usage.since).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
  return (
    <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
      <h2 className="text-lg font-bold text-gray-900">이번 달 AI 사용량</h2>
      <p className="text-sm text-gray-600 mt-1">
        {since}부터 · 저장된 토큰 수로 계산한 예상치입니다. 실제 청구 금액은 OpenAI 대시보드에서 확인하세요.
      </p>
      <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <dt className="text-xs font-bold text-gray-500">AI 답변 횟수</dt>
          <dd className="text-xl font-extrabold text-gray-900 mt-1">{n(usage.turns)}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-gray-500">입력 토큰</dt>
          <dd className="text-xl font-extrabold text-gray-900 mt-1">{n(usage.inputTokens)}</dd>
          <dd className="text-xs text-gray-500">캐시 {n(usage.cachedInputTokens)}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-gray-500">출력 토큰</dt>
          <dd className="text-xl font-extrabold text-gray-900 mt-1">{n(usage.outputTokens)}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold text-gray-500">예상 비용</dt>
          <dd className="text-xl font-extrabold text-gray-900 mt-1">${usage.costUsd.toFixed(2)}</dd>
          {usage.turns > 0 && (
            <dd className="text-xs text-gray-500">회당 약 ${(usage.costUsd / usage.turns).toFixed(4)}</dd>
          )}
        </div>
      </dl>
      {usage.unpricedModels.length > 0 && (
        <p className="mt-3 text-xs text-amber-700">
          가격 정보가 없는 모델은 비용에서 빠졌습니다: {usage.unpricedModels.join(", ")}
        </p>
      )}
    </div>
  );
}

export default async function AdminWhatsAppSettingsPage() {
  const [settings, stats, usage] = await Promise.all([getAdminSettings(), ratingStats(), monthUsage()]);
  return (
    <div className="max-w-3xl">
      <Link href="/admin/whatsapp" className="text-sm font-medium text-indigo-700 hover:text-indigo-800">
        WhatsApp으로 돌아가기
      </Link>
      <h1 className="mt-2 mb-6 text-3xl font-extrabold text-gray-900 tracking-tight">WhatsApp 설정</h1>
      <WhatsAppOutageBanner />
      <WhatsAppSettingsForm
        mode={settings.mode === "live" ? "live" : "off"}
        autoSend={settings.autoSend}
        stats={stats}
      />
      <UsageCard usage={usage} />
      <p className="mt-6 text-xs text-gray-500">
        AI 모델: {settings.llmProvider}/{settings.llmModel}
      </p>
    </div>
  );
}
