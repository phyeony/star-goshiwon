import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { ImageGallery } from "@/components/image-lightbox";
import { RequestForm } from "@/components/request-form";
import { getRoomBySlug } from "@/lib/queries";
import { formatUSD, formatApproxKRW, getUsdPrices } from "@/lib/pricing";
import { siteConfig } from "@/lib/site-data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const room = await getRoomBySlug(slug);
  if (!room) return { title: "Room Not Found" };

  const usd = getUsdPrices(room.slug);
  const description = `${room.name} in Seoul — from ${formatUSD(usd.weekly)}/week. ${room.description ?? "Foreigner-friendly goshiwon room with utilities included."}`;
  const firstImage = room.room_images?.sort(
    (a, b) => a.sort_order - b.sort_order
  )[0]?.url;

  return {
    title: `${room.name} — Goshiwon in Seoul`,
    description,
    alternates: { canonical: `/rooms/${room.slug}` },
    openGraph: {
      title: `${room.name} — Goshiwon in Seoul`,
      description,
      url: `${siteConfig.url}/rooms/${room.slug}`,
      type: "website",
      images: firstImage ? [{ url: firstImage }] : undefined,
    },
  };
}

export default async function RoomDetailPage({ params }: Props) {
  const { slug } = await params;
  const room = await getRoomBySlug(slug);

  if (!room) notFound();

  const images = room.room_images?.sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const usd = getUsdPrices(room.slug);

  const roomOption = {
    name: room.name,
    slug: room.slug,
  };

  const accommodationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Accommodation",
    "@id": `${siteConfig.url}/rooms/${room.slug}`,
    name: room.name,
    description: room.description ?? undefined,
    url: `${siteConfig.url}/rooms/${room.slug}`,
    image: images?.map((img) => img.url) ?? undefined,
    floorSize: room.size_sqm
      ? { "@type": "QuantitativeValue", value: room.size_sqm, unitCode: "MTK" }
      : undefined,
    numberOfRooms: 1,
    occupancy: { "@type": "QuantitativeValue", maxValue: 1 },
    amenityFeature: room.amenities?.map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
    address: {
      "@type": "PostalAddress",
      streetAddress: "64, Manyang-ro 12ga-gil, Dongjak-gu",
      addressLocality: "Seoul",
      addressCountry: "KR",
    },
    offers: {
      "@type": "Offer",
      price: usd.weekly,
      priceCurrency: "USD",
      availability:
        room.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${siteConfig.url}/rooms/${room.slug}`,
    },
  };

  const discountedWeeklyUsd = Math.round(usd.weekly * 0.85);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(accommodationJsonLd) }}
      />
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/rooms" className="hover:text-indigo-600 transition">
          Rooms
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{room.name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="w-full lg:w-2/3">
          {/* Image Gallery with Lightbox */}
          {images && images.length > 0 && (
            <ImageGallery images={images} roomName={room.name} />
          )}

          {images && images.length > 0 && (
            <p className="text-sm text-gray-500 italic mb-6 -mt-2">
              Photos are representative. Rooms are randomly assigned within the same type — <strong className="font-semibold text-gray-700 not-italic">all rooms of the same type share identical amenities and size.</strong>
            </p>
          )}

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {room.name}
              </h1>
              {room.size_sqm && (
                <p className="text-base text-gray-500 mt-1">
                  {room.size_sqm} m² · Single occupancy
                </p>
              )}
            </div>
            <StatusBadge status={room.status} />
          </div>

          {room.description && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                About this room
              </h2>
              <p className="text-base text-gray-600 whitespace-pre-line">
                {room.description}
              </p>
            </div>
          )}

          {room.amenities.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Room Amenities
              </h2>
              <div className="flex flex-wrap gap-2">
                {room.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium border border-gray-200"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Table */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Pricing</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                      Duration
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-bold text-gray-700 uppercase">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-6 py-4 text-base text-gray-900 font-medium">
                      Weekly (min. 7 days)
                    </td>
                    <td className="px-6 py-4 text-right text-base font-semibold text-gray-900">
                      {formatUSD(usd.weekly)} / week
                      <div className="text-xs text-gray-500 font-normal">
                        {formatApproxKRW(usd.weekly)}
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-green-50">
                    <td className="px-6 py-4 text-base text-green-800 font-medium">
                      4+ weeks (15% off)
                    </td>
                    <td className="px-6 py-4 text-right text-base font-semibold text-green-800">
                      {formatUSD(discountedWeeklyUsd)} / week
                      <div className="text-xs text-green-700/80 font-normal">
                        {formatApproxKRW(discountedWeeklyUsd)}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-base text-gray-900">
                      Extra days
                    </td>
                    <td className="px-6 py-4 text-right text-base font-semibold text-gray-900">
                      {formatUSD(usd.daily)} / day
                      <div className="text-xs text-gray-500 font-normal">
                        {formatApproxKRW(usd.daily)}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Rates charged in USD via PayPal. A $70 refundable deposit (≈ ₩100,000) is prepaid with your booking and refunded via PayPal at the end of your stay. Bedding set: $15 USD, optional, prepaid with your booking. Towels included for stays of 4+ weeks.
            </p>
          </div>
        </div>

        {/* Sidebar — Embedded Booking Form */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sticky top-24">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Request to Book
            </h3>
            <p className="text-base text-gray-500 mb-6">
              Select your dates to get an estimated total.{" "}
              <strong className="text-indigo-600 font-semibold">
                You won&rsquo;t be charged yet.
              </strong>
            </p>

            <RequestForm
              rooms={[roomOption]}
              preselectedSlug={room.slug}
              singleRoom
            />

            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
              <a
                href={siteConfig.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out"
              >
                Ask on WhatsApp
              </a>
              <a
                href={`mailto:${siteConfig.email}`}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
