import Link from "next/link";
import { notFound } from "next/navigation";
import { BotStateControl, QuickReplies, ResendButton, RunActions, SimulatorComposer, TestBookingLink } from "@/components/admin/whatsapp-controls";
import {
  datesToCheck,
  freeRoomsFor,
  getConversationDetail,
  recentBookingRequests,
  type AdminMessage,
  type AdminRun,
  type FreeRoomType,
} from "@/lib/whatsapp/admin-queries";
import { CATEGORY_LABEL, MEN_ONLY_LABEL, OUTCOME_LABEL, SENDER_LABEL, reasonLabel } from "@/lib/whatsapp/admin-labels";
import { estimateCostUsd } from "@/lib/whatsapp-agent/model-prices";
import { QUICK_REPLIES, canSendText } from "@/lib/whatsapp/quick-replies";
import { isSimulatedPhone } from "@/lib/whatsapp/simulator";
import { WhatsAppOutageBanner } from "../banner";

// "토큰 1,234+210 (약 $0.0002)", or "" when the model wasn't called.
function tokenText(r: AdminRun): string {
  if (!r.input_tokens && !r.output_tokens) return "";
  const n = (v: number) => v.toLocaleString("ko-KR");
  const cost = estimateCostUsd(r.model, {
    input: r.input_tokens,
    cachedInput: r.cached_input_tokens,
    output: r.output_tokens,
  });
  return `토큰 ${n(r.input_tokens)}+${n(r.output_tokens)}${cost === null ? "" : ` (약 $${cost.toFixed(4)})`}`;
}

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  } catch {
    return iso;
  }
}

type Entry = { kind: "message"; m: AdminMessage } | { kind: "run"; r: AdminRun };

// Each agent run goes right after the guest messages it handled, so the
// manager reads: guest messages → what the AI made of them → what was sent.
function timeline(messages: AdminMessage[], runs: AdminRun[]): Entry[] {
  const byId = new Map(runs.map((r) => [r.id, r]));
  const placed = new Set<string>();
  const out: Entry[] = [];
  messages.forEach((m, i) => {
    out.push({ kind: "message", m });
    const next = messages[i + 1];
    if (m.run_id && byId.has(m.run_id) && !placed.has(m.run_id) && next?.run_id !== m.run_id) {
      out.push({ kind: "run", r: byId.get(m.run_id)! });
      placed.add(m.run_id);
    }
  });
  for (const r of runs) if (!placed.has(r.id)) out.push({ kind: "run", r });
  return out;
}

const BUBBLE: Record<string, string> = {
  guest: "bg-white border-gray-200 mr-12",
  bot: "bg-emerald-50 border-emerald-200 ml-12",
  manager: "bg-indigo-50 border-indigo-200 ml-12",
};

export default async function WhatsAppChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getConversationDetail(id);
  if (!detail) notFound();
  const { conversation: c, messages, runs, booking } = detail;
  const wantsDocument = runs.some((r) => r.outcome === "send_document_pending");
  const dates = datesToCheck(runs, booking);
  const freeRooms = dates ? await freeRoomsFor(dates.checkIn, dates.checkOut, dates.roomSlug) : null;
  const lastGuest = [...messages].reverse().find((m) => m.sender === "guest");
  const windowOpen = canSendText(lastGuest?.sent_at ?? null);

  const isTest = isSimulatedPhone(c.wa_phone);
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 space-y-4">
        <Link href="/admin/whatsapp" className="text-sm font-medium text-indigo-700 hover:text-indigo-800">
          WhatsApp으로 돌아가기
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          {c.profile_name || "(이름 없음)"}{" "}
          <span className="text-base font-normal text-gray-500">{isTest ? "테스트 채팅" : `+${c.wa_phone}`}</span>
        </h1>
        {isTest && (
          <p className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
            테스트 채팅입니다. AI 답변과 빠른 답장은 저장만 되고 WhatsApp으로 보내지 않습니다.
          </p>
        )}
        <WhatsAppOutageBanner />

        {timeline(messages, runs).map((e) =>
          e.kind === "message" ? (
            <div key={e.m.id} className={`rounded-xl border p-3 ${BUBBLE[e.m.sender]}`}>
              <div className="flex justify-between gap-3 text-xs text-gray-500">
                <span className="font-medium">{SENDER_LABEL[e.m.sender]}</span>
                <span>{formatDate(e.m.sent_at)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                {e.m.body || <span className="text-gray-500">[{e.m.message_type}]</span>}
              </p>
            </div>
          ) : (
            <RunCard
              key={e.r.id}
              r={e.r}
              windowOpen={windowOpen}
              canResend={messages.some((m) => m.run_id === e.r.id && m.sender === "guest" && !m.handled_at)}
            />
          ),
        )}
        {messages.length === 0 && <p className="text-gray-500">메시지가 없습니다.</p>}
        {isTest && (
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-200 p-5 space-y-3">
            <h2 className="font-bold text-gray-900">테스트 메시지 보내기</h2>
            <SimulatorComposer conversationId={c.id} />
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-3">
          <h2 className="font-bold text-gray-900">AI 답변</h2>
          <BotStateControl conversationId={c.id} botState={c.bot_state} pausedUntil={c.paused_until} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-3">
          <h2 className="font-bold text-gray-900">빠른 답장</h2>
          <QuickReplies
            conversationId={c.id}
            replies={QUICK_REPLIES.map(({ key, label, text }) => ({ key, label, text }))}
            windowOpen={windowOpen}
          />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-2 text-sm">
          <h2 className="font-bold text-gray-900">손님</h2>
          <p className="text-gray-700">{MEN_ONLY_LABEL[c.men_only_state]}</p>
          {booking ? (
            <p>
              <Link href={`/admin/requests/${booking.id}`} className="font-medium text-indigo-700 hover:text-indigo-800">
                예약: {booking.guest_name} ({booking.check_in_date} – {booking.check_out_date}, {booking.status})
              </Link>
            </p>
          ) : (
            <p className="text-gray-500">연결된 예약 없음 (예약 폼의 WhatsApp 번호로 자동 연결됩니다)</p>
          )}
          {!isTest && (
          <a
            href={`https://wa.me/${c.wa_phone}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50"
          >
            WhatsApp에서 열기
          </a>
          )}
        </div>
        {isTest && (
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-200 p-5 space-y-2 text-sm">
            <h2 className="font-bold text-gray-900">테스트: 예약 연결</h2>
            <p className="text-gray-600">
              스테이징 예약 요청에 연결하면 AI가 그 예약 상태를 봅니다. 예약 요청 페이지에서 승인하면 확정 손님으로 답합니다.
            </p>
            <TestBookingLink
              conversationId={c.id}
              linkedId={c.booking_request_id}
              options={(await recentBookingRequests()).map((b) => ({
                id: b.id,
                label: `${b.guest_name} · ${b.check_in_date} – ${b.check_out_date} · ${b.status}`,
              }))}
            />
          </div>
        )}
        {dates && freeRooms && <FreeRoomsCard dates={dates} types={freeRooms} />}
        {wantsDocument && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 space-y-2">
            <h2 className="font-bold">거주 확인서 요청</h2>
            <p>AI가 손님에게 &quot;준비해서 보내드리겠다&quot;고 답했습니다. 예약 페이지의 문서 카드에서 확인 후 보내 주세요.</p>
            {booking && (
              <Link
                href={`/admin/requests/${booking.id}#documents`}
                className="inline-flex rounded-lg border border-amber-400 bg-white px-3 py-1.5 font-medium text-amber-900 hover:bg-amber-100"
              >
                확인서 보내러 가기
              </Link>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

// Free rooms for the dates the guest asked about. For the manager only: room
// numbers never go to the guest (the AI gets counts).
function FreeRoomsCard({
  dates,
  types,
}: {
  dates: NonNullable<ReturnType<typeof datesToCheck>>;
  types: FreeRoomType[];
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-3 text-sm">
      <div>
        <h2 className="font-bold text-gray-900">이 날짜 빈방</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {dates.checkIn} – {dates.checkOut} · {dates.from === "guest" ? "손님이 문의한 날짜" : "연결된 예약 날짜"} · 페이지를 열 때 기준
        </p>
      </div>
      {types.map((t) => (
        <div key={t.slug}>
          <p className="font-medium text-gray-900">
            {t.name}{" "}
            <span className={t.freeCount ? "text-emerald-700" : "text-red-700"}>
              {t.freeCount}/{t.units.length} 빈방
            </span>
            {t.slug === dates.roomSlug && <span className="ml-1 text-xs text-indigo-700">문의한 방</span>}
          </p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {t.units.map((u) =>
              u.free ? (
                <li key={u.name} className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800">
                  {u.name}
                </li>
              ) : (
                <li
                  key={u.name}
                  className="rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-gray-400 line-through"
                  title={u.takenBy.map((b) => `${b.guestName || "외부 예약"} (${b.status})`).join(", ")}
                >
                  {u.takenBy[0]?.bookingRequestId ? (
                    <Link href={`/admin/requests/${u.takenBy[0].bookingRequestId}`} className="hover:text-gray-600">
                      {u.name}
                    </Link>
                  ) : (
                    u.name
                  )}
                </li>
              ),
            )}
          </ul>
        </div>
      ))}
      <p className="text-xs text-gray-500">예약을 확정하고 방을 배정하면 다음에 열 때 반영됩니다. 손님에게는 방 번호가 가지 않습니다.</p>
    </div>
  );
}

function RunCard({ r, windowOpen, canResend }: { r: AdminRun; windowOpen: boolean; canResend: boolean }) {
  const u = r.understanding;
  const handedOff = r.outcome === "draft" || r.outcome === "send_check_only";
  return (
    <div className={`rounded-xl border p-4 text-sm ${handedOff ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold text-gray-900">AI: {OUTCOME_LABEL[r.outcome] ?? r.outcome}</span>
        {r.after_hours_notice && <span className="text-xs text-gray-600">(야간 안내 보냄)</span>}
        {u?.categories.map((c) => (
          <span key={c} className="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-700">
            {CATEGORY_LABEL[c] ?? c}
          </span>
        ))}
      </div>
      {u?.guest_message_ko && (
        <p className="mt-2 text-gray-800">
          <span className="text-xs font-medium text-gray-500">번역 </span>
          {u.guest_message_ko}
        </p>
      )}
      {u?.summary_ko && (
        <p className="mt-1 text-gray-800">
          <span className="text-xs font-medium text-gray-500">요약 </span>
          {u.summary_ko}
        </p>
      )}
      {handedOff && (r.reasons.length > 0 || u?.reason_ko) && (
        <div className="mt-2 text-gray-800">
          <span className="text-xs font-medium text-gray-500">넘긴 이유 </span>
          {[...r.reasons.map(reasonLabel), u?.reason_ko].filter(Boolean).join(" · ")}
        </div>
      )}
      {r.error && <p className="mt-2 text-red-700 break-all">AI 오류: {r.error.slice(0, 300)}</p>}
      {r.send_error && <p className="mt-2 text-red-700 break-all">전송 실패: {r.send_error.slice(0, 300)}</p>}
      {r.send_error && r.outgoing && canResend && (
        <div className="mt-2">
          {windowOpen ? (
            <ResendButton runId={r.id} text={r.outgoing} />
          ) : (
            <p className="text-xs text-gray-500">손님의 마지막 메시지 후 24시간이 지나 다시 보낼 수 없습니다.</p>
          )}
        </div>
      )}
      {r.draft && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500">{r.outgoing && !r.send_error && r.outcome === "send" ? "보낸 답변" : "AI 초안 (안 보냄)"}</p>
          <p className="mt-1 whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-3 text-gray-900">{r.draft}</p>
        </div>
      )}
      <div className="mt-3">
        <RunActions
          runId={r.id}
          draft={r.draft}
          rating={r.manager_rating}
          note={r.manager_note}
          betterReply={r.manager_better_reply}
        />
      </div>
      <p className="mt-2 text-xs text-gray-400">
        {[r.model, `${(r.latency_ms / 1000).toFixed(1)}초`, tokenText(r), formatDate(r.created_at)]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </div>
  );
}
