import type { Metadata } from "next";
import { SectionTitle } from "@/components/section-title";
import { siteConfig } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Seoul Goshiwon by Star Gositel. Reach us by email or WhatsApp.",
};

const contactMethods = [
  {
    title: "Email",
    description: "Best for booking inquiries and detailed questions.",
    value: siteConfig.email,
    href: `mailto:${siteConfig.email}`,
    badge: "Booking Channel",
  },
  {
    title: "WhatsApp",
    description: "Quick questions and general inquiries.",
    value: "Chat with us",
    href: siteConfig.whatsapp,
    badge: "Inquiry Only",
  },
];

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <SectionTitle
        title="Contact Us"
        subtitle="Have a question or ready to book? Reach out through any of the channels below."
      />

      <div className="space-y-4">
        {contactMethods.map((method) => (
          <a
            key={method.title}
            href={method.href}
            target={method.href.startsWith("http") ? "_blank" : undefined}
            rel={
              method.href.startsWith("http")
                ? "noopener noreferrer"
                : undefined
            }
            className="block bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition duration-150 ease-in-out"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {method.title}
                </h3>
                <p className="text-base text-gray-500 mt-1">
                  {method.description}
                </p>
                <p className="text-indigo-600 font-medium mt-2">
                  {method.value}
                </p>
              </div>
              {method.badge && (
                <span className="inline-block py-1 px-3 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold border border-indigo-100">
                  {method.badge}
                </span>
              )}
            </div>
          </a>
        ))}
      </div>

      <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Visit Us</h3>
        <p className="text-lg font-semibold text-gray-800">Star Gositel</p>
        <p className="text-base text-gray-600 mt-1">{siteConfig.address}</p>
        <p className="text-sm text-gray-500 mt-2">
          Walk-ins welcome during business hours: 9 AM – 9 PM KST
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
          <a
            href={siteConfig.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 text-sm font-medium transition"
          >
            Google Maps
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <a
            href={siteConfig.naverMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-green-600 hover:text-green-700 text-sm font-medium transition"
          >
            Naver Map
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <a
            href={siteConfig.kakaoMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-yellow-600 hover:text-yellow-700 text-sm font-medium transition"
          >
            Kakao Map
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
