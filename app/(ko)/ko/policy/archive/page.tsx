import { KoHeader } from "@/components/ko/ko-header";
import { KoFooter } from "@/components/ko/ko-footer";
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
    canonical: "/ko/policy/archive",
    languages: {
      en: "/policies/archive",
      ko: "/ko/policy/archive",
    },
  },
};

export default function PolicyArchiveKoPage() {
  return (
    <>
      <KoHeader />
      <main className="mx-auto max-w-3xl px-5 pb-20 pt-8 md:px-0 md:pt-14">
      <div className="mb-8">
        <h1 className="text-[28px] font-extrabold tracking-[-0.8px] md:text-[40px]">
          이용 약관 보관소
        </h1>
        <p className="mt-2 text-[15px] leading-[1.7] text-[#3A3F43]">
          손님의 숙박에 적용되는 약관은 예약 요청을 제출한 시점에 유효했던
          버전입니다. 아래에서 해당 버전을 확인하실 수 있습니다.
        </p>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <Link
          href="/ko/policy"
          className="text-sm font-semibold text-[#16181A] underline"
        >
          ← 현재 약관으로 돌아가기
        </Link>
        <Link
          href="/policies/archive"
          className="text-sm font-semibold text-[#16181A] underline"
          hrefLang="en"
        >
          View in English →
        </Link>
      </div>

      <ol className="border-t border-[#16181A]">
        {POLICY_VERSIONS.map((v) => {
          const isCurrent = !v.effectiveTo;
          const href = isCurrent
            ? "/ko/policy"
            : `/ko/policy/archive/${v.slug}`;
          return (
            <li
              key={v.id}
              className="border-b border-[#DCDEE0] py-6"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <h2 className="text-lg font-extrabold">
                  {formatEffectiveRange(v, "ko")}
                </h2>
                {isCurrent && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold text-[#1F7A4D] border border-[#1F7A4D]">
                    현재 적용
                  </span>
                )}
              </div>
              <p className="mt-3 text-[15px] leading-[1.7] text-[#3A3F43]">
                {v.summaryKo}
              </p>
              <div className="mt-4">
                <Link
                  href={href}
                  className="inline-flex items-center text-sm font-semibold text-[#16181A] underline"
                >
                  {isCurrent ? "현재 약관 보기" : "이 버전 보기"} →
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
    </main>
      <KoFooter />
    </>
  );
}
