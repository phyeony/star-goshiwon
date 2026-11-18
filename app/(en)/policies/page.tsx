import type { Metadata } from "next";
import Link from "next/link";
import { SectionTitle } from "@/components/section-title";
import { siteConfig } from "@/lib/site-data";
import { PoliciesContent } from "@/components/policies-content";
import { getEconomyTier } from "@/lib/queries";
import {
  CURRENT_POLICY_VERSION,
  ARCHIVED_POLICY_VERSIONS,
  formatPolicyDate,
} from "@/lib/policy-versions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Policies",
  description:
    "Booking, payment, cancellation and refund policy, house rules, and check-in details for Seoul Goshiwon by Star Goshiwon.",
  alternates: {
    canonical: "/policies",
    languages: {
      en: "/policies",
      ko: "/policies/ko",
    },
  },
};

const sections = [
  { id: "booking", label: "Booking & Confirmation" },
  { id: "payment", label: "Payment" },
  { id: "cancellation", label: "Cancellation & Refund" },
  { id: "changes", label: "Date Changes & Extensions" },
  { id: "checkin", label: "Check-in / Check-out" },
  { id: "deposit", label: "Security Deposit & Damages" },
  { id: "house-rules", label: "House Rules" },
  { id: "men-only", label: "Men-Only Residence" },
  { id: "liability", label: "Personal Property & Liability" },
  { id: "room-access", label: "Room Access Without Prior Consent" },
  { id: "termination", label: "Termination by Management" },
  { id: "belongings", label: "Handling of Personal Belongings After Non-Payment" },
  { id: "force-majeure", label: "Force Majeure" },
  { id: "privacy", label: "Privacy & Data" },
  { id: "updates", label: "Updates to These Policies" },
];

export default async function PoliciesPage() {
  const tier = await getEconomyTier();
  const discountPct = Math.round(tier.discount * 100);
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <SectionTitle
        title="Policies"
        subtitle="The rules of the house and how bookings, payments, and refunds work. Please read before submitting a booking request."
      />

      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <p className="text-sm text-gray-500">
          Effective from{" "}
          <strong>
            {formatPolicyDate(CURRENT_POLICY_VERSION.effectiveFrom, "en")}
          </strong>
          . By submitting a booking request you agree to the policies below.
        </p>
        <Link
          href="/policies/ko"
          className="text-sm font-medium text-indigo-600 hover:underline"
          hrefLang="ko"
        >
          한국어로 보기 →
        </Link>
      </div>
      {ARCHIVED_POLICY_VERSIONS.length > 0 && (
        <p className="text-sm text-gray-500 mb-8">
          Booked before{" "}
          {formatPolicyDate(CURRENT_POLICY_VERSION.effectiveFrom, "en")}?{" "}
          <Link
            href="/policies/archive"
            className="font-medium text-indigo-600 hover:underline"
          >
            View previous versions →
          </Link>
        </p>
      )}

      <nav
        aria-label="Policy sections"
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-10"
      >
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
          On this page
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

      <PoliciesContent discountPct={discountPct} />

      <div className="mt-12 bg-indigo-50 rounded-2xl border border-indigo-100 p-8 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Questions about a specific situation?
        </h3>
        <p className="text-base text-gray-600 mb-6">
          Tell us your dates and circumstances — we&rsquo;ll give you a clear
          answer before you book.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={`mailto:${siteConfig.email}`}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition duration-150 ease-in-out"
          >
            Email Us
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
