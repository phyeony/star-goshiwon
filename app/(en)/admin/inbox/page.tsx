import Link from "next/link";
import { getEmailReceives } from "@/lib/queries";
import type { EmailReceive } from "@/lib/types";

export const dynamic = "force-dynamic";

const MATCH_LABEL: Record<EmailReceive["match_status"], string> = {
  matched: "예약 연결됨",
  unmatched: "미연결",
  ambiguous: "확인 필요",
  ignored: "제외됨",
};

const MATCH_CLASSES: Record<EmailReceive["match_status"], string> = {
  matched: "border-emerald-200 bg-emerald-50 text-emerald-800",
  unmatched: "border-gray-200 bg-gray-50 text-gray-700",
  ambiguous: "border-amber-200 bg-amber-50 text-amber-800",
  ignored: "border-gray-200 bg-gray-50 text-gray-500",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("ko-KR");
  } catch {
    return iso;
  }
}

export default async function AdminInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const matchStatus = isMatchStatus(status) ? status : undefined;
  const messages = await getEmailReceives({ matchStatus, limit: 100 });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          받은 메일
        </h1>
        <div className="text-sm text-gray-500">최근 {messages.length}건</div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <FilterLink href="/admin/inbox" active={!matchStatus} label="전체" />
        <FilterLink
          href="/admin/inbox?status=unmatched"
          active={matchStatus === "unmatched"}
          label="미연결"
        />
        <FilterLink
          href="/admin/inbox?status=ambiguous"
          active={matchStatus === "ambiguous"}
          label="확인 필요"
        />
        <FilterLink
          href="/admin/inbox?status=matched"
          active={matchStatus === "matched"}
          label="예약 연결됨"
        />
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">받은 메일이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {messages.map((message) => (
              <li key={message.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${MATCH_CLASSES[message.match_status]}`}
                      >
                        {MATCH_LABEL[message.match_status]}
                      </span>
                      <span className="text-xs text-gray-500">
                        {message.provider}
                      </span>
                      {message.provider_thread_id && (
                        <code className="text-xs text-gray-400">
                          thread:{message.provider_thread_id}
                        </code>
                      )}
                    </div>
                    <Link
                      href={`/admin/inbox/${message.id}`}
                      className="mt-2 block text-base font-semibold text-gray-900 truncate hover:text-indigo-700"
                    >
                      {message.subject || "(제목 없음)"}
                    </Link>
                    <p className="mt-1 text-sm text-gray-600">
                      {message.from_name
                        ? `${message.from_name} <${message.from_email}>`
                        : message.from_email}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {message.body_text}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(message.received_at)}
                    </div>
                    {message.booking_request_id && (
                      <Link
                        href={`/admin/requests/${message.booking_request_id}`}
                        className="inline-flex mt-3 rounded-lg border border-indigo-300 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                      >
                        예약 보기
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FilterLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
        active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
      }`}
    >
      {label}
    </Link>
  );
}

function isMatchStatus(value?: string): value is EmailReceive["match_status"] {
  return (
    value === "matched" ||
    value === "unmatched" ||
    value === "ambiguous" ||
    value === "ignored"
  );
}
