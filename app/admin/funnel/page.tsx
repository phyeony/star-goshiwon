import Link from "next/link";
import { getFunnelData } from "@/lib/queries";
import {
  buildFunnelReport,
  INQUIRY_GAP_DAYS,
  LOST_OUTCOMES,
  OUTCOME_LABELS,
  STAGES,
  type Breakdown,
  type Outcome,
} from "@/lib/funnel";
import { roomNameKo } from "@/lib/room-names";
import { formatUSD } from "@/lib/pricing";
import { BookingStatusBadge } from "@/components/status-badge";
import { PAYMENT_STATUS_LABELS_KO } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "예약 전환 분석",
};

const RANGES = [
  { key: "30", label: "최근 30일", days: 30 },
  { key: "90", label: "최근 90일", days: 90 },
  { key: "all", label: "전체", days: null },
] as const;

const OUTCOME_ORDER: Outcome[] = [
  "stayed",
  "upcoming",
  "open",
  "no_reply",
  "went_quiet",
  "unpaid_link",
  "declined",
];

function pct(part: number, whole: number) {
  if (whole === 0) return "–";
  return `${Math.round((part / whole) * 100)}%`;
}

function hours(value: number | null) {
  if (value === null) return "–";
  if (value < 1) return "1시간 미만";
  if (value < 48) return `${Math.round(value)}시간`;
  return `${Math.round(value / 24)}일`;
}

function roomLabel(slug: string) {
  return roomNameKo({ slug, name: slug, name_ko: null });
}

function BreakdownTable({ title, rows }: { title: string; rows: Breakdown[] }) {
  const max = Math.max(1, ...rows.map((r) => r.inquiries));
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">{row.label}</span>
              <span className="text-gray-500">
                {row.paid}/{row.inquiries}명 결제 ·{" "}
                <span className="font-semibold text-gray-900">
                  {pct(row.paid, row.inquiries)}
                </span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-indigo-200"
                style={{ width: `${(row.inquiries / max) * 100}%` }}
              >
                <div
                  className="h-full bg-indigo-600"
                  style={{
                    width: `${row.inquiries ? (row.paid / row.inquiries) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AdminFunnelPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const range = RANGES.find((r) => r.key === rangeParam) ?? RANGES[2];
  const now = new Date();
  const today = now.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const from = range.days
    ? new Date(now.getTime() - range.days * 24 * 60 * 60 * 1000).toISOString()
    : undefined;

  const { requests, firstEmail } = await getFunnelData({ from });
  const report = buildFunnelReport(requests, firstEmail, roomLabel, today);
  const total = report.stageCounts[0];
  const lost = LOST_OUTCOMES.reduce((n, o) => n + report.outcomeCounts[o], 0);
  const biggestLeak = [...LOST_OUTCOMES].sort(
    (a, b) => report.outcomeCounts[b] - report.outcomeCounts[a]
  )[0];

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
        예약 전환 분석
      </h1>
      <p className="text-gray-500 mb-6">
        예약 요청이 실제 결제와 입실로 이어지는 비율. 같은 이메일로 {INQUIRY_GAP_DAYS}
        일 안에 들어온 요청은 고객 1명으로 묶어 계산합니다.
      </p>

      <div className="flex flex-wrap gap-2 mb-8">
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={r.key === "all" ? "/admin/funnel" : `/admin/funnel?range=${r.key}`}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
              r.key === range.key
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">이 기간에는 예약 요청이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">예약 요청</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{total}명</p>
              <p className="text-sm text-gray-500 mt-1">요청서 {report.requestCount}건</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">결제 전환율</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">
                {pct(report.stageCounts[3], total)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {report.stageCounts[3]}명 결제 · 입실 {report.stageCounts[4]}명
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">PayPal 결제액</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">
                {formatUSD(report.paidRevenueUsd)}
              </p>
              <p className="text-sm text-gray-500 mt-1">기타 결제는 제외</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm text-gray-500">첫 답장까지 (중앙값)</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">
                {hours(report.medianHoursToReply)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                24시간 내 답장 {pct(report.repliedWithin24h.within, total)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">전환 단계</h2>
            <p className="text-sm text-gray-500 mb-5">
              고객이 도달한 가장 먼 단계 기준. 오른쪽 숫자는 이전 단계 대비 비율입니다.
            </p>
            <div className="space-y-4">
              {STAGES.map((stage, idx) => {
                const count = report.stageCounts[idx];
                const prev = idx === 0 ? total : report.stageCounts[idx - 1];
                return (
                  <div key={stage.key}>
                    <div className="flex justify-between items-baseline text-sm mb-1">
                      <span className="font-medium text-gray-900">
                        {idx + 1}. {stage.label}
                      </span>
                      <span className="text-gray-500">
                        <span className="font-semibold text-gray-900">{count}명</span>
                        {" · 전체의 "}
                        {pct(count, total)}
                        {idx > 0 && (
                          <>
                            {" · 이전 단계의 "}
                            <span
                              className={
                                prev > 0 && count / prev < 0.5
                                  ? "font-semibold text-red-600"
                                  : "font-semibold text-gray-900"
                              }
                            >
                              {pct(count, prev)}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="h-6 rounded-lg bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-lg bg-indigo-600"
                        style={{ width: `${(count / total) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">고객별 결과</h2>
              <p className="text-sm text-gray-500 mb-4">
                놓친 고객 {lost}명
                {lost > 0 && (
                  <> · 가장 큰 원인: {OUTCOME_LABELS[biggestLeak]}</>
                )}
              </p>
              <ul className="divide-y divide-gray-100">
                {OUTCOME_ORDER.map((o) => (
                  <li key={o} className="flex justify-between py-2 text-sm">
                    <span
                      className={
                        LOST_OUTCOMES.includes(o) ? "text-red-700" : "text-gray-700"
                      }
                    >
                      {OUTCOME_LABELS[o]}
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {report.outcomeCounts[o]}명{" "}
                      <span className="text-gray-400 font-normal">
                        {pct(report.outcomeCounts[o], total)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">속도</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-700">요청 → 첫 이메일 답장 (중앙값)</dt>
                  <dd className="font-semibold text-gray-900">
                    {hours(report.medianHoursToReply)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-700">이메일 답장 받은 고객</dt>
                  <dd className="font-semibold text-gray-900">
                    {report.repliedWithin24h.replied}명 / {total}명
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-700">결제 링크 → 결제 (중앙값)</dt>
                  <dd className="font-semibold text-gray-900">
                    {hours(report.medianHoursLinkToPaid)}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-gray-400 mt-4">
                왓츠앱 등 이메일 외 답장은 기록되지 않아 포함되지 않습니다.
              </p>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            어떤 요청이 결제로 이어지나
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <BreakdownTable title="객실 타입" rows={report.byRoom} />
            <BreakdownTable title="숙박 기간" rows={report.byNights} />
            <BreakdownTable title="예약 시점 (입실일 기준)" rows={report.byLeadTime} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                상태 정리 필요 ({report.cleanup.length}건)
              </h2>
              <p className="text-sm text-gray-500">
                입실일이 지났는데 아직 신규·검토·연락 중이거나 결제 대기인 요청입니다.
                결과에 맞게 확정·거절·종료로 바꿔 두면 위 수치가 정확해집니다.
              </p>
            </div>
            {report.cleanup.length === 0 ? (
              <div className="p-8 text-center text-gray-500">정리할 요청이 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                        고객
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                        숙박 일정
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                        상태
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                        결제
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.cleanup.map((req) => (
                      <tr
                        key={req.id}
                        className="group border-b border-gray-100 hover:bg-gray-50 transition"
                      >
                        <td className="p-0">
                          <Link href={`/admin/requests/${req.id}`} className="block px-6 py-3">
                            <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
                              {req.guest_name}
                            </span>
                            <p className="text-xs text-gray-500">{roomLabel(req.room_slug)}</p>
                          </Link>
                        </td>
                        <td className="p-0">
                          <Link
                            href={`/admin/requests/${req.id}`}
                            className="block px-6 py-3 text-sm text-gray-500"
                          >
                            {req.check_in_date} → {req.check_out_date}
                          </Link>
                        </td>
                        <td className="p-0">
                          <Link href={`/admin/requests/${req.id}`} className="block px-6 py-3">
                            <BookingStatusBadge status={req.status} />
                          </Link>
                        </td>
                        <td className="p-0">
                          <Link
                            href={`/admin/requests/${req.id}`}
                            className="block px-6 py-3 text-sm text-gray-500"
                          >
                            {PAYMENT_STATUS_LABELS_KO[req.payment_status]}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
