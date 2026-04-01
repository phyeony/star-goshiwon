import Image from "next/image";
import Link from "next/link";
import type { Room } from "@/lib/site-data";

export function RoomCard({ room }: { room: Room }) {
  return (
    <article className="overflow-hidden rounded-[28px] bg-white shadow-card">
      <div className="relative h-64">
        <Image src={room.photo} alt={room.name} fill className="object-cover" />
      </div>
      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl text-ink">{room.name}</h3>
            <p className="text-sm text-ink/60">
              {room.occupancy} · {room.size}
            </p>
          </div>
          <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-pine">
            {room.status}
          </span>
        </div>
        <p className="text-sm leading-6 text-ink/70">{room.summary}</p>
        <div className="flex flex-wrap gap-2">
          {room.amenities.slice(0, 4).map((amenity) => (
            <span key={amenity} className="rounded-full bg-sand px-3 py-1 text-xs text-ink/70">
              {amenity}
            </span>
          ))}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-ink/60">from</p>
            <p className="font-display text-2xl text-ink">
              ${room.priceNight}/night
            </p>
            <p className="text-sm text-ink/60">${room.priceMonth}/month</p>
          </div>
          <Link
            href={`/rooms/${room.slug}`}
            className="rounded-full border border-ink px-4 py-2 text-sm font-semibold text-ink"
          >
            View room
          </Link>
        </div>
      </div>
    </article>
  );
}
