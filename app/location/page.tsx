import type { Metadata } from "next";
import Link from "next/link";
import { SectionTitle } from "@/components/section-title";
import { siteConfig, nearbyLocations } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Location",
  description:
    "Seoul Goshiwon by Star Goshiwon is located in Dongjak-gu, Seoul. Near Sangdo Station (Line 7) and Noryangjin Station (Line 1 & 9). See nearby transit, shops, and services.",
};

const typeLabels: Record<string, string> = {
  transit: "Transit",
  shop: "Shopping & Dining",
  explore: "Explore Seoul",
  university: "Nearby Universities",
};

const externalLinkIcon = (
  <svg
    className="w-4 h-4 ml-1 inline-block"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

export default function LocationPage() {
  const grouped = nearbyLocations.reduce(
    (acc, loc) => {
      if (!acc[loc.type]) acc[loc.type] = [];
      acc[loc.type].push(loc);
      return acc;
    },
    {} as Record<string, typeof nearbyLocations>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <SectionTitle
        title="Our Location"
        subtitle="Located in Dongjak-gu, a well-connected residential neighborhood with easy subway access to all parts of Seoul."
      />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Map — sticky on desktop */}
        <div className="w-full lg:w-5/12">
         <div className="lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-72 lg:h-80">
              <iframe
                title="Seoul Stay Goshiwon location map"
                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.8562384810907!2d126.9483812!3d37.51130870000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357c9f6736793a2b%3A0x7f3263912b31aa4c!2z7Iqk7YOA6rOg7Iuc7JuQc3Rhcmdvc2hpd29u!5e0!3m2!1sko!2s!4v1777449570804!5m2!1sko!2s`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Address</h3>
              <p className="text-base text-gray-600">{siteConfig.address}</p>

              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
                <a
                  href={siteConfig.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-700 text-sm font-medium transition"
                >
                  Google Maps
                  {externalLinkIcon}
                </a>
                <a
                  href={siteConfig.naverMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-green-600 hover:text-green-700 text-sm font-medium transition"
                >
                  Naver Map
                  {externalLinkIcon}
                </a>
                <a
                  href={siteConfig.kakaoMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-yellow-600 hover:text-yellow-700 text-sm font-medium transition"
                >
                  Kakao Map
                  {externalLinkIcon}
                </a>
              </div>
            </div>
          </div>

          <Link
            href="/guides/incheon-airport-to-noryangjin"
            className="mt-6 block bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-2xl p-5 transition"
          >
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
                />
              </svg>
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  Arriving from Incheon Airport?
                </h3>
                <p className="text-sm text-gray-600">
                  Read our step-by-step transit guide with the fastest, most
                  comfortable, and budget-friendly routes.
                </p>
                <span className="inline-block mt-2 text-sm font-medium text-indigo-600">
                  Read the guide &rarr;
                </span>
              </div>
            </div>
          </Link>
         </div>
        </div>

        {/* Nearby */}
        <div className="w-full lg:w-7/12 space-y-6">
          {Object.entries(grouped).map(([type, locations]) => (
            <div key={type}>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {typeLabels[type] || type}
              </h3>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y divide-gray-100">
                {locations.map((loc) => (
                  <div
                    key={loc.name}
                    className="flex justify-between items-center px-6 py-4"
                  >
                    <span className="text-base text-gray-900">{loc.name}</span>
                    <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                      {loc.distance}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
