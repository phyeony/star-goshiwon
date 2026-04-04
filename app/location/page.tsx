import type { Metadata } from "next";
import { SectionTitle } from "@/components/section-title";
import { siteConfig, nearbyLocations } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Location",
  description:
    "Seoul Stay Goshiwon is located in Dongjak-gu, Seoul. Near Sangdo Station (Line 7) and Noryangjin Station (Line 1 & 9). See nearby transit, shops, and services.",
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
          <div className="lg:sticky lg:top-24 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-72 lg:h-80">
              <iframe
                title="Seoul Stay Goshiwon location map"
                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1582.5!2d126.948383!3d37.5112885!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357c9f6736793a2b%3A0x7f3263912b31aa4c!2sStargositel!5e0!3m2!1sen!2skr!4v1`}
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
