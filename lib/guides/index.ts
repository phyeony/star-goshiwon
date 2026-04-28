import type { Guide } from "./types";
import { guide as goshiwonVsHasukjibVsOfficetel } from "./goshiwon-vs-hasukjib-vs-officetel";
import { guide as monthlyGoshiwonSeoul } from "./monthly-goshiwon-seoul";
import { guide as weeklyGoshiwonSeoul } from "./weekly-goshiwon-seoul";
import { guide as goshiwonPricesSeoul2026 } from "./goshiwon-prices-seoul-2026";
import { guide as laundry } from "./laundry";
import { guide as sharedKitchen } from "./shared-kitchen";
import { guide as incheonAirportToNoryangjin } from "./incheon-airport-to-noryangjin";
import { guide as whatIsAGoshiwon } from "./what-is-a-goshiwon";
import { guide as dongjakGuNeighborhoodGuide } from "./dongjak-gu-neighborhood-guide";
import { guide as movingToKoreaChecklist } from "./moving-to-korea-checklist";

export type { Guide };

export const guides: Guide[] = [
  incheonAirportToNoryangjin,
  laundry,
  sharedKitchen,
  goshiwonVsHasukjibVsOfficetel,
  monthlyGoshiwonSeoul,
  weeklyGoshiwonSeoul,
  goshiwonPricesSeoul2026,
  whatIsAGoshiwon,
  dongjakGuNeighborhoodGuide,
  movingToKoreaChecklist,
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((guide) => guide.slug === slug);
}
