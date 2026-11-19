import Link from "next/link";
import { WhatsAppSettingsForm } from "@/components/admin/whatsapp-controls";
import { getAdminSettings, ratingStats } from "@/lib/whatsapp/admin-queries";
import { WhatsAppOutageBanner } from "../banner";

export const dynamic = "force-dynamic";

export default async function AdminWhatsAppSettingsPage() {
  const [settings, stats] = await Promise.all([getAdminSettings(), ratingStats()]);
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
      <p className="mt-6 text-xs text-gray-500">
        AI 모델: {settings.llmProvider}/{settings.llmModel}
      </p>
    </div>
  );
}
