import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBookingRequestById,
  getEmailReceiveById,
  getEmailReceivesForProviderThread,
  getEmailTemplates,
} from "@/lib/queries";
import { EmailComposer } from "@/components/admin/email-composer";
import type { EmailReceive } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("ko-KR");
  } catch {
    return iso;
  }
}

function gmailThreadUrl(message: EmailReceive): string | null {
  const value = message.extra?.gmailThreadPermalink;
  return typeof value === "string" ? value : null;
}

export default async function InboxThreadPage({ params }: Props) {
  const { id } = await params;
  const message = await getEmailReceiveById(id);
  if (!message) notFound();

  const [threadMessages, request, templates] = await Promise.all([
    message.provider_thread_id
      ? getEmailReceivesForProviderThread(
          message.provider,
          message.provider_thread_id
        )
      : Promise.resolve([message]),
    message.booking_request_id
      ? getBookingRequestById(message.booking_request_id)
      : Promise.resolve(null),
    getEmailTemplates(),
  ]);

  const gmailUrl = gmailThreadUrl(message);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              href="/admin/inbox"
              className="text-sm font-medium text-indigo-700 hover:text-indigo-800"
            >
              받은 메일로 돌아가기
            </Link>
            <h1 className="mt-3 text-3xl font-extrabold text-gray-900 tracking-tight">
              {message.subject || "(제목 없음)"}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {message.provider}
              {message.provider_thread_id
                ? ` · thread:${message.provider_thread_id}`
                : ""}
            </p>
          </div>
          {gmailUrl && (
            <a
              href={gmailUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Gmail에서 열기
            </a>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {threadMessages.map((item) => (
              <li key={item.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {item.from_name
                        ? `${item.from_name} <${item.from_email}>`
                        : item.from_email}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      수신: {item.to_email || "-"}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(item.received_at)}
                  </p>
                </div>

                <details className="mt-4" open={item.id === message.id}>
                  <summary className="cursor-pointer text-sm font-medium text-indigo-700">
                    내용 보기
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-800">
                    {item.body_text || "(본문 없음)"}
                  </pre>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-6">
        {request ? (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <div className="text-xs font-bold uppercase text-gray-500">
                연결된 예약 요청
              </div>
              <div className="mt-2 text-base font-semibold text-gray-900">
                {request.guest_name}
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {request.guest_email}
              </div>
              <Link
                href={`/admin/requests/${request.id}`}
                className="mt-4 inline-flex rounded-lg border border-indigo-300 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
              >
                예약 보기
              </Link>
            </div>
            <EmailComposer
              request={request}
              templates={templates}
              mode="follow_up"
              bare
            />
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <div className="text-xs font-bold uppercase text-gray-500">
              답장
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              아직 예약 요청과 연결되지 않은 메일입니다. 템플릿 답장을 보내려면
              먼저 같은 이메일 주소의 예약 요청과 연결되어야 합니다.
            </p>
            <a
              href={`mailto:${message.from_email}?subject=${encodeURIComponent(
                `Re: ${message.subject || ""}`
              )}`}
              className="mt-4 inline-flex rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              메일 앱에서 답장
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
