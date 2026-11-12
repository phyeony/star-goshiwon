import type { Metadata } from "next";
import { SectionTitle } from "@/components/section-title";
import { FaqAccordion } from "@/components/faq-accordion";
import { TrackLink } from "@/components/analytics/track-link";
import { buildFaqs, siteConfig } from "@/lib/site-data";
import { getEconomyTier } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about goshiwon living in Seoul. Learn about deposits, documents, house rules, and more.",
};

export default async function FAQPage() {
  const tier = await getEconomyTier();
  const faqs = buildFaqs(Math.round(tier.discount * 100));
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <SectionTitle
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about living at Seoul Goshiwon by Star Goshiwon."
      />

      <FaqAccordion faqs={faqs} />

      <div className="mt-12 bg-indigo-50 rounded-2xl border border-indigo-100 p-8 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Still have questions?
        </h3>
        <p className="text-base text-gray-600 mb-6">
          We&rsquo;re happy to help. Reach out anytime.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <TrackLink
            event="contact_clicked"
            properties={{ channel: "email", location: "faq" }}
            href={`mailto:${siteConfig.email}`}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition duration-150 ease-in-out"
          >
            Email Us
          </TrackLink>
          <TrackLink
            event="contact_clicked"
            properties={{ channel: "whatsapp", location: "faq" }}
            href={siteConfig.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out"
          >
            WhatsApp
          </TrackLink>
        </div>
      </div>
    </div>
  );
}
