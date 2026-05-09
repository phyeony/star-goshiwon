import type { Metadata } from "next";
import Link from "next/link";
import { SectionTitle } from "@/components/section-title";
import {
  POLICY_VERSIONS,
  formatEffectiveRange,
} from "@/lib/policy-versions";

export const metadata: Metadata = {
  title: "Policy Archive",
  description:
    "Past versions of the Seoul Goshiwon by Star Goshiwon policies. Find the version that was in effect on the date you booked.",
  alternates: {
    canonical: "/policies/archive",
    languages: {
      en: "/policies/archive",
      ko: "/policies/ko/archive",
    },
  },
};

export default function PolicyArchivePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <SectionTitle
        title="Policy Archive"
        subtitle="The version of the policies that applies to your stay is the version that was in effect on the date you submitted your booking request."
      />

      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <Link
          href="/policies"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          ← Back to current policy
        </Link>
        <Link
          href="/policies/ko/archive"
          className="text-sm font-medium text-indigo-600 hover:underline"
          hrefLang="ko"
        >
          한국어로 보기 →
        </Link>
      </div>

      <ol className="space-y-6">
        {POLICY_VERSIONS.map((v) => {
          const isCurrent = !v.effectiveTo;
          const href = isCurrent ? "/policies" : `/policies/archive/${v.slug}`;
          return (
            <li
              key={v.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900">
                  {formatEffectiveRange(v, "en")}
                </h2>
                {isCurrent && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    Current
                  </span>
                )}
              </div>
              <p className="text-base text-gray-700 mt-4 leading-relaxed">
                {v.summary}
              </p>
              <div className="mt-4">
                <Link
                  href={href}
                  className="inline-flex items-center text-sm font-medium text-indigo-600 hover:underline"
                >
                  {isCurrent ? "View current policy" : "View this version"} →
                </Link>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
