"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "./status-badge";
import { formatKRW } from "@/lib/pricing";
import type { RoomWithImages } from "@/lib/types";

/**
 * Variant I — Weekly/Monthly toggle
 * Pill toggle on the card lets the guest switch the headline price between
 * weekly and 4-week (monthly) rates, mirroring the hero pricing toggle.
 */
export function RoomCardVariantToggle({ room }: { room: RoomWithImages }) {
  const [pricingMode, setPricingMode] = useState<"weekly" | "monthly">(
    "monthly"
  );

  const mainImage = room.room_images?.sort(
    (a, b) => a.sort_order - b.sort_order
  )[0];

  const isMonthly = pricingMode === "monthly";
  const price = isMonthly ? room.price_monthly : room.price_weekly;
  const unit = isMonthly ? "/ 4 weeks" : "/ week";
  const fullMonthly = room.price_weekly * 4;
  const savings = fullMonthly - room.price_monthly;

  return (
    <div className="group flex h-full">
      <div className="relative bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition hover:shadow-md flex flex-col w-full">
        <div className="absolute top-3 right-3 z-10">
          <StatusBadge status={room.status} />
        </div>

        <Link href={`/rooms/${room.slug}`} className="contents">
          {mainImage && (
            <div className="relative h-64 w-full overflow-hidden flex-shrink-0">
              <Image
                src={mainImage.url}
                alt={mainImage.alt || room.name}
                fill
                className="object-cover group-hover:scale-105 transition duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}
        </Link>

        <div className="p-6 flex flex-col flex-grow">
          <div className="mb-4">
            <Link href={`/rooms/${room.slug}`}>
              <h3 className="text-2xl font-bold text-gray-900 hover:underline">
                {room.name}
              </h3>
            </Link>
            {room.description && (
              <p className="text-base text-gray-500 mt-1 line-clamp-2">
                {room.description}
              </p>
            )}
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

          <div className="border-t border-gray-100 pt-4 mt-auto">
            {/* Pricing toggle — mirrors hero */}
            <div className="inline-flex items-center rounded-full bg-gray-100 border border-gray-200 p-1 mb-3">
              <button
                type="button"
                onClick={() => setPricingMode("weekly")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  pricingMode === "weekly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setPricingMode("monthly")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  pricingMode === "monthly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">
                {formatKRW(price)}
              </span>
              <span className="text-gray-500 text-base">{unit}</span>
            </div>

            {isMonthly && savings > 0 && (
              <div className="mt-1 text-sm text-green-600 font-semibold">
                Save {formatKRW(savings)} vs. weekly
              </div>
            )}
            {!isMonthly && room.price_monthly > 0 && (
              <div className="mt-1 text-sm text-gray-500">
                Stay 4+ weeks for {formatKRW(room.price_monthly)} (save 15%)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
