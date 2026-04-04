import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "./status-badge";
import { formatKRW } from "@/lib/pricing";
import type { RoomWithImages } from "@/lib/types";

export function RoomCard({ room }: { room: RoomWithImages }) {
  const mainImage = room.room_images?.sort(
    (a, b) => a.sort_order - b.sort_order
  )[0];

  return (
    <Link href={`/rooms/${room.slug}`} className="block group">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition duration-150 ease-in-out hover:shadow-md">
        {mainImage && (
          <div className="relative h-64 w-full overflow-hidden">
            <Image
              src={mainImage.url}
              alt={mainImage.alt || room.name}
              fill
              className="object-cover group-hover:scale-105 transition duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{room.name}</h3>
              {room.description && (
                <p className="text-base text-gray-500 mt-1 line-clamp-2">
                  {room.description}
                </p>
              )}
            </div>
            <StatusBadge status={room.status} />
          </div>

          {room.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {room.amenities.slice(0, 4).map((amenity) => (
                <span
                  key={amenity}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium border border-gray-200"
                >
                  {amenity}
                </span>
              ))}
              {room.amenities.length > 4 && (
                <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-sm font-medium border border-gray-200">
                  +{room.amenities.length - 4} more
                </span>
              )}
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 flex justify-between items-end">
            <div>
              <span className="text-3xl font-extrabold text-gray-900">
                {formatKRW(room.price_monthly)}
              </span>
              <span className="text-gray-500 text-base"> / month</span>
            </div>
            {room.price_daily > 0 && (
              <div className="text-sm text-gray-500">
                Short stay: {formatKRW(room.price_daily)} / night
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
