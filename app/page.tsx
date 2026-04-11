import Link from "next/link";
import Image from "next/image";
import { RoomCardVariantSplit } from "@/components/room-card-variants-client";
import { SectionTitle } from "@/components/section-title";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { SharedFacilities } from "@/components/shared-facilities";
import { getPublicRooms } from "@/lib/queries";
import { siteConfig, amenities, faqs } from "@/lib/site-data";

export const dynamic = "force-dynamic";

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: (
    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" />
    </svg>
  ),
  snowflake: (
    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="4" width="20" height="12" rx="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 20c0-1.5.5-4 1-4M12 20c0-1.5 0-4 0-4M16 20c0-1.5-.5-4-1-4" />
    </svg>
  ),
  utensils: (
    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 2l0 7c0 1.66 1.34 3 3 3h2c1.66 0 3-1.34 3-3l0-7" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 2v20" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 2c-2 0-4 3-4 7s2 5 4 5m0-12v20" />
    </svg>
  ),
  shirt: (
    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.38 3.46L16 2 12 5 8 2 3.62 3.46a1 1 0 00-.76.95V6l3.14 1V21h12V7L21.14 6V4.41a1 1 0 00-.76-.95z" />
    </svg>
  ),
  window: (
    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="6" width="10" height="12" />
      <path d="M7 6 L4 4 L1 2 L1 22 L4 20 L7 18" />
      <path d="M4 4 L4 20" />
      <path d="M1 12 L7 12" />
      <path d="M17 6 L20 4 L23 2 L23 22 L20 20 L17 18" />
      <path d="M20 4 L20 20" />
      <path d="M17 12 L23 12" />
    </svg>
  ),
  package: (
    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
    </svg>
  ),
  fridge: (
    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 10h16M8 6v2M8 14v2" />
    </svg>
  ),
  zap: (
    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
};

function AmenityIcon({ name }: { name: string }) {
  return <>{amenityIcons[name] ?? null}</>;
}

export default async function HomePage() {
  const rooms = await getPublicRooms();

  return (
    <>
      {/* Hero */}
      <HeroSlideshow />

      {/* Key Info */}
      <section className="bg-white py-14 border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex items-start gap-4">
            <span className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Save ₩60,000 when you stay 4+ weeks
              </h3>
              <p className="text-gray-500 mt-1">
                From ₩100,000/week, or{" "}
                <span className="font-semibold text-gray-900">₩340,000</span> for 4 weeks (15% off).
                Minimum stay 7 days. Refundable ₩100,000 deposit · Optional ₩20,000 bedding set.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <span className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </span>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Private, quiet, men-only</h3>
              <p className="text-gray-500 mt-1">We don&rsquo;t have a shared lounge — and that&rsquo;s by design. Our rooms are kept clean, quiet, and ready for you. If peace and privacy matter more than a party hostel vibe, you&rsquo;ll feel right at home.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </span>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Right in the middle of Seoul</h3>
              <p className="text-gray-500 mt-1">Gangnam, Hongdae, Myeongdong, Jongno, and major universities — all within 40~50 minutes by public transit.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <span className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
            </span>
            <div>
              <h3 className="text-xl font-bold text-gray-900">English support available</h3>
              <p className="text-gray-500 mt-1">Check-in and booking handled in English. Day-to-day questions? Reach us anytime in English via WhatsApp. On-site, our owner is always around and happy to help.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Room Previews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionTitle
          title="Our Rooms"
          subtitle="3 room types to fit your budget. All rooms include a bed, desk & chair, WiFi, mini fridge, AC/Heating, shelf & cabinet, and an outside-facing window. Stay 4+ weeks and save 15%."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {rooms.slice(0, 3).map((room) => (
            <RoomCardVariantSplit key={room.id} room={room} />
          ))}
        </div>
      </section>

      {/* Shared Facilities */}
      <section className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Shared Facilities"
            subtitle="Common-area essentials, free for every guest to use."
          />
          <SharedFacilities />
        </div>
      </section>

      {/* Amenities */}
      {/* <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="What&rsquo;s Included"
            subtitle="Everything you need for a comfortable stay, included in your rent."
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {amenities.map((item) => (
              <div
                key={item.label}
                className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-200"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AmenityIcon name={item.icon} />
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* FAQ Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionTitle
          title="Frequently Asked Questions"
          subtitle="Everything you need to know before your stay."
        />
        <div className="space-y-4">
          {faqs.slice(0, 4).map((faq) => (
            <details
              key={faq.question}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 group"
            >
              <summary className="text-lg font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                {faq.question}
                <svg
                  className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
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
        <div className="text-center mt-8">
          <Link
            href="/faq"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out"
          >
            View All FAQs
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Ready to find your room in Seoul?
          </h2>
          <p className="mt-4 text-lg text-indigo-200">
            Submit a booking request to Stargositel and we&rsquo;ll get back to
            you within {siteConfig.responseTime}. No payment required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/request-to-book"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-indigo-700 bg-white hover:bg-indigo-50 shadow-sm md:py-4 md:text-lg transition duration-150 ease-in-out"
            >
              Request to Book
            </Link>
            <a
              href={siteConfig.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3 border border-indigo-400 text-base font-medium rounded-lg text-white hover:bg-indigo-600 md:py-4 md:text-lg transition duration-150 ease-in-out"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
