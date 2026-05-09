import Link from "next/link";
import Image from "next/image";
import { RoomCardVariantSplit } from "@/components/room-card-variants-client";
import { SectionTitle } from "@/components/section-title";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { SharedFacilities } from "@/components/shared-facilities";
import { getPublicRooms } from "@/lib/queries";
import { siteConfig, amenities, faqs } from "@/lib/site-data";
import { guides } from "@/lib/guides-data";
import { formatApproxKRW } from "@/lib/pricing";

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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </span>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Private, quiet, men-only</h3>
              <p className="text-gray-500 mt-1">We don&rsquo;t have a shared lounge — and that&rsquo;s by design. Our rooms are kept clean, quiet, and ready for you. If peace and privacy matter more than a party hostel vibe, you&rsquo;ll feel right at home.</p>
            </div>
          </div>
            <div className="flex items-start gap-4">
            <span className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Save $45 when you stay 4+ weeks
              </h3>
              <p className="text-gray-500 mt-1">
                From $75({formatApproxKRW(75)})/week, or{" "}
                <span className="font-semibold text-gray-900">$255({formatApproxKRW(255)})</span> for 4 weeks (15% off).
                Minimum stay 7 days. $70(≈ ₩100,000) refundable deposit · Optional $15 bedding set.
              </p>
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

      {/* About Goshiwons in Seoul (SEO content) */}
      <section className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-6">
            What Is a Goshiwon in Seoul?
          </h2>

          <p className="text-base text-gray-600 mb-4 leading-relaxed">
            A goshiwon (고시원) is a uniquely Korean type of housing: a private,
            fully-furnished room with shared kitchen and laundry facilities.
            Originally built in the 1980s for students preparing for civil-service
            exams, goshiwons have since become Seoul&rsquo;s most popular form of
            affordable, no-deposit short-term housing — used by university
            students, working professionals, digital nomads, and increasingly,
            foreigners visiting or relocating to Korea.
          </p>

          <p className="text-base text-gray-600 mb-4 leading-relaxed">
            A typical goshiwon room in Seoul is small but practical: a single
            bed, a desk, a wardrobe, mini-fridge, AC/heating, and a window. Rent
            includes utilities, Wi-Fi, and basic pantry staples like rice, kimchi,
            and ramen. There&rsquo;s no key money (보증금) like in a Korean apartment
            lease — usually just a small refundable deposit, often ₩100,000 or
            less.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">
            Why Foreigners Choose a Goshiwon in Seoul
          </h3>
          <p className="text-base text-gray-600 mb-4 leading-relaxed">
            Compared to hotels, Airbnbs, or short-term apartments, a goshiwon
            offers three things that are hard to beat:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-gray-600 mb-6 ml-1">
            <li>
              <strong className="font-semibold text-gray-900">No long-term commitment.</strong>{" "}
              Stay one week, four weeks, or six months — your call. Most Korean
              leases lock you in for a year and demand a multi-thousand-dollar
              deposit. Goshiwons don&rsquo;t.
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Central locations.</strong>{" "}
              Most goshiwons sit near subway stations and universities, putting
              all of Seoul within 30–40 minutes by transit.
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Real privacy at a low price.</strong>{" "}
              Hostels share rooms; goshiwons give you your own door, your own
              desk, and your own quiet space.
            </li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">
            How Much Does a Goshiwon in Seoul Cost?
          </h3>
          <p className="text-base text-gray-600 mb-4 leading-relaxed">
            Pricing varies by district and room type. Recent listing data shows
            goshiwon rents top out around ₩480,000/month in Gangnam-gu,
            ₩390,000 in Mapo-gu (Hongdae), and ₩410,000 in Jongno-gu. In
            well-connected outer districts like Dongjak-gu — where Star Goshiwon
            is located — rents top out around ₩340,000/month. Our standard
            4-week rate is $255 (~₩340,000) at 15% off, or $75/week
            (~{formatApproxKRW(75)}). Rooms are charged in USD via PayPal.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">
            Who Stays in a Goshiwon
          </h3>
          <ul className="list-disc list-inside space-y-2 text-base text-gray-600 mb-6 ml-1">
            <li>Exchange students at SNU, Yonsei, Sogang, Hongdae-area schools, or Chung-Ang University</li>
            <li>Digital nomads and remote workers spending 1–3 months in Korea</li>
            <li>Travelers who want more than a hostel for less than a hotel</li>
            <li>Working professionals on short-term assignments</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">
            What to Look For
          </h3>
          <p className="text-base text-gray-600 mb-4 leading-relaxed">
            When choosing a goshiwon in Seoul as a foreigner, prioritize:
          </p>
          <ul className="list-disc list-inside space-y-2 text-base text-gray-600 mb-6 ml-1">
            <li>
              <strong className="font-semibold text-gray-900">English-speaking staff</strong> — the booking and check-in process is much smoother
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Walking distance to a major subway line</strong> — your daily commute makes or breaks the stay
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Outside-facing window</strong> — many older goshiwons have interior-facing rooms with no natural light
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Transparent pricing</strong> — fixed rates, no hidden cleaning fees, no last-minute deposit changes
            </li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">
            Why Star Goshiwon
          </h3>
          <p className="text-base text-gray-600 mb-4 leading-relaxed">
            Star Goshiwon sits in Dongjak-gu, a quiet residential district that
            puts central Seoul within easy reach without paying central-Seoul
            prices. Sangdo Station (Line 7) is a 5-minute walk; Noryangjin
            Station (Lines 1 and 9) is 10 minutes; Sindaebang (Line 2) is 12.
            Gangnam, Hongdae, Myeongdong, and Itaewon are all within 25–30
            minutes by subway, and every major Seoul university is reachable in
            under 40 minutes.
          </p>

          <p className="text-base text-gray-600 mb-4 leading-relaxed">
            Read our{" "}
            <Link
              href="/goshiwon-seoul"
              className="text-indigo-600 hover:text-indigo-700 underline"
            >
              complete guide to goshiwons in Seoul
            </Link>
            , see{" "}
            <Link
              href="/rooms"
              className="text-indigo-600 hover:text-indigo-700 underline"
            >
              our rooms
            </Link>
            , or check{" "}
            <Link
              href="/location"
              className="text-indigo-600 hover:text-indigo-700 underline"
            >
              our location
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Featured Guides */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionTitle
          title="Guides for Foreigners in Seoul"
          subtitle="Practical reading before and during your stay in a goshiwon."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {guides.slice(3, 7).map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-indigo-200 transition flex flex-col"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                {g.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
                {g.excerpt}
              </p>
              <span className="text-sm font-medium text-indigo-600">
                Read more →
              </span>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/guides"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out"
          >
            View All Guides
          </Link>
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
            Submit a booking request to Stargoshiwon and we&rsquo;ll get back to
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
