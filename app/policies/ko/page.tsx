import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-data";
import {
  CURRENT_POLICY_VERSION,
  ARCHIVED_POLICY_VERSIONS,
  formatPolicyDate,
} from "@/lib/policy-versions";

export const metadata: Metadata = {
  title: "이용 약관 (Policies)",
  description:
    "스타고시원 서울점의 예약, 결제, 취소 및 환불 정책, 하우스 룰, 체크인 안내입니다.",
  alternates: {
    canonical: "/policies/ko",
    languages: {
      en: "/policies",
      ko: "/policies/ko",
    },
  },
};

const sections = [
  { id: "booking", label: "예약 및 확정" },
  { id: "payment", label: "결제" },
  { id: "cancellation", label: "취소 및 환불" },
  { id: "changes", label: "일정 변경 및 연장" },
  { id: "checkin", label: "체크인 / 체크아웃" },
  { id: "deposit", label: "보증금 및 손해 배상" },
  { id: "house-rules", label: "하우스 룰" },
  { id: "men-only", label: "남성 전용 시설" },
  { id: "liability", label: "개인 물품 및 책임" },
  { id: "room-access", label: "사전 동의 없는 객실 출입" },
  { id: "termination", label: "관리자에 의한 계약 해지" },
  { id: "belongings", label: "미납에 따른 개인 물품 처리" },
  { id: "force-majeure", label: "불가항력" },
  { id: "privacy", label: "개인정보 처리" },
  { id: "updates", label: "약관 변경" },
];

export default function PoliciesKoPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          이용 약관
        </h1>
        <p className="mt-2 text-base text-gray-500">
          예약 전에 반드시 확인해 주세요. 본 페이지의 내용은 스타고시원 서울점의
          하우스 룰, 결제 방식, 환불 정책을 규정합니다.
        </p>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <p className="text-sm text-gray-500">
          적용 시작일:{" "}
          <strong>
            {formatPolicyDate(CURRENT_POLICY_VERSION.effectiveFrom, "ko")}
          </strong>
          . 예약 요청 제출 시 아래 약관에 동의하는 것으로 간주됩니다.
        </p>
        <Link
          href="/policies"
          className="text-sm font-medium text-indigo-600 hover:underline"
          hrefLang="en"
        >
          View in English →
        </Link>
      </div>
      {ARCHIVED_POLICY_VERSIONS.length > 0 && (
        <p className="text-sm text-gray-500 mb-8">
          {formatPolicyDate(CURRENT_POLICY_VERSION.effectiveFrom, "ko")} 이전에
          예약하셨나요?{" "}
          <Link
            href="/policies/ko/archive"
            className="font-medium text-indigo-600 hover:underline"
          >
            이전 버전 보기 →
          </Link>
        </p>
      )}

      <nav
        aria-label="약관 목차"
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-10"
      >
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
          목차
        </h2>
        <ol className="list-decimal pl-5 space-y-1 text-base text-indigo-700">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="hover:underline">
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-10">
        <Section id="booking" title="1. 예약 및 확정">
          <p>
            모든 숙박은{" "}
            <Link
              href="/request-to-book"
              className="text-indigo-600 hover:underline"
            >
              예약 요청 페이지
            </Link>
            에서 신청하며, 요청만으로는 결제가 발생하지 않으며 객실이 확보되지
            않습니다. 모든 요청은 담당자가 검토 후 {siteConfig.responseTime}{" "}
            이내에 답변드립니다.
          </p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>요청 승인 후 발송된 PayPal 결제 링크에서 선결제가 완료된 시점에 예약이 확정됩니다.</li>
            <li>
              결제 링크 발송 후 <strong>48시간 이내</strong>에 결제가
              이루어지지 않을 경우, 해당 객실은 다른 손님에게 안내될 수
              있습니다.
            </li>
            <li>
              객실 미확보, 최소 숙박일 미달, 신원 확인 불가 등의 사유로 요청이
              반려될 수 있습니다.
            </li>
            <li>
              최소 숙박 기간은 <strong>7일 (1주)</strong>입니다.
            </li>
          </ul>
        </Section>

        <Section id="payment" title="2. 결제">
          <p>
            모든 금액은 <strong>USD(미국 달러) 기준으로 PayPal을 통해 결제</strong>
            됩니다. 사이트에 표시된 원화(₩) 금액은 현재 환율 기준의 참고
            금액입니다. PayPal 계정 없이 카드 결제가 표시될 수 있으나, 해당
            옵션은 손님의 위치, PayPal 계정 설정 및 PayPal의 위험 심사에 따라
            달라질 수 있습니다.
          </p>
          <p>
            <strong>모든 금액은 예약 승인 후 PayPal 결제 링크로 선결제됩니다</strong> —
            체크인 시 별도의 현금 결제는 없습니다. 한 번의 PayPal 결제로 다음
            항목이 모두 처리됩니다:
          </p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>전체 숙박 객실료 (4주 이상 숙박 시 15% 할인 적용 후 금액).</li>
            <li>
              <strong>침구 세트 (선택, $15)</strong> — 추가하지 않을 경우
              침구는 제공되지 않습니다.
            </li>
            <li>
              환불 가능한 <strong>$70 보증금</strong> (약 ₩100,000) — 손해
              배상 및 미납 요금을 위한 담보입니다. 객실에 손상이 없는 경우,{" "}
              <strong>퇴실 후 PayPal을 통해</strong> 결제하신 동일 계정으로
              전액 환불해 드립니다. 자세한 내용은{" "}
              <a href="#deposit" className="text-indigo-600 hover:underline">
                보증금 및 손해 배상
              </a>
              {" "}항목을 참고해 주세요.
            </li>
            <li>
              저희는 카드 정보를 저장하지 않습니다. 모든 결제는 PayPal에서
              처리됩니다.
            </li>
            <li>
              은행 또는 카드사가 부과하는 환전 수수료는 환불 대상이 아닙니다.
            </li>
            <li>
              보증금 결제와 환불 사이의 환율 변동은 보상되지 않습니다 — 모든
              결제와 환불은 USD로 정산됩니다.
            </li>
          </ul>
        </Section>

        <Section id="cancellation" title="3. 취소 및 환불 정책">
          <p>
            모든 취소는 서면(이메일{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className="text-indigo-600 hover:underline"
            >
              {siteConfig.email}
            </a>{" "}
            또는 WhatsApp)으로 접수해 주세요. 취소 시점은 저희가 메시지를
            수신한 시각(<strong>한국 표준시, KST</strong>) 기준입니다. 아래
            환불 비율은 <strong>총 객실료(장기 할인 적용 후, 침구비 및
            보증금 제외)</strong>를 기준으로 적용됩니다.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            체크인 전 취소
          </h3>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200">
                  <th className="text-left font-semibold text-gray-900 px-3 py-2">
                    취소 시점
                  </th>
                  <th className="text-left font-semibold text-gray-900 px-3 py-2">
                    객실료 환불 비율
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-3 py-3 align-top">
                    체크인 <strong>30일 이상 전</strong>
                  </td>
                  <td className="px-3 py-3 align-top text-gray-700">
                    <strong>100%</strong>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 align-top">
                    체크인 <strong>15~29일 전</strong>
                  </td>
                  <td className="px-3 py-3 align-top text-gray-700">
                    <strong>90%</strong> (10% 행정 수수료)
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 align-top">
                    체크인 <strong>8~14일 전</strong>
                  </td>
                  <td className="px-3 py-3 align-top text-gray-700">
                    <strong>70%</strong>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 align-top">
                    체크인 <strong>1~7일 전</strong>
                  </td>
                  <td className="px-3 py-3 align-top text-gray-700">
                    <strong>50%</strong>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 align-top">
                    <strong>체크인 당일 / 노쇼</strong>
                  </td>
                  <td className="px-3 py-3 align-top text-gray-700">
                    <strong>0%</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            <strong>$70 보증금은 어떤 경우에도 100% 환불됩니다</strong> —
            취소 시 객실료 공제 후 보증금 전액과 함께 PayPal로 환불해
            드립니다.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
            입실 후 조기 퇴실
          </h3>
          <p>
            체크인 이후에는 객실료가 <strong>환불되지 않습니다</strong>.
            어떠한 사유로든 조기 퇴실 시 잔여 숙박일은 환불되지 않으며, 객실료의
            일부도 반환되지 않습니다.
          </p>
          <ul className="list-disc pl-6 space-y-1.5 mt-3">
            <li>
              <strong>$70 보증금</strong>은 영향을 받지 않으며, 객실에 손상이
              없고 청결하게 정리된 경우 퇴실 후 PayPal로 전액 환불됩니다.
              자세한 내용은{" "}
              <a href="#deposit" className="text-indigo-600 hover:underline">
                보증금 및 손해 배상
              </a>
              {" "}항목을 참고해 주세요.
            </li>
            <li>
              증빙 가능한 의료 응급 상황, 불가항력, 기타 본인의 통제 범위를
              벗어난 중대한 사유는 사안별로 검토됩니다. {" "}
              <a href="#force-majeure" className="text-indigo-600 hover:underline">
                불가항력
              </a>
              {" "}항목을 참고해 주세요.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
            환불 불가 항목
          </h3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              침구가 준비, 개봉, 또는 사용된 후의{" "}
              <strong>$15 침구 비용</strong>.
            </li>
            <li>
              PayPal 및 카드사 결제 수수료, 은행의 환전 스프레드, 결제 처리
              과정에서 원천 징수된 현지 세금.
            </li>
            <li>이미 제공된 부가 서비스 (예: 공항 픽업).</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
            환불 방법 및 지급 시기
          </h3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              취소 환불과 보증금 환불을 포함한 <strong>모든 환불은 PayPal</strong>을
              통해 결제하신 동일 계정 또는 카드로 지급됩니다. 현금 환불은
              제공되지 않습니다.
            </li>
            <li>
              보증금 환불은 객실 점검 후{" "}
              <strong>퇴실일로부터 영업일 기준 3일 이내</strong>에 PayPal에서
              개시됩니다.
            </li>
            <li>
              PayPal 정산은 일반적으로 <strong>영업일 기준 5~10일</strong>이
              소요되며, 은행에 따라 추가 시간이 걸릴 수 있습니다.
            </li>
            <li>
              모든 결제와 환불은 <strong>USD</strong>로 정산됩니다. 결제와 환불
              시점 간의 환율 변동은 보상되지 않습니다.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
            예외적인 상황
          </h3>
          <p>
            의료 응급 상황, 비자 거부, 기타 본인의 통제 범위를 벗어난 중대한
            사유의 경우, 가능한 한 빨리 연락 주십시오. 증빙 서류를 제출해
            주시면 사안별로 검토하여 패널티를 면제하는 경우가 많습니다. {" "}
            <a href="#force-majeure" className="text-indigo-600 hover:underline">
              불가항력
            </a>
            {" "}항목도 함께 참고해 주세요.
          </p>
        </Section>

        <Section id="changes" title="4. 일정 변경 및 연장">
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              <strong>체크인 전 일정 변경:</strong> 체크인 7일 이상 전이고
              새 일정에 객실이 가능한 경우 무료로 변경됩니다. 체크인 7일
              이내인 경우, 객실을 다른 손님에게 재배정하지 않고도 변경 가능한
              경우를 제외하면 위의 취소 일정에 따라 처리됩니다.
            </li>
            <li>
              <strong>숙박 연장:</strong> 예정된 체크아웃일 최소 7일 전에
              연락 주세요. 연장은 객실 가능 여부와 해당 기간의 요금에 따라
              결정됩니다.
            </li>
            <li>
              연장으로 인해 총 숙박 기간이 4주 이상이 되는 경우, 15% 장기
              할인이 전체 숙박에 소급 적용됩니다.
            </li>
          </ul>
        </Section>

        <Section id="checkin" title="5. 체크인 / 체크아웃">
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              <strong>체크인:</strong> 15:00.
            </li>
            <li>
              <strong>늦은 도착:</strong> 가능한 한 빨리 알려주세요.
            </li>
            <li>
              <strong>체크아웃:</strong> 출발일 11:00까지.
            </li>
            <li>
              체크인 시 한국의 외국인 투숙객 등록 규정에 따라{" "}
              <strong>여권</strong>을 지참해 주세요.
            </li>
            <li>
              개인 방키는 체크인 시 발급되며 체크아웃 시 반환해 주셔야 합니다.{" "}
              <strong>체크인 시 별도의 현금 결제는 없습니다</strong> — 모든
              금액은 이미 PayPal로 결제 완료된 상태입니다.
            </li>
          </ul>
        </Section>

        <Section id="deposit" title="6. 보증금 및 손해 배상">
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              <strong>$70 보증금</strong> (약 ₩100,000)은 예약 확정 시
              객실료와 함께 <strong>PayPal로 선결제</strong>됩니다. 손해
              배상, 분실 물품, 미납 요금에 대한 담보로 보관됩니다.
            </li>
            <li>
              객실에 손상이 없고, 모든 키 및 비품이 반환되며, 객실이 적절한
              상태로 정리된 경우, 퇴실 후{" "}
              <strong>영업일 기준 5일 이내</strong>에 결제하신 동일 계정으로{" "}
              <strong>PayPal을 통해 전액 환불</strong>됩니다. PayPal과
              은행 처리 시간을 합하여 통상 환불 개시 후 영업일 기준 5~10일
              내에 입금됩니다.
            </li>
            <li>
              공제가 발생하는 경우 서면으로 항목별 안내드립니다. 예시: 가구
              파손 또는 분실, 벽이나 비품 손상, 과도한 청소가 필요한 상태,
              실내 흡연 등.
            </li>
            <li>
              수리 또는 교체 비용이 보증금을 초과할 경우 차액은 별도로
              청구됩니다. 손상 사진은 공제 확정 전에 손님에게 전달됩니다.
            </li>
            <li>
              체크아웃을 이행하지 않는 경우 (객실 무단 방치, 예정된 체크아웃
              일로부터 7일 이내 연락 두절), 청소비, 키 교체비, 잔여 물품 처리
              비용을 위해 보증금이 전액 차감될 수 있습니다.
            </li>
          </ul>
        </Section>

        <Section id="house-rules" title="7. 하우스 룰">
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              <strong>정숙 시간:</strong> 23:00 ~ 06:00. 벽이 얇고 다른
              입주자들이 공부 또는 취침 중입니다.
            </li>
            <li>
              <strong>실내 흡연 절대 금지</strong> — 객실, 화장실, 복도, 주방,
              세탁실 등 건물 내부 어디에서도 금연입니다. 화재 안전 및 한국법
              규정에 따라 엄격하게 적용됩니다.
            </li>
            <li>
              <strong>반려동물 동반 불가.</strong>
            </li>
            <li>
              <strong>외부인 숙박 불가</strong> — 사전 서면 승인 없이 외부인이
              머물 수 없습니다. 방문객은 22시까지 퇴거해야 하며, 거주자가
              방문객의 행위에 대해 책임을 집니다.
            </li>
            <li>
              <strong>공용 주방 및 세탁실:</strong> 사용 후 정리 정돈, 세탁기 종료 후 빨래 즉시 회수.
            </li>
            <li>
              <strong>쓰레기:</strong> 서울시 분리수거 규정에 따라 일반/음식물
              /재활용으로 구분하여 지정된 장소에 배출.
            </li>
            <li>
              <strong>안전 시설:</strong> 잠금 장치, 화재 경보기, 스프링클러,
              소화기에 손대지 마십시오.
            </li>
            <li>
              <strong>유지 관리:</strong> 누수, 전기 문제, 비품 고장은 즉시
              알려주십시오.
            </li>
            <li>
              마약 사용 또는 소지를 포함한 일체의{" "}
              <strong>불법 행위</strong>는 즉시 계약 해지 사유이며, 잔여
              숙박료 및 보증금이 모두 차감되고, 법령에 따라 관계 기관에
              신고됩니다.
            </li>
          </ul>
        </Section>

        <Section id="men-only" title="8. 남성 전용 시설">
          <p>
            스타고시원 서울점은 <strong>남성 전용</strong> 시설입니다. 모든
            예약은 남성 손님만 가능하며, 객실의 공유, 전대(서브리스), 양도는
            불가능합니다. 이는 한국 대부분의 고시원이 공용 욕실 안전 및
            프라이버시를 위해 성별로 건물이나 층을 분리 운영하는 일반적인
            관행에 따른 것입니다.
          </p>
        </Section>

        <Section id="liability" title="9. 개인 물품 및 책임">
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              각 객실은 개별 잠금 장치가 있습니다. 객실 내부 또는 공용
              공간에서의 개인 물품 분실 및 도난에 대해 시설은 책임지지
              않습니다. 주방이나 세탁실에 귀중품을 두지 마십시오.
            </li>
            <li>
              건물의 화재 및 구조적 위험에 대한 일반 보험에 가입되어 있으나,
              이는 손님의 개인 물품을 보장하지 않습니다. 별도의 여행자 보험
              가입을 권장합니다.
            </li>
            <li>
              손님(또는 방문객)이 객실, 공용 시설, 다른 입주자의 물품에 끼친
              손해는 손님 본인이 책임집니다.
            </li>
            <li>
              <strong>세탁기와 건조기는 손님 본인의 책임 하에 사용</strong>
              합니다. 공용 가전 사용 중 발생하는 의류 또는 직물의 손상에
              대해 시설은 책임지지 않습니다.
            </li>
          </ul>
        </Section>

        <Section id="room-access" title="10. 사전 동의 없는 객실 출입">
          <p>
            아래에 해당하지 않는 경우, 사전 통지 없이 객실에 출입하지
            않습니다. 정기 점검 및 유지보수는 가능한 한 사전에 안내드립니다.
          </p>
          <ol className="list-decimal pl-6 space-y-1.5">
            <li>
              <strong>긴급 상황 또는 즉시 처리해야 할 시설 유지보수</strong>의
              경우 관리자가 객실에 출입할 수 있습니다.
            </li>
            <li>
              위생, 화재 안전, 전기, 방역 등{" "}
              <strong>정기 점검</strong>을 위해 객실을 개방할 수 있습니다.
            </li>
            <li>
              <strong>화재 경보 또는 비상 상황</strong> 발생 시, 권한이 있는
              인원(소방·경찰 포함)이 동의 없이 출입할 수 있습니다.
            </li>
            <li>
              사전 협의 없이 <strong>객실료가 3일 이상 미납</strong>되는 경우,
              계약이 해지되며 객실에 출입할 수 있습니다.
            </li>
          </ol>
        </Section>

        <Section id="termination" title="11. 관리자에 의한 계약 해지">
          <p>
            아래에 해당하는 경우, 시설 관리자는 손님의 숙박을 즉시 종료할 수
            있습니다:
          </p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              <strong>소란 행위</strong> — 과도한 소음, 실내 흡연, 악취,
              폭력, 절도, 불법 행위 등을 포함하되 이에 한정되지 않습니다.
            </li>
            <li>
              다른 입주자나 직원을 위협, 괴롭히거나 안전을 위태롭게 하는 경우.
            </li>
            <li>
              잠금 장치, 화재 경보기, 기타 안전 시설 훼손.
            </li>
            <li>
              예약 또는 체크인 시 신원 허위 기재.
            </li>
            <li>
              사전 협의 없이 객실료가{" "}
              <strong>3일 이상 미납</strong>되는 경우.
            </li>
            <li>
              서면 경고 후에도 반복적으로 하우스 룰을 위반하는 경우.
            </li>
          </ul>
          <p>
            <strong>위와 같은 경우 환불 없이 강제 퇴거가 집행</strong>되며,
            보증금은 손해 배상 또는 미납 요금에 충당될 수 있습니다.{" "}
            <strong>퇴거를 거부할 경우 관련 한국 법령에 따라 법적 조치가
            취해질 수 있습니다.</strong>
          </p>
        </Section>

        <Section id="belongings" title="12. 미납에 따른 개인 물품 처리">
          <ol className="list-decimal pl-6 space-y-1.5">
            <li>
              계약 해지 후, 관리자는 객실에 남아 있는 개인 물품을 반출할 수
              있습니다.
            </li>
            <li>
              미납 상태가 해결되지 않고{" "}
              <strong>3일 이상 지속될 경우</strong> 물품이 폐기될 수 있습니다.
            </li>
            <li>
              폐기된 물품에 대해 손님은 보상을 청구할 수 없습니다.
            </li>
          </ol>
          <p>
            물품을 폐기하기 전에 등록된 이메일과 전화번호로 합리적인 범위에서
            연락을 시도합니다.
          </p>
        </Section>

        <Section id="force-majeure" title="13. 불가항력">
          <p>
            자연재해, 정부 명령, 공중 보건 조치, 사회적 혼란, 화재, 또는
            48시간 이내에 복구 불가능한 건물 전체 단전·단수 등 합리적
            통제 범위를 벗어난 사유로 숙박이 불가능하거나 단축될 경우,
            사용하지 않은 숙박일에 대한 요금을 표준 취소 패널티 없이 원가
            기준으로 환불해 드립니다. 항공편, 비자, 대체 숙소 등 부수적
            비용에 대해서는 책임지지 않습니다.
          </p>
        </Section>

        <Section id="privacy" title="14. 개인정보 처리">
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              예약 신청을 통해 제출하신 정보(이름, 연락처, 일정, 체크인 시
              여권 사본)는 예약 관리, 외국인 투숙객 등록 의무 이행, 숙박 관련
              연락 목적으로만 사용됩니다.
            </li>
            <li>
              개인정보를 마케팅 목적으로 제3자에게 판매하거나 공유하지
              않습니다. 결제 정보는 PayPal의 자체 개인정보 처리 방침에 따라
              처리되며, 저희는 손님의 카드 번호 전체를 확인할 수 없습니다.
            </li>
            <li>
              숙박 종료 후 예약 정보 삭제를 원하시는 경우{" "}
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-indigo-600 hover:underline"
              >
                {siteConfig.email}
              </a>
              로 요청해 주세요. 단, 법령상 보관 의무가 있는 자료는 제외됩니다.
            </li>
          </ul>
        </Section>

        <Section id="updates" title="15. 약관 변경">
          <p>
            본 약관은 수시로 업데이트될 수 있습니다. 손님의 숙박에 적용되는
            약관은 예약 요청을 제출한 시점에 유효한 버전이며, 이후의 변경
            사항은 기존 예약에 소급 적용되지 않습니다.
          </p>
        </Section>
      </div>

      <div className="mt-12 bg-indigo-50 rounded-2xl border border-indigo-100 p-8 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          특정 상황에 대해 문의하고 싶으신가요?
        </h3>
        <p className="text-base text-gray-600 mb-6">
          예정 일정과 상황을 알려 주시면 예약 전에 명확하게 안내해
          드리겠습니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={`mailto:${siteConfig.email}`}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition duration-150 ease-in-out"
          >
            이메일 문의
          </a>
          <a
            href={siteConfig.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 scroll-mt-24"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
        {title}
      </h2>
      <div className="text-base text-gray-700 space-y-4 leading-relaxed">
        {children}
      </div>
    </section>
  );
}
