import { notFound } from "next/navigation";
import {
  getBookingRequestById,
  getEmailReceivesForRequest,
  getEmailSendsForRequest,
  getEmailTemplates,
  getRoomUnitAvailability,
} from "@/lib/queries";
import { formatUSD, formatApproxKRW } from "@/lib/pricing";
import { BookingStatusBadge } from "@/components/status-badge";
import { RequestActions } from "@/components/admin/request-actions";
import { EmailHistory } from "@/components/admin/email-history";
import { RoomUnitAssignment } from "@/components/admin/room-unit-assignment";
import { PAYMENT_STATUS_LABELS_KO } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params;
  const [request, templates, emailSends] = await Promise.all([
    getBookingRequestById(id),
    getEmailTemplates(),
    getEmailSendsForRequest(id),
  ]);
  if (!request) notFound();

  const emailReceives = await getEmailReceivesForRequest(
    request.id,
    request.guest_email
  );
  const roomUnitAvailability = request.room_id
    ? await getRoomUnitAvailability(
        request.room_id,
        request.check_in_date,
        request.check_out_date
      )
    : [];

  const checkIn = new Date(request.check_in_date);
  const checkOut = new Date(request.check_out_date);
  const stayDays = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {request.guest_name}님의 예약 요청
        </h1>
        <BookingStatusBadge status={request.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              고객 정보
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  이름
                </dt>
                <dd className="text-base text-gray-900 mt-1">
                  {request.guest_name}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  이메일
                </dt>
                <dd className="text-base text-gray-900 mt-1">
                  <a
                    href={`mailto:${request.guest_email}`}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    {request.guest_email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  인원
                </dt>
                <dd className="text-base text-gray-900 mt-1">
                  {request.guest_count}명
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  접수일시
                </dt>
                <dd className="text-base text-gray-900 mt-1">
                  {new Date(request.created_at).toLocaleString("ko-KR")}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              예약 상세
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  객실
                </dt>
                <dd className="text-base text-gray-900 mt-1">
                  {request.rooms?.name || request.room_slug}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  숙박 기간
                </dt>
                <dd className="text-base text-gray-900 mt-1">
                  {stayDays}일
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  체크인
                </dt>
                <dd className="text-base text-gray-900 mt-1">
                  {request.check_in_date}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  체크아웃
                </dt>
                <dd className="text-base text-gray-900 mt-1">
                  {request.check_out_date}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  침구 세트 (선결제)
                </dt>
                <dd className="text-base text-gray-900 mt-1">
                  {request.bedding_prepaid ? "포함 ($15)" : "미포함"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  예상 총액
                </dt>
                <dd className="text-2xl font-extrabold text-gray-900 mt-1">
                  {formatUSD(request.estimated_total)}
                  <span className="ml-3 text-base font-normal text-gray-500">
                    {formatApproxKRW(request.estimated_total)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  결제 상태
                </dt>
                <dd className="text-base text-gray-900 mt-1">
                  {PAYMENT_STATUS_LABELS_KO[request.payment_status]}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-500 uppercase">
                  결제 수단
                </dt>
                <dd className="text-base text-gray-900 mt-1">
                  {request.payment_provider || "—"}
                </dd>
              </div>
              {request.payment_order_id && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-bold text-gray-500 uppercase">
                    PayPal 주문 ID
                  </dt>
                  <dd className="text-sm text-gray-900 mt-1 break-all">
                    {request.payment_order_id}
                  </dd>
                </div>
              )}
              {request.payment_capture_id && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-bold text-gray-500 uppercase">
                    PayPal 결제 ID
                  </dt>
                  <dd className="text-sm text-gray-900 mt-1 break-all">
                    {request.payment_capture_id}
                  </dd>
                </div>
              )}
              {request.payment_paid_at && (
                <div>
                  <dt className="text-xs font-bold text-gray-500 uppercase">
                    결제 완료 시각
                  </dt>
                  <dd className="text-base text-gray-900 mt-1">
                    {new Date(request.payment_paid_at).toLocaleString("ko-KR")}
                  </dd>
                </div>
              )}
              {request.refund_amount > 0 && (
                <div>
                  <dt className="text-xs font-bold text-gray-500 uppercase">
                    환불 금액
                  </dt>
                  <dd className="text-base text-gray-900 mt-1">
                    {formatUSD(request.refund_amount)}
                    {request.refunded_at && (
                      <span className="ml-2 text-sm text-gray-500">
                        {new Date(request.refunded_at).toLocaleString("ko-KR")}
                      </span>
                    )}
                  </dd>
                </div>
              )}
              {request.payment_expires_at && request.payment_status !== "paid" && (
                <div>
                  <dt className="text-xs font-bold text-gray-500 uppercase">
                    결제 링크 만료
                  </dt>
                  <dd className="text-base text-gray-900 mt-1">
                    {new Date(request.payment_expires_at).toLocaleString("ko-KR")}
                  </dd>
                </div>
              )}
              {request.payment_error && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-bold text-gray-500 uppercase">
                    결제 오류
                  </dt>
                  <dd className="text-sm text-red-700 mt-1">
                    {request.payment_error}
                  </dd>
                </div>
              )}
            </dl>

            {request.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <dt className="text-xs font-bold text-gray-500 uppercase mb-1">
                  고객 메모
                </dt>
                <dd className="text-base text-gray-600 whitespace-pre-line">
                  {request.notes}
                </dd>
              </div>
            )}
          </div>

          <EmailHistory sends={emailSends} receives={emailReceives} />
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          <RoomUnitAssignment
            request={request}
            units={roomUnitAvailability}
          />
          <RequestActions request={request} templates={templates} />
        </div>
      </div>
    </div>
  );
}
