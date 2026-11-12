import type { Metadata } from "next";
import Link from "next/link";
import { KoHeader } from "@/components/ko/ko-header";
import { KoFooter } from "@/components/ko/ko-footer";
import { stayTimes } from "@/lib/site-data";
import { koSite } from "@/lib/ko-site";

// Policy for guests who book through the Korean site (/ko): 계좌이체 in KRW,
// monthly stays, contact on KakaoTalk. Guests booking through the English site
// agree to /policies (and its Korean translation at /policies/ko) instead.
const EFFECTIVE_FROM = "2026년 11월 12일";

export const metadata: Metadata = {
  title: "이용 약관",
  description:
    "노량진 고시원 스타고시원의 예약, 계좌이체 결제, 취소 및 환불, 보증금, 하우스 룰 안내입니다.",
  alternates: {
    canonical: "/ko/policy",
    languages: { ko: "/ko/policy", en: "/policies" },
  },
};

const linkClass = "font-semibold text-[#16181A] underline";

const sections = [
  { id: "booking", label: "예약 및 확정" },
  { id: "payment", label: "결제" },
  { id: "cancellation", label: "취소 및 환불" },
  { id: "changes", label: "일정 변경 및 연장" },
  { id: "checkin", label: "입실 / 퇴실" },
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

export default function KoPolicyPage() {
  return (
    <>
      <KoHeader />
      <main className="mx-auto max-w-3xl px-5 pb-20 pt-8 md:px-0 md:pt-14">
      <div className="mb-8">
        <h1 className="text-[28px] font-extrabold tracking-[-0.8px] md:text-[40px]">
          이용 약관
        </h1>
        <p className="mt-2 text-[15px] leading-[1.7] text-[#3A3F43]">
          예약 전에 꼭 확인해 주세요. 스타고시원의 예약, 결제, 환불 방법과
          하우스 룰을 정합니다.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#5A5F63]">
          적용 시작일: <strong>{EFFECTIVE_FROM}</strong>
          . 예약 요청 제출 시 아래 약관에 동의하는 것으로 간주됩니다.
        </p>
        <Link
          href="/policies"
          className="text-sm font-semibold text-[#16181A] underline"
          hrefLang="en"
        >
          View in English →
        </Link>
      </div>
      <nav
        aria-label="약관 목차"
        className="mb-10 border-y border-[#16181A] py-5"
      >
        <h2 className="mb-3 text-[11px] font-semibold tracking-[2px] text-[#5A5F63]">
          목차
        </h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-[15px] md:columns-2 md:gap-10">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="hover:underline">
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="divide-y divide-[#DCDEE0] border-t border-[#DCDEE0]">
        <Section id="booking" title="1. 예약 및 확정">
          <p>
            모든 입실은{" "}
            <Link href="/ko#booking" className={linkClass}>
              예약 요청
            </Link>
            으로 신청합니다. 요청만으로는 결제되지 않으며 방이 확보되지도
            않습니다. 빈 방을 확인한 뒤 남겨주신 휴대폰 번호(카카오톡)로
            연락드립니다.
          </p>
          <ul className="list-disc space-y-1.5 pl-6">
            <li>
              안내드린 계좌로 <strong>첫 달 이용료와 보증금 입금이 확인된 때</strong>{" "}
              예약이 확정됩니다.
            </li>
            <li>
              입금 안내 후 <strong>48시간 이내</strong>에 입금되지 않으면 방이
              다른 분께 안내될 수 있습니다.
            </li>
            <li>
              빈 방이 없거나, 최소 이용 기간에 못 미치거나, 신원 확인이 되지
              않으면 요청을 받지 못할 수 있습니다.
            </li>
            <li>
              최소 이용 기간은 <strong>1개월</strong>입니다.
            </li>
          </ul>
        </Section>

        <Section id="payment" title="2. 결제">
          <p>
            모든 금액은 <strong>원화(₩)로, 계좌이체로 받습니다</strong>. 입금
            계좌와 금액은 예약 요청을 확인한 뒤 카카오톡으로 안내드립니다.
            안내받은 계좌가 아닌 곳으로는 입금하지 마세요.
          </p>
          <ul className="list-disc space-y-1.5 pl-6">
            <li>
              <strong>입실 전:</strong> 첫 달 이용료와 보증금을 함께 입금합니다.
            </li>
            <li>
              <strong>이용 중:</strong> 다음 달 이용료는 매달 입실일과 같은
              날짜 전까지 미리 입금합니다.
            </li>
            <li>
              월 이용료에 전기, 수도, 가스, 인터넷이 포함됩니다. 입실할 때 따로
              내는 현금은 없습니다.
            </li>
            <li>현금영수증 발급이 가능합니다. 입금할 때 말씀해 주세요.</li>
            <li>입금 수수료는 입금하는 분이 부담합니다.</li>
          </ul>
        </Section>

        <Section id="cancellation" title="3. 취소 및 환불">
          <p>
            취소는 카카오톡{" "}
            <a href={koSite.kakaoChatUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
              1:1 채팅
            </a>
            으로 알려주세요. 취소 시점은 저희가 메시지를 받은 시각(한국 시간)
            기준입니다. 아래 환불 비율은 <strong>입금하신 이용료</strong>에
            적용되며, 보증금은 포함되지 않습니다.
          </p>

          <h3 className="mb-3 mt-6 text-base font-extrabold text-[#16181A]">입실 전 취소</h3>
          <div className="-mx-2 overflow-x-auto sm:mx-0">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-y border-[#16181A] bg-[#F3F4F5]">
                  <th className="px-3 py-2 text-left font-semibold">취소 시점</th>
                  <th className="px-3 py-2 text-left font-semibold">이용료 환불</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCDEE0]">
                {[
                  ["입실 30일 이상 전", "100%"],
                  ["입실 15~29일 전", "90%"],
                  ["입실 8~14일 전", "70%"],
                  ["입실 1~7일 전", "50%"],
                  ["입실 당일 / 연락 없이 오지 않음", "0%"],
                ].map(([when, pct]) => (
                  <tr key={when}>
                    <td className="px-3 py-3 align-top">{when}</td>
                    <td className="px-3 py-3 align-top font-semibold">{pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-[#5A5F63]">
            <strong>보증금은 입실 전 취소라면 언제든 전액 돌려드립니다.</strong>
          </p>

          <h3 className="mb-3 mt-8 text-base font-extrabold text-[#16181A]">입실 후 중도 퇴실</h3>
          <ul className="list-disc space-y-1.5 pl-6">
            <li>
              이미 시작된 달의 이용료는 <strong>돌려드리지 않습니다</strong>.
            </li>
            <li>
              다음 달을 이어서 쓰지 않으려면 <strong>퇴실 7일 전까지</strong>{" "}
              알려주세요. 미리 입금하신 다음 달 이용료가 있다면 전액
              돌려드립니다.
            </li>
            <li>
              병원 입원 등 증빙할 수 있는 급한 사정이나{" "}
              <a href="#force-majeure" className={linkClass}>
                불가항력
              </a>
              에 해당하면 따로 검토합니다.
            </li>
          </ul>

          <h3 className="mb-3 mt-8 text-base font-extrabold text-[#16181A]">환불 방법</h3>
          <ul className="list-disc space-y-1.5 pl-6">
            <li>모든 환불은 알려주신 본인 명의 계좌로 이체합니다.</li>
            <li>
              취소 환불은 취소 확인 후 <strong>영업일 기준 3일 이내</strong>에
              보내드립니다.
            </li>
          </ul>
        </Section>

        <Section id="changes" title="4. 일정 변경 및 연장">
          <ul className="list-disc space-y-1.5 pl-6">
            <li>
              <strong>입실일 변경:</strong> 입실 7일 이상 전이고 바뀐 날짜에 빈
              방이 있으면 무료로 바꿔드립니다. 7일 이내라면 다른 분께 방을
              안내하지 않고 바꿀 수 있는 경우가 아니면 위의 취소 기준을
              따릅니다.
            </li>
            <li>
              <strong>연장:</strong> 퇴실 예정일 7일 전까지 알려주세요. 빈 방
              여부와 그때의 요금에 따라 정해집니다.
            </li>
          </ul>
        </Section>

        <Section id="checkin" title="5. 입실 / 퇴실">
          <ul className="list-disc space-y-1.5 pl-6">
            <li>
              <strong>입실:</strong> {stayTimes.checkInKo}부터.
            </li>
            <li>
              <strong>퇴실:</strong> 퇴실일 {stayTimes.checkOutKo}까지.
            </li>
            <li>시간이 맞지 않거나 늦게 도착하면 미리 카카오톡으로 알려주세요.</li>
            <li>
              입실할 때 <strong>신분증</strong>(주민등록증, 운전면허증 등)으로
              본인 확인을 합니다.
            </li>
            <li>방 열쇠는 입실할 때 드리며, 퇴실할 때 돌려주셔야 합니다.</li>
          </ul>
        </Section>

        <Section id="deposit" title="6. 보증금 및 손해 배상">
          <ul className="list-disc space-y-1.5 pl-6">
            <li>
              보증금은 방 페이지에 안내된 금액이며, 첫 달 이용료와 함께
              입금합니다. 방 손상, 분실 물품, 밀린 이용료에 대한 담보로
              보관합니다.
            </li>
            <li>
              퇴실하는 날 방 상태를 확인하고, 손상이 없고 열쇠와 비품이 모두
              반환되었다면 <strong>본인 명의 계좌로 바로 전액</strong>{" "}
              돌려드립니다. 늦어도 <strong>영업일 기준 3일 이내</strong>에
              보내드립니다.
            </li>
            <li>
              공제할 금액이 있으면 사진과 함께 항목별로 먼저 알려드립니다. 예:
              가구 파손이나 분실, 벽이나 비품 손상, 과도한 청소가 필요한 상태,
              실내 흡연.
            </li>
            <li>수리나 교체 비용이 보증금보다 크면 차액은 따로 청구합니다.</li>
            <li>
              퇴실 절차 없이 방을 비우고 퇴실 예정일로부터 7일 넘게 연락이
              안 되면, 청소비, 열쇠 교체비, 남은 물품 처리 비용으로 보증금이
              차감될 수 있습니다.
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
            스타고시원은 <strong>남성 전용</strong> 시설입니다. 남성만 입실할
            수 있으며, 객실의 공유, 전대(서브리스), 양도는
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
              이는 손님의 개인 물품을 보장하지 않습니다. 별도의 보험
              가입을 권합니다.
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
            물품을 폐기하기 전에 남겨주신 휴대폰 번호와 카카오톡으로
            연락을 시도합니다.
          </p>
        </Section>

        <Section id="force-majeure" title="13. 불가항력">
          <p>
            자연재해, 정부 명령, 공중 보건 조치, 사회적 혼란, 화재, 또는
            48시간 이내에 복구 불가능한 건물 전체 단전·단수 등 합리적
            통제 범위를 벗어난 사유로 숙박이 불가능하거나 단축될 경우,
            사용하지 않은 숙박일에 대한 요금을 표준 취소 패널티 없이 원가
            기준으로 환불해 드립니다. 이사, 대체 숙소 등 부수적
            비용에 대해서는 책임지지 않습니다.
          </p>
        </Section>

        <Section id="privacy" title="14. 개인정보 처리">
          <ul className="list-disc space-y-1.5 pl-6">
            <li>
              <strong>수집 항목:</strong> 이름, 휴대폰 번호, 입실 희망일과 기간,
              요청 사항. 입실할 때는 신분증으로 본인 확인을 하고, 환불을 위해
              계좌 정보를 받습니다.
            </li>
            <li>
              <strong>이용 목적:</strong> 예약 문의 답변, 빈 방 및 입금 안내,
              입실 관리, 보증금 환불.
            </li>
            <li>
              <strong>보유 기간:</strong> 문의 처리 후 1년. 입실한 경우 계약 및
              세금 관련 법령이 정한 기간 동안 보관합니다.
            </li>
            <li>개인정보를 마케팅 목적으로 다른 곳에 팔거나 넘기지 않습니다.</li>
            <li>
              열람이나 삭제를 원하시면 카카오톡{" "}
              <a href={koSite.kakaoChatUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                1:1 채팅
              </a>
              으로 요청해 주세요. 법령상 보관해야 하는 자료는 제외됩니다.
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

      <div className="mt-12 bg-[#F3F4F5] p-6 text-center md:p-8">
        <h3 className="mb-2 text-xl font-extrabold">궁금한 점이 있으신가요?</h3>
        <p className="mb-5 text-[15px] text-[#3A3F43]">
          예약 요청에 상황을 적어 주시면 확인 후 카카오톡으로 안내해 드립니다.
        </p>
        <Link
          href="/ko#booking"
          className="inline-flex h-12 items-center justify-center bg-[#16181A] px-8 text-[15px] font-extrabold text-white"
        >
          예약 요청하기
        </Link>
      </div>
    </main>
      <KoFooter />
    </>
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
      className="scroll-mt-20 py-8 md:py-10"
    >
      <h2 className="mb-4 text-xl font-extrabold tracking-[-0.4px] md:text-2xl">
        {title}
      </h2>
      <div className="space-y-4 text-[15px] leading-[1.75] text-[#3A3F43]">
        {children}
      </div>
    </section>
  );
}
