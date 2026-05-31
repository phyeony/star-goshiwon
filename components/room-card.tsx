import Link from "next/link";
import { StatusBadge } from "./status-badge";
import { OptimizedPhoto } from "./optimized-photo";
import { formatUSD, formatApproxKRW, getUsdPrices } from "@/lib/pricing";
import type { RoomWithImages } from "@/lib/types";

export function RoomCard({ room }: { room: RoomWithImages }) {
  const mainImage = room.room_images?.sort(
    (a, b) => a.sort_order - b.sort_order
  )[0];
  const usd = getUsdPrices(room.slug);

  return (
    <Link href={`/rooms/${room.slug}`} className="block group">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition duration-150 ease-in-out hover:shadow-md">
        {mainImage && (
          <div className="relative h-64 w-full overflow-hidden">
            <OptimizedPhoto
              src={mainImage.url}
              alt={mainImage.alt || room.name}
              className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition duration-300"
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
               {room.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium border border-gray-200"
                >
                  {amenity}
                </span>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 flex justify-between items-end">
            <div>
              <span className="text-3xl font-extrabold text-gray-900">
                {formatUSD(usd.weekly)}
              </span>
              <span className="text-gray-500 text-base"> / week</span>
              <div className="text-sm text-gray-500 mt-1">
                {formatApproxKRW(usd.weekly)}
              </div>
            </div>
            {usd.monthly > 0 && (
              <div className="text-sm text-green-600 font-medium text-right">
                4+ weeks: {formatUSD(usd.monthly)} / 4 weeks (15% off)
                <div className="text-xs text-gray-500 font-normal">
                  {formatApproxKRW(usd.monthly)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
