import type { Metadata } from "next";
import { RoomCardVariantSplit } from "@/components/room-card-variants-client";
import { SectionTitle } from "@/components/section-title";
import { getPublicRooms } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Rooms",
  description:
    "Browse available goshiwon rooms in Seoul. Private rooms with flexible lease terms, fully furnished, utilities included.",
};

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const rooms = await getPublicRooms();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <SectionTitle
        title="Available Rooms"
        subtitle="Browse our room types and find the right fit for your stay. All rooms are fully furnished with utilities included."
      />

      {rooms.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-lg">
            No rooms available at the moment. Please check back soon or contact
            us for availability.
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
