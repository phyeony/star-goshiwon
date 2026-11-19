import Link from "next/link";
import { getAdminSettings, listConversations, type ChatStatus } from "@/lib/whatsapp/admin-queries";
import { MEN_ONLY_LABEL } from "@/lib/whatsapp/admin-labels";
import { WhatsAppOutageBanner } from "./banner";

export const dynamic = "force-dynamic";

const STATUS: Record<ChatStatus, { label: string; cls: string }> = {
  needs_reply: { label: "답변 필요", cls: "border-amber-200 bg-amber-50 text-amber-800" },
  processing: { label: "AI 처리 중", cls: "border-sky-200 bg-sky-50 text-sky-800" },
  answered: { label: "답변함", cls: "border-gray-200 bg-gray-50 text-gray-600" },
  quiet: { label: "메시지 없음", cls: "border-gray-200 bg-gray-50 text-gray-500" },
};

const badge = "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  } catch {
    return iso;
  }
}

export default async function AdminWhatsAppPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const [all, settings] = await Promise.all([listConversations(), getAdminSettings()]);
  const needsReply = all.filter((c) => c.status === "needs_reply");
  const chats = filter === "needs_reply" ? needsReply : all;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">WhatsApp</h1>
        <div className="flex items-center gap-3">
          <span
            className={`${badge} ${settings.mode === "live" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-gray-200 bg-gray-50 text-gray-600"}`}
          >
            AI 자동 답변 {settings.mode === "live" ? "켜짐" : "꺼짐"}
          </span>
          <Link
            href="/admin/whatsapp/settings"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            설정
          </Link>
        </div>
      </div>

      <WhatsAppOutageBanner />

      <div className="flex flex-wrap gap-2 mb-6">
        <FilterLink href="/admin/whatsapp" active={filter !== "needs_reply"} label={`전체 ${all.length}`} />
        <FilterLink
          href="/admin/whatsapp?filter=needs_reply"
          active={filter === "needs_reply"}
          label={`답변 필요 ${needsReply.length}`}
        />
      </div>

      {chats.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">채팅이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {chats.map((c) => {
              const s = STATUS[c.status];
              const summary = c.latestRun?.understanding?.summary_ko;
              return (
                <li key={c.id}>
                  <Link href={`/admin/whatsapp/${c.id}`} className="block p-5 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`${badge} ${s.cls}`}>{s.label}</span>
                          {c.bot_state === "off" && (
                            <span className={`${badge} border-gray-300 bg-white text-gray-700`}>AI 꺼짐</span>
                          )}
                          {c.bot_state === "paused_by_manager" &&
                            c.paused_until &&
                            Date.parse(c.paused_until) > Date.now() && (
                              <span className={`${badge} border-gray-300 bg-white text-gray-700`}>AI 일시정지</span>
                            )}
                          {c.men_only_state === "not_eligible" && (
                            <span className={`${badge} border-gray-300 bg-white text-gray-500`}>
                              {MEN_ONLY_LABEL.not_eligible}
                            </span>
                          )}
                          {c.booking_request_id && (
                            <span className={`${badge} border-indigo-200 bg-indigo-50 text-indigo-800`}>
                              예약 연결됨
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-base font-semibold text-gray-900 truncate">
                          {c.profile_name || "(이름 없음)"}{" "}
                          <span className="font-normal text-gray-500 text-sm">+{c.wa_phone}</span>
                        </p>
                        {summary ? (
                          <p className="mt-1 text-sm text-gray-700 line-clamp-2">{summary}</p>
                        ) : (
                          c.lastMessage && (
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                              {c.lastMessage.body || `[${c.lastMessage.message_type}]`}
                            </p>
                          )
                        )}
                      </div>
                      <div className="shrink-0 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(c.last_message_at)}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-sm font-medium ${active ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
    >
      {label}
    </Link>
  );
}
