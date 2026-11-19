import { recentFailures } from "@/lib/whatsapp/admin-queries";

// Shown when the agent failed twice or more in the last hour: the model key,
// the OpenAI budget or the Meta token is probably the problem, and every new
// message is going to the manager.
export async function WhatsAppOutageBanner() {
  const { count, latest } = await recentFailures();
  if (count < 2) return null;
  return (
    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p className="font-semibold">AI 비서가 지난 1시간 동안 {count}번 실패했습니다.</p>
      <p className="mt-1">
        새 메시지는 모두 매니저에게 넘어갑니다. WhatsApp 앱에서 직접 확인해 주세요.
      </p>
      {latest && <p className="mt-2 text-xs text-red-700 break-all">마지막 오류: {latest.slice(0, 200)}</p>}
    </div>
  );
}
