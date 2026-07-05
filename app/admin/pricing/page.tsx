import { PricingInsight } from "@/components/admin/pricing-insight";

export const metadata = {
  title: "요금 분석",
};

export default function AdminPricingPage() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
        요금 분석
      </h1>
      <p className="text-gray-500 mb-6">
        실제 예약 데이터 기준 1박 요금·할인율 시나리오 비교. 자문용이며 실제 요금은 변경되지 않습니다.
      </p>
      <PricingInsight />
    </div>
  );
}
