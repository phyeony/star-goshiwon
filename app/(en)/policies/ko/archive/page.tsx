import type { Metadata } from "next";
import Link from "next/link";
import {
  POLICY_VERSIONS,
  formatEffectiveRange,
} from "@/lib/policy-versions";

export const metadata: Metadata = {
  title: "이용 약관 보관소 (Policy Archive)",
  description:
    "스타고시원 서울점 이용 약관의 과거 버전 보관소입니다. 예약하신 날짜에 적용되었던 약관 버전을 확인하실 수 있습니다.",
  alternates: {
    canonical: "/policies/ko/archive",
    languages: {
      en: "/policies/archive",
      ko: "/policies/ko/archive",
    },
  },
};

export default function PolicyArchiveKoPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          이용 약관 보관소
        </h1>
        <p className="mt-2 text-base text-gray-500">
          손님의 숙박에 적용되는 약관은 예약 요청을 제출한 시점에 유효했던
          버전입니다. 아래에서 해당 버전을 확인하실 수 있습니다.
        </p>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <Link
          href="/policies/ko"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          ← 현재 약관으로 돌아가기
        </Link>
        <Link
          href="/policies/archive"
          className="text-sm font-medium text-indigo-600 hover:underline"
          hrefLang="en"
        >
          View in English →
        </Link>
      </div>

      <ol className="space-y-6">
        {POLICY_VERSIONS.map((v) => {
          const isCurrent = !v.effectiveTo;
          const href = isCurrent
            ? "/policies/ko"
            : `/policies/ko/archive/${v.slug}`;
          return (
            <li
              key={v.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900">
                  {formatEffectiveRange(v, "ko")}
                </h2>
                {isCurrent && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    현재 적용
                  </span>
                )}
              </div>
              <p className="text-base text-gray-700 mt-4 leading-relaxed">
                {v.summaryKo}
              </p>
              <div className="mt-4">
                <Link
                  href={href}
                  className="inline-flex items-center text-sm font-medium text-indigo-600 hover:underline"
                >
                  {isCurrent ? "현재 약관 보기" : "이 버전 보기"} →
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
