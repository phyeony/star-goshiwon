import Link from "next/link";
import Image from "next/image";
import { RoomCard } from "@/components/room-card";
import { SectionTitle } from "@/components/section-title";
import { getPublicRooms } from "@/lib/queries";
import { siteConfig, highlights, amenities, faqs } from "@/lib/site-data";

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
  shield: (
    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
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
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32 pt-10 sm:pt-16 lg:pt-20">
            <div className="mx-auto max-w-7xl sm:text-center lg:text-left">
              <span className="inline-block py-1 px-3 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold border border-indigo-100 mb-4">
                Foreigner-Friendly Men&rsquo;s Goshiwon in Central Seoul
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
                <span className="block">Your Comfortable</span>
                <span className="block text-indigo-600">Basecamp in Seoul</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                No massive deposits. No long-term contracts. Clean, secure,
                and fully-furnished private rooms for men in the centre of Seoul.
                Gangnam, Hongdae, Myeongdong in less than 50 mins by public transit.
                Perfect for students, digital nomads, and travelers.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start gap-4">
                <Link
                  href="/rooms"
                  className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm md:py-4 md:text-lg transition duration-150 ease-in-out"
                >
                  View Available Rooms
                </Link>
                <Link
                  href="/request-to-book"
                  className="mt-3 sm:mt-0 w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg transition duration-150 ease-in-out"
                >
                  Request to Book
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <Image
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
            src="/images/room-601-wide2.jpg"
            alt="Furnished private room at Stargositel with bed, desk, and chair"
            width={1613}
            height={726}
            priority
          />
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="bg-indigo-700 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {highlights.map((item) => (
              <div key={item.label}>
                <div className="font-extrabold text-2xl">{item.value}</div>
                <div className="text-indigo-200 text-sm mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Room Previews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionTitle
          title="Our Rooms"
          subtitle="3 room types to fit your budget. All rooms include a bed, desk, WiFi, mini fridge, and AC. Minimum stay 7 days — stay 4+ weeks and save 15%."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {rooms.slice(0, 3).map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </section>

      {/* Amenities */}
      <section className="bg-white py-16">
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
      </section>

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
