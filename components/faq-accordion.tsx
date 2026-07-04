"use client";

import posthog from "posthog-js";
import { posthogEnabled } from "@/lib/analytics";

interface FaqAccordionProps {
  faqs: { question: string; answer: string }[];
}

// FAQ <details> list that reports which questions guests open, so we learn
// their top objections (faq_opened fires only on expand, not collapse).
export function FaqAccordion({ faqs }: FaqAccordionProps) {
  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <details
          key={index}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 group"
          onToggle={(e) => {
            if (posthogEnabled && (e.target as HTMLDetailsElement).open) {
              posthog.capture("faq_opened", {
                question: faq.question,
                position: index + 1,
              });
            }
          }}
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
  );
}
