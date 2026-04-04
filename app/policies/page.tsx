import type { Metadata } from "next";
import { SectionTitle } from "@/components/section-title";
import { policies } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Policies",
  description:
    "Cancellation policy, house rules, and check-in/check-out information for Seoul Stay Goshiwon.",
};

export default function PoliciesPage() {
  const sections = [
    policies.cancellation,
    policies.houseRules,
    policies.checkInOut,
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <SectionTitle
        title="Policies"
        subtitle="Please review our policies before making a booking request."
      />

      <div className="space-y-8">
        {sections.map((section) => (
          <div
            key={section.title}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {section.title}
            </h2>
            <div className="text-base text-gray-600 whitespace-pre-line">
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
