import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { ImageGallery } from "@/components/image-lightbox";
import { RequestForm } from "@/components/request-form";
import { getRoomBySlug } from "@/lib/queries";
import { formatKRW } from "@/lib/pricing";
import { siteConfig } from "@/lib/site-data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const room = await getRoomBySlug(slug);
  if (!room) return { title: "Room Not Found" };

  return {
    title: room.name,
    description: `${room.name} — from ${formatKRW(room.price_weekly)}/week. ${room.description}`,
  };
}

export default async function RoomDetailPage({ params }: Props) {
  const { slug } = await params;
  const room = await getRoomBySlug(slug);

  if (!room) notFound();

  const images = room.room_images?.sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const roomOption = {
    name: room.name,
    slug: room.slug,
    price_monthly: room.price_monthly,
    price_weekly: room.price_weekly,
    price_daily: room.price_daily,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                      {formatKRW(room.price_weekly)} / week
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-green-50">
                    <td className="px-6 py-4 text-base text-green-800 font-medium">
                      4+ weeks (15% off)
                    </td>
                    <td className="px-6 py-4 text-right text-base font-semibold text-green-800">
                      {formatKRW(Math.round(room.price_weekly * 0.85))} / week
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-base text-gray-900">
                      Extra days
                    </td>
                    <td className="px-6 py-4 text-right text-base font-semibold text-gray-900">
                      {formatKRW(room.price_daily)} / day
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Bedding set provided for a one-time fee of ₩20,000 (Optional). Towels included for stays of 4+ weeks.
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
