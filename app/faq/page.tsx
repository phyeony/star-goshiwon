import type { Metadata } from "next";
import Link from "next/link";
import { SectionTitle } from "@/components/section-title";
import { faqs, siteConfig } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about goshiwon living in Seoul. Learn about deposits, documents, house rules, and more.",
};

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <SectionTitle
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about living at Seoul Goshiwon by Star Goshiwon."
      />

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <details
            key={index}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 group"
          >
            <summary className="text-lg font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
              {faq.question}
              <svg
                className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <p className="mt-4 text-base text-gray-600">{faq.answer}</p>
          </details>
        ))}
      </div>

      <div className="mt-12 bg-indigo-50 rounded-2xl border border-indigo-100 p-8 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Still have questions?
        </h3>
        <p className="text-base text-gray-600 mb-6">
          We&rsquo;re happy to help. Reach out anytime.
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
