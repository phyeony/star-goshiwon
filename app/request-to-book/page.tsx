import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RoomCardVariantSplit } from "@/components/room-card-variants-client";
import { getPublicRooms } from "@/lib/queries";
import { siteConfig } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Request to Book",
  description:
    "Submit a booking request for a goshiwon room in Seoul. No payment required. We will review and respond within 24 hours.",
};

export const dynamic = "force-dynamic";

export default async function RequestToBookPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const { room: preselectedSlug } = await searchParams;

  // If a room is already selected, send the user straight to its detail page
  if (preselectedSlug) {
    redirect(`/rooms/${preselectedSlug}`);
  }

  const rooms = await getPublicRooms();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Request to Book
        </h1>
        <p className="mt-2 text-base text-gray-500 max-w-2xl mx-auto">
          Choose a room to see full details, pricing, and submit your booking
          request. No payment is required &mdash; we&rsquo;ll get back to you
          within {siteConfig.responseTime}.
        </p>
      </div>

      {rooms.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">
            No rooms available at the moment. Please check back soon or{" "}
            <Link href="/contact" className="text-indigo-600 hover:text-indigo-700 font-medium">
              contact us
            </Link>{" "}
            for availability.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rooms.map((room) => (
            <RoomCardVariantSplit key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}
