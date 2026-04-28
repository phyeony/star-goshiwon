"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "./status-badge";
import { formatUSD, formatApproxKRW, getUsdPrices } from "@/lib/pricing";
import type { RoomWithImages } from "@/lib/types";

function getMainImage(room: RoomWithImages) {
  return room.room_images?.sort((a, b) => a.sort_order - b.sort_order)[0];
}

const COMMON_AMENITY_KEYS = new Set([
  "acheat",
  "fastwifi",
  "deskchair",
  "minifridge",
  "shelfcabinet",
  "outsidefacingwindow",
]);

function normalizeAmenity(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function splitAmenities(amenities: string[]) {
  const unique: string[] = [];
  const common: string[] = [];
  for (const a of amenities) {
    if (COMMON_AMENITY_KEYS.has(normalizeAmenity(a))) {
      common.push(a);
    } else {
      unique.push(a);
    }
  }
  return { unique, common };
}

type PricingMode = "weekly" | "monthly";

function PricingToggle({
  mode,
  onChange,
}: {
  mode: PricingMode;
  onChange: (mode: PricingMode) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full bg-gray-100 border border-gray-200 p-1 mb-3">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onChange("weekly");
        }}
        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
          mode === "weekly"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-900"
        }`}
      >
        Weekly
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onChange("monthly");
        }}
        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
          mode === "monthly"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-900"
        }`}
      >
        Monthly
      </button>
    </div>
  );
}

function PricingBlock({
  room,
  mode,
  onChange,
}: {
  room: RoomWithImages;
  mode: PricingMode;
  onChange: (mode: PricingMode) => void;
}) {
  const usd = getUsdPrices(room.slug);
  const isMonthly = mode === "monthly";
  const price = isMonthly ? usd.monthly : usd.weekly;
  const unit = isMonthly ? "/ 4 weeks" : "/ week";
  const savings = usd.weekly * 4 - usd.monthly;

  return (
    <div className="border-t border-gray-100 pt-4 mt-auto">
      <PricingToggle mode={mode} onChange={onChange} />
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-gray-900">
          {formatUSD(price)}
        </span>
        <span className="text-gray-500 text-base">{unit}</span>
      </div>
      <div className="text-sm text-gray-500 mt-1">
        {formatApproxKRW(price)}
      </div>
      {isMonthly && savings > 0 && (
        <div className="mt-1 text-sm text-green-600 font-semibold">
          Save {formatUSD(savings)} vs. weekly
        </div>
      )}
      {!isMonthly && usd.monthly > 0 && (
        <div className="mt-1 text-sm text-gray-500">
          Stay 4+ weeks for {formatUSD(usd.monthly)} (save 15%)
        </div>
      )}
    </div>
  );
}

/**
 * Variant J — Split amenities (unique vs. standard) + pricing toggle
 */
export function RoomCardVariantSplit({ room }: { room: RoomWithImages }) {
  const [mode, setMode] = useState<PricingMode>("monthly");
  const mainImage = getMainImage(room);
  const { unique, common } = splitAmenities(room.amenities);

  return (
    <Link href={`/rooms/${room.slug}`} className="group flex h-full">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition hover:shadow-md flex flex-col w-full">
        {mainImage && (
          <div className="relative h-64 w-full overflow-hidden flex-shrink-0">
            <Image
              src={mainImage.url}
              alt={mainImage.alt || room.name}
              fill
              className="object-cover group-hover:scale-105 transition duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute top-3 right-3">
              <StatusBadge status={room.status} />
            </div>
          </div>
        )}
        <div className="p-6 flex flex-col flex-grow">
          <div className="mb-5">
            <h3 className="text-2xl font-bold text-gray-900">{room.name}</h3>
            {room.description && (
              <p className="text-base text-gray-500 mt-1 line-clamp-2">
                {room.description}
              </p>
            )}
          </div>

          {unique.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-2">
                What makes this room different
              </p>
              <div className="flex flex-wrap gap-2">
                {unique.map((amenity) => (
                  <span
                    key={amenity}
                    className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold border border-indigo-200"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {common.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">
                Also included (standard in every room)
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">
                {common.join(" · ")}
              </p>
            </div>
          )}

          <PricingBlock room={room} mode={mode} onChange={setMode} />
        </div>
      </div>
    </Link>
  );
}

/**
 * Variant K — Description-only (no amenity chips) + pricing toggle
 */
export function RoomCardVariantDescription({ room }: { room: RoomWithImages }) {
  const [mode, setMode] = useState<PricingMode>("monthly");
  const mainImage = getMainImage(room);

  return (
    <Link href={`/rooms/${room.slug}`} className="group flex h-full">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition hover:shadow-md flex flex-col w-full">
        {mainImage && (
          <div className="relative h-64 w-full overflow-hidden flex-shrink-0">
            <Image
              src={mainImage.url}
              alt={mainImage.alt || room.name}
              fill
              className="object-cover group-hover:scale-105 transition duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute top-3 right-3">
              <StatusBadge status={room.status} />
            </div>
          </div>
        )}
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">{room.name}</h3>
          {room.description && (
            <p className="text-base text-gray-600 leading-relaxed mb-6">
              {room.description}
            </p>
          )}

          <PricingBlock room={room} mode={mode} onChange={setMode} />
        </div>
      </div>
    </Link>
  );
}
