import { RoomCard } from "@/components/room-card";
import { SectionTitle } from "@/components/section-title";
import { rooms } from "@/lib/site-data";

export default function RoomsPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <SectionTitle
        eyebrow="Rooms"
        title="Compare room types before you request a stay"
        body="Each room page should help a guest decide quickly: price, size, occupancy, what is included, and whether availability is open, limited, or waitlisted."
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {rooms.map((room) => (
          <RoomCard key={room.slug} room={room} />
        ))}
      </div>
    </section>
  );
}
