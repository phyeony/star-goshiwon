import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-data";
import { formatApproxKRW, formatUSD } from "@/lib/pricing";
import { getEconomyTier } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute:
      "Goshiwon in Seoul: The Complete Foreigner's Guide (2026) | Star Goshiwon",
  },
  description:
    "A complete guide to goshiwons in Seoul — history, prices by district, what's inside a building, how to read a listing, and what foreigners miss. Written by a goshiwon operator with years of experience.",
  alternates: { canonical: "/goshiwon-seoul" },
  openGraph: {
    title: "Goshiwon in Seoul: The Complete Foreigner's Guide (2026)",
    description:
      "Everything foreigners need to know about goshiwons in Seoul — written by a long-time operator. District guides, hidden costs, what to bring, and red flags to avoid.",
    url: `${siteConfig.url}/goshiwon-seoul`,
    type: "article",
  },
};

export default async function GoshiwonSeoulPage() {
  const tier = await getEconomyTier();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <article>
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-3">
            Long Read · 2026 Edition
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-5">
            Goshiwon in Seoul: The Complete Foreigner&rsquo;s Guide
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            After years of running a goshiwon in Seoul&rsquo;s Dongjak-gu and
            watching thousands of foreigners pass through our doors, here&rsquo;s
            what we&rsquo;ve learned about the cheapest, most flexible housing
            option in the city — and what nobody tells you before you book one.
          </p>
        </header>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          A Quick History
        </h2>
        <p className="text-base text-gray-600 mb-4 leading-relaxed">
          Goshiwons started in the 1980s in Sillim-dong and Noryangjin, the two
          neighborhoods clustered around Korea&rsquo;s most prestigious civil-service
          exam prep schools. Students preparing for the goshi (고시) — the
          legendary exams that filtered candidates for high government positions
          — needed somewhere cheap to live while studying 14 hours a day.
          Operators carved up old buildings into the smallest possible private
          rooms, kept rents low, and packed in shared kitchens. The deal was
          simple: tiny space, no contract, no commitment.
        </p>
        <p className="text-base text-gray-600 mb-4 leading-relaxed">
          By the early 2000s the goshi exam was reformed and most of those
          students disappeared — but the buildings stayed. Operators pivoted to
          whoever needed cheap, flexible housing in central Seoul: working-class
          Koreans, foreign students, day laborers, and increasingly, foreign
          workers and digital nomads. Today there are roughly 6,000 goshiwons
          operating in Seoul, with maybe 500 of those willing to take foreign
          guests.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Inside a Typical Goshiwon Building
        </h2>
        <p className="text-base text-gray-600 mb-4 leading-relaxed">
          Unlike a hotel or hostel, a goshiwon&rsquo;s design is purely
          functional. Most buildings are 4–6 stories, with one floor of common
          area (kitchen, laundry, sometimes a small lounge) and the rest filled
          with private rooms. A typical floor has 15–30 rooms, each behind a
          numbered door with a keypad lock.
        </p>
        <p className="text-base text-gray-600 mb-4 leading-relaxed">
          The rooms themselves vary by tier. The smallest (&ldquo;compact&rdquo;
          or 고시방) are 3–4 m² — just a bed, a desk, and a wardrobe slot.
          Standard rooms (4–6 m²) add a chair, a real desk, and usually a
          mini-fridge. Premium rooms (6–8 m²) are large enough for a small couch
          and have a private shower or full bathroom.
        </p>
        <p className="text-base text-gray-600 mb-4 leading-relaxed">
          Common areas are surprisingly social despite the privacy of the
          rooms. The shared kitchen is where foreigners and Koreans actually
          meet — usually around the rice cooker that&rsquo;s always running, or
          near the kimchi fridge. The laundry room and rooftop drying racks are
          weekend hubs. Most goshiwons have an &ldquo;ajumma&rdquo; (manager)
          who lives nearby, and her desk in the lobby is the de facto
          reception.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          The Economics: Why Goshiwon Prices Look the Way They Do
        </h2>
        <p className="text-base text-gray-600 mb-4 leading-relaxed">
          A typical goshiwon room in Dongjak-gu tops out at around ₩340,000 per
          month. Of that, roughly:
        </p>
        <ul className="list-disc list-inside space-y-1 text-base text-gray-600 mb-6 ml-1">
          <li>₩140,000 to building rent and depreciation</li>
          <li>₩70,000 to utilities (gas, electric, water, internet — bundled)</li>
          <li>₩50,000 to cleaning staff and shared-area maintenance</li>
          <li>₩15,000 to pantry food (rice, kimchi)</li>
          <li>₩70,000 to the operator before tax</li>
        </ul>
        <p className="text-base text-gray-600 mb-4 leading-relaxed">
          Operators don&rsquo;t get rich. The business is mostly fixed costs,
          and a goshiwon with 25% vacancy is usually losing money. This is why
          prices barely move regardless of foreign demand — the marginal cost
          of an empty room is almost the same as a full one.
        </p>
        <p className="text-base text-gray-600 mb-4 leading-relaxed">
          What this means for you: there&rsquo;s almost no negotiation room on
          advertised prices. What you <em>can</em> negotiate is{" "}
          <strong className="font-semibold text-gray-900">length</strong> —
          committing to 4+ weeks usually unlocks 10–20% off, because filling a
          room for a month is more valuable to operators than charging full
          weekly rate four times.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          District-by-District: Where to Stay and Why
        </h2>
        <p className="text-base text-gray-600 mb-4 leading-relaxed">
          Goshiwon prices vary widely across Seoul. Here&rsquo;s the spread
          across all 25 Seoul districts, based on observed listings — the
          cheapest deposit you&rsquo;d need, and the highest monthly rent seen
          in each area.
        </p>
        <div className="my-6 overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-2xl overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">
                  District
                </th>
                <th className="text-left font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">
                  Min Deposit
                </th>
                <th className="text-left font-semibold text-gray-900 px-4 py-3 border-b border-gray-200">
                  Monthly Rent
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Gangnam-gu", "₩140,000", "₩480,000"],
                ["Gangdong-gu", "₩80,000", "₩520,000"],
                ["Gangbuk-gu", "₩18,000", "₩370,000"],
                ["Gangseo-gu", "₩90,000", "₩410,000"],
                ["Gwanak-gu", "₩50,000", "₩320,000"],
                ["Gwangjin-gu", "₩110,000", "₩390,000"],
                ["Guro-gu", "₩180,000", "₩330,000"],
                ["Geumcheon-gu", "₩200,000", "₩390,000"],
                ["Nowon-gu", "₩60,000", "₩330,000"],
                ["Dobong-gu", "₩110,000", "₩370,000"],
                ["Dongdaemun-gu", "₩70,000", "₩360,000"],
                ["Dongjak-gu", "₩110,000", "₩340,000"],
                ["Mapo-gu", "₩80,000", "₩390,000"],
                ["Seodaemun-gu", "₩100,000", "₩420,000"],
                ["Seocho-gu", "₩70,000", "₩400,000"],
                ["Seongdong-gu", "₩130,000", "₩380,000"],
                ["Seongbuk-gu", "₩80,000", "₩350,000"],
                ["Songpa-gu", "₩100,000", "₩430,000"],
                ["Yangcheon-gu", "₩290,000", "₩420,000"],
                ["Yeongdeungpo-gu", "₩100,000", "₩330,000"],
                ["Yongsan-gu", "₩100,000", "₩360,000"],
                ["Eunpyeong-gu", "₩160,000", "₩400,000"],
                ["Jongno-gu", "₩130,000", "₩410,000"],
                ["Jung-gu", "₩50,000", "₩360,000"],
                ["Jungnang-gu", "₩60,000", "₩350,000"],
              ].map(([district, deposit, rent]) => (
                <tr key={district} className="border-b border-gray-100 last:border-b-0">
                  <td className="text-gray-900 font-semibold px-4 py-3 align-top">{district}</td>
                  <td className="text-gray-600 px-4 py-3 align-top">{deposit}</td>
                  <td className="text-gray-600 px-4 py-3 align-top">{rent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-500 italic mb-6 leading-relaxed">
          Data: aggregated Seoul goshiwon listings, 2026. The cheapest
          deposit and highest monthly rent observed per district.
        </p>
        <p className="text-base text-gray-600 mb-4 leading-relaxed">
          A few specifics that don&rsquo;t fit on a homepage:
        </p>
        <ul className="list-disc list-inside space-y-2 text-base text-gray-600 mb-6 ml-1">
          <li>
            <strong className="font-semibold text-gray-900">Sillim-dong (Gwanak-gu)</strong> is the historical
            &ldquo;goshiwon capital&rdquo; — by far the densest concentration in Korea.
            Cheapest prices, oldest buildings.
          </li>
          <li>
            <strong className="font-semibold text-gray-900">Noryangjin (Dongjak-gu)</strong> is where we operate.
            The neighborhood blends working-class Korean culture, the famous
            fish market, and a 5-minute walk to Han River parks.
          </li>
          <li>
            <strong className="font-semibold text-gray-900">Hongdae</strong> has fewer goshiwons than you&rsquo;d
            expect — the neighborhood is dominated by share houses and Airbnbs
            aimed at tourists.
          </li>
          <li>
            <strong className="font-semibold text-gray-900">Itaewon goshiwons</strong> are rare and pricey but
            sometimes worth it for someone working at the US Army base or
            international offices.
          </li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          How to Read a Goshiwon Listing
        </h2>
        <p className="text-base text-gray-600 mb-4 leading-relaxed">
          Listings on Korean platforms (Naver, Goshipages) are usually
          photographed strategically. Here&rsquo;s how to read them:
        </p>

        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">
          Green flags
        </h3>
        <ul className="list-disc list-inside space-y-2 text-base text-gray-600 mb-6 ml-1">
          <li>A photo from <em>outside</em> the room window. Operators only show this if there&rsquo;s a real exterior view.</li>
          <li>Multiple angles of the same room. Builds trust; a single hero shot often hides cramped corners.</li>
          <li>A price list with weekly, monthly, and 3-month options. Suggests an organized operation.</li>
          <li>Mention of foreign guests or English support. Self-selection — they&rsquo;ve decided they want you.</li>
        </ul>

        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">
          Red flags
        </h3>
        <ul className="list-disc list-inside space-y-2 text-base text-gray-600 mb-6 ml-1">
          <li>Only one or two photos. Probably hides poor condition.</li>
          <li>Photos from a wide-angle lens. Real rooms are smaller than they look — mentally subtract 30%.</li>
          <li>No mention of what&rsquo;s included. Suggests hidden fees.</li>
          <li>No window mentioned. Probably an interior-facing room facing a hallway.</li>
          <li>&ldquo;Discount for cash only&rdquo; or &ldquo;no contract needed.&rdquo; Often signals an unlicensed operation. Avoid.</li>
        </ul>

        <p className="text-base text-gray-600 mb-4 leading-relaxed">
          If at all possible, <strong className="font-semibold text-gray-900">visit before paying</strong>. A
          30-minute visit reveals everything photos can&rsquo;t: smell, noise,
          cleanliness of common areas, the manager&rsquo;s English level, and
          how thin the walls actually are.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          What Foreigners Often Miss
        </h2>
        <ol className="list-decimal list-inside space-y-3 text-base text-gray-600 mb-6 ml-1">
          <li>
            <strong className="font-semibold text-gray-900">Trash separation is genuinely strict.</strong>{" "}
            Each goshiwon has rules for general trash, food waste, recyclables,
            and cans/glass. Misplaced trash gets you a warning; habitual
            offenders can be asked to leave.
          </li>
          <li>
            <strong className="font-semibold text-gray-900">Quiet hours mean quiet hours.</strong>{" "}
            After 11 PM, you should not be flushing the toilet vigorously,
            taking phone calls, or watching videos without headphones. Walls
            are thin and Koreans take this seriously.
          </li>
          <li>
            <strong className="font-semibold text-gray-900">Shoes off, always.</strong>{" "}
            Most goshiwons have a step inside the entrance where outdoor shoes
            go. Walking in your room with shoes on will get you a complaint.
          </li>
          <li>
            <strong className="font-semibold text-gray-900">The deposit is not a damage deposit.</strong>{" "}
            It&rsquo;s mostly a key/equipment deposit. You&rsquo;ll get it back
            at checkout if you return your room and any provided items in
            working order.
          </li>
          <li>
            <strong className="font-semibold text-gray-900">The manager is your most important relationship.</strong>{" "}
            A friendly hello and a small gesture on arrival (a snack, a coffee)
            goes a long way. Korean small-business culture rewards politeness
            more than transactions.
          </li>
        </ol>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          What You Need to Bring
        </h2>
        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">
          What&rsquo;s provided
        </h3>
        <ul className="list-disc list-inside space-y-1 text-base text-gray-600 mb-6 ml-1">
          <li>Bed and mattress</li>
          <li>Pillow (sometimes)</li>
          <li>Desk and chair</li>
          <li>Closet or rack</li>
          <li>Mini-fridge (room-dependent)</li>
          <li>AC and heating</li>
          <li>Wi-Fi access</li>
        </ul>
        <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">
          What&rsquo;s almost never provided
        </h3>
        <ul className="list-disc list-inside space-y-1 text-base text-gray-600 mb-6 ml-1">
          <li>Bedsheets and blanket cover (₩15–25K rental, or bring your own)</li>
          <li>Towels (some places loan one for monthly stays)</li>
          <li>Toiletries (shampoo, body wash, toothpaste)</li>
          <li>Slippers (essential for indoor wear)</li>
          <li>Cookware (the kitchen has communal pots and pans, but knives are sometimes scarce)</li>
          <li>Earplugs (genuinely useful)</li>
        </ul>
        <p className="text-base text-gray-600 mb-4 leading-relaxed">
          Korean convenience stores (CU, GS25, 7-Eleven) carry all of this. A
          first-day shop typically runs ₩30–50K.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Where Star Goshiwon Fits In
        </h2>
        <p className="text-base text-gray-600 mb-4 leading-relaxed">
          We&rsquo;re one foreigner-friendly goshiwon in Dongjak-gu&rsquo;s
          Noryangjin neighborhood. Our pitch is simple: clean rooms,
          English-speaking management, transparent pricing, no surprise fees.
          {formatUSD(tier.weekly)}({formatApproxKRW(tier.weekly)})/week, {formatUSD(tier.monthly)}({formatApproxKRW(tier.monthly)})/4 weeks for 4+ weeks (a {Math.round(tier.discount * 100)}% discount baked in).
        </p>
        <p className="text-base text-gray-600 mb-4 leading-relaxed">
          If you&rsquo;re shopping around: visit a few goshiwons, including
          ours. The right one depends on your district, budget, and what you
          actually need. We hope this guide helped.
        </p>
        <p className="text-base text-gray-600 mb-4 leading-relaxed">
          <Link
            href="/rooms"
            className="text-indigo-600 hover:text-indigo-700 underline"
          >
            See our rooms
          </Link>
          {" · "}
          <Link
            href="/request-to-book"
            className="text-indigo-600 hover:text-indigo-700 underline"
          >
            Request to book
          </Link>
          {" · "}
          <Link
            href="/guides"
            className="text-indigo-600 hover:text-indigo-700 underline"
          >
            More guides
          </Link>
        </p>
      </article>
    </div>
  );
}
