import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "./status-badge";
import { formatKRW } from "@/lib/pricing";
import type { RoomWithImages } from "@/lib/types";

/**
 * Shared helpers
 */
function getMainImage(room: RoomWithImages) {
  return room.room_images?.sort((a, b) => a.sort_order - b.sort_order)[0];
}

function fourWeekFull(weekly: number) {
  return weekly * 4;
}

/**
 * Variant A — Strikethrough comparison
 * Shows the would-be 4-week price crossed out next to the discounted price.
 */
export function RoomCardVariantA({ room }: { room: RoomWithImages }) {
  const mainImage = getMainImage(room);
  const fullPrice = fourWeekFull(room.price_weekly);

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
          </div>
        )}
        <div className="p-6 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0 pr-2">
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

          <div className="border-t border-gray-100 pt-4 mt-auto">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">
                {formatKRW(room.price_weekly)}
              </span>
              <span className="text-gray-500 text-base">/ week</span>
            </div>
            {room.price_monthly > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Stay 4+ weeks:{" "}
                <span className="line-through text-gray-400">
                  {formatKRW(fullPrice)}
                </span>{" "}
                <span className="font-semibold text-green-600">
                  {formatKRW(room.price_monthly)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Variant B — Stacked tier rows
 * Two clear price rows: 1 week and 4 weeks, with a SAVE pill on the monthly row.
 */
export function RoomCardVariantB({ room }: { room: RoomWithImages }) {
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
          </div>
        )}
        <div className="p-6 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0 pr-2">
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

          <div className="border-t border-gray-100 pt-4 mt-auto space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-500">1 week</span>
              <span className="text-xl font-bold text-gray-900">
                {formatKRW(room.price_weekly)}
              </span>
            </div>
            {room.price_monthly > 0 && (
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  4 weeks
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    SAVE 15%
                  </span>
                </span>
                <span className="text-xl font-bold text-green-600">
                  {formatKRW(room.price_monthly)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Variant C — Big monthly hero
 * Lead with the monthly price (the better deal) and show weekly as the alternate.
 */
export function RoomCardVariantC({ room }: { room: RoomWithImages }) {
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
          <h3 className="text-2xl font-bold text-gray-900">{room.name}</h3>
          {room.description && (
            <p className="text-base text-gray-500 mt-1 line-clamp-2">
              {room.description}
            </p>
          )}

          {room.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 mb-6">
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
            {room.price_monthly > 0 ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-gray-900">
                    {formatKRW(room.price_monthly)}
                  </span>
                  <span className="text-gray-500 text-base">/ 4 weeks</span>
                  <span className="ml-auto bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                    15% OFF
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  or {formatKRW(room.price_weekly)} / week (min 7 days)
                </p>
              </>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900">
                  {formatKRW(room.price_weekly)}
                </span>
                <span className="text-gray-500 text-base">/ week</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Variant D — Side-by-side pricing table
 * A two-column mini table inside the price block, comparing 1 wk vs 4 wks.
 */
export function RoomCardVariantD({ room }: { room: RoomWithImages }) {
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
          </div>
        )}
        <div className="p-6 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0 pr-2">
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

          <div className="mt-auto pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  1 week
                </div>
                <div className="text-lg font-bold text-gray-900 mt-1">
                  {formatKRW(room.price_weekly)}
                </div>
              </div>
              {room.price_monthly > 0 && (
                <div className="rounded-lg border-2 border-green-500 bg-green-50 p-3 relative">
                  <div className="absolute -top-2 right-2 bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    SAVE 15%
                  </div>
                  <div className="text-xs uppercase tracking-wide text-green-700">
                    4 weeks
                  </div>
                  <div className="text-lg font-bold text-green-700 mt-1">
                    {formatKRW(room.price_monthly)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Variant F — Google One style plan card
 * Pill tab on top advertising the savings, centered strikethrough + big price,
 * green "Save up to" line, pill CTA button.
 */
export function RoomCardVariantF({ room }: { room: RoomWithImages }) {
  const mainImage = getMainImage(room);
  const fullPrice = fourWeekFull(room.price_weekly);
  const savings = fullPrice - room.price_monthly;
  const hasMonthly = room.price_monthly > 0 && savings > 0;

  return (
    <Link href={`/rooms/${room.slug}`} className="group flex h-full">
      <div className="relative w-full flex flex-col pt-5">
        {/* Pill tab */}
        {hasMonthly && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-indigo-100 text-indigo-800 rounded-t-2xl rounded-b-none px-6 pt-2 pb-3 text-center shadow-sm border border-b-0 border-gray-200">
            <div className="text-sm font-bold leading-tight">Stay 4+ weeks</div>
            <div className="text-xs leading-tight">Save up to 15%</div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition hover:shadow-md flex flex-col w-full flex-grow mt-8">
          {mainImage && (
            <div className="relative h-56 w-full overflow-hidden flex-shrink-0">
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

          <div className="p-6 flex flex-col flex-grow text-center">
            <h3 className="text-2xl font-bold text-gray-900">{room.name}</h3>
            {room.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {room.description}
              </p>
            )}

            {room.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {room.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium border border-gray-200"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 mb-2">
              {hasMonthly && (
                <div className="text-lg text-gray-400 line-through">
                  {formatKRW(fullPrice)}
                </div>
              )}
              <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {hasMonthly
                  ? `${formatKRW(room.price_monthly)}/4wks`
                  : `${formatKRW(room.price_weekly)}/wk`}
              </div>
              {hasMonthly && (
                <div className="text-sm text-green-600 font-medium mt-1">
                  Save up to{" "}
                  <span>{formatKRW(savings)}</span>
                </div>
              )}
            </div>

            <div className="mt-auto pt-4">
              <span className="inline-block px-6 py-2 rounded-full border border-indigo-600 text-indigo-600 font-semibold text-sm group-hover:bg-indigo-600 group-hover:text-white transition">
                Get started
              </span>
              {hasMonthly && (
                <p className="text-xs text-gray-500 mt-3">
                  or {formatKRW(room.price_weekly)}/week (min 7 days)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Variant G — Variant F without the "Get started" button
 * Same Google One layout but the whole card is the click target — no CTA pill.
 */
export function RoomCardVariantG({ room }: { room: RoomWithImages }) {
  const mainImage = getMainImage(room);
  const fullPrice = fourWeekFull(room.price_weekly);
  const savings = fullPrice - room.price_monthly;
  const hasMonthly = room.price_monthly > 0 && savings > 0;

  return (
    <Link href={`/rooms/${room.slug}`} className="group flex h-full">
      <div className="relative w-full flex flex-col pt-5">
        {hasMonthly && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-indigo-100 text-indigo-800 rounded-t-2xl rounded-b-none px-6 pt-2 pb-3 text-center shadow-sm border border-b-0 border-gray-200">
            <div className="text-sm font-bold leading-tight">Stay 4+ weeks</div>
            <div className="text-xs leading-tight">Save up to 15%</div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition hover:shadow-md flex flex-col w-full flex-grow mt-8">
          {mainImage && (
            <div className="relative h-56 w-full overflow-hidden flex-shrink-0">
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

          <div className="p-6 flex flex-col flex-grow text-center">
            <h3 className="text-2xl font-bold text-gray-900">{room.name}</h3>
            {room.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {room.description}
              </p>
            )}

            {room.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {room.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium border border-gray-200"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto pt-6">
              {hasMonthly && (
                <div className="text-lg text-gray-400 line-through">
                  {formatKRW(fullPrice)}
                </div>
              )}
              <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {hasMonthly
                  ? `${formatKRW(room.price_monthly)}/4wks`
                  : `${formatKRW(room.price_weekly)}/wk`}
              </div>
              {hasMonthly && (
                <div className="text-sm text-green-600 font-medium mt-1">
                  Save up to{" "}
                  <span>{formatKRW(savings)}</span>
                </div>
              )}
              {hasMonthly && (
                <p className="text-xs text-gray-500 mt-2">
                  or {formatKRW(room.price_weekly)}/week (min 7 days)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Variant H — Variant F left-aligned
 * Google One style content but flex-start aligned (left), no CTA button.
 */
export function RoomCardVariantH({ room }: { room: RoomWithImages }) {
  const mainImage = getMainImage(room);
  const fullPrice = fourWeekFull(room.price_weekly);
  const savings = fullPrice - room.price_monthly;
  const hasMonthly = room.price_monthly > 0 && savings > 0;

  return (
    <Link href={`/rooms/${room.slug}`} className="group flex h-full">
      <div className="relative w-full flex flex-col pt-5">
        {hasMonthly && (
          <div className="absolute top-0 left-6 z-10 bg-indigo-100 text-indigo-800 rounded-t-2xl rounded-b-none px-5 pt-2 pb-3 shadow-sm border border-b-0 border-gray-200">
            <div className="text-sm font-bold leading-tight">Stay 4+ weeks</div>
            <div className="text-xs leading-tight">Save up to 15%</div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition hover:shadow-md flex flex-col w-full flex-grow mt-8">
          {mainImage && (
            <div className="relative h-56 w-full overflow-hidden flex-shrink-0">
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

          <div className="p-6 flex flex-col flex-grow items-start text-left">
            <h3 className="text-2xl font-bold text-gray-900">{room.name}</h3>
            {room.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {room.description}
              </p>
            )}

            {room.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {room.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium border border-gray-200"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto pt-6 w-full">
              {hasMonthly && (
                <div className="text-lg text-gray-400 line-through">
                  {formatKRW(fullPrice)}
                </div>
              )}
              <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {hasMonthly
                  ? `${formatKRW(room.price_monthly)}/4wks`
                  : `${formatKRW(room.price_weekly)}/wk`}
              </div>
              {hasMonthly && (
                <div className="text-sm text-green-600 font-medium mt-1">
                  Save up to{" "}
                  <span>{formatKRW(savings)}</span>
                </div>
              )}
              {hasMonthly && (
                <p className="text-xs text-gray-500 mt-2">
                  or {formatKRW(room.price_weekly)}/week (min 7 days)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Variant E — Inline savings callout
 * Single price line with an explicit "Save ₩60,000 with 4+ weeks" message underneath.
 */
export function RoomCardVariantE({ room }: { room: RoomWithImages }) {
  const mainImage = getMainImage(room);
  const savings = fourWeekFull(room.price_weekly) - room.price_monthly;

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
          </div>
        )}
        <div className="p-6 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0 pr-2">
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

          <div className="mt-auto pt-4 border-t border-gray-100">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900">
                {formatKRW(room.price_weekly)}
              </span>
              <span className="text-gray-500 text-base">/ week</span>
            </div>
            {room.price_monthly > 0 && savings > 0 && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                Save {formatKRW(savings)} on 4+ week stays
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

