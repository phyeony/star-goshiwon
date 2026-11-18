import {
  BEDDING_FEE_USD,
  DEPOSIT_USD,
  LONG_STAY_MIN_NIGHTS,
  fillPricingTokens,
  formatApproxKRW,
  formatUSD,
  roomTier,
  type UsdPriceTier,
} from "@/lib/pricing";
import {
  amenities,
  buildFaqs,
  nearbyLocations,
  siteConfig,
  stayTimes,
} from "@/lib/site-data";
import { MIN_STAY_NIGHTS } from "@/lib/validation";
import type { Guide } from "@/lib/guides/types";
import { MANAGER_FACTS } from "./facts";
import type { QuoteRoom } from "./tools";

// Guides that answer practical guest questions. The SEO comparison and
// market-price guides are left out: they quote other places' prices.
export const KNOWLEDGE_GUIDE_SLUGS = [
  "incheon-airport-to-noryangjin",
  "laundry",
  "shared-kitchen",
  "dongjak-gu-neighborhood-guide",
  "what-is-a-goshiwon",
];

export interface KnowledgeInput {
  rooms: QuoteRoom[];
  economyTier: UsdPriceTier;
  policiesText: string;
  guides: Guide[];
  siteUrl: string;
}

// Everything the agent may state as fact. Built only from site data, so it
// is identical for every conversation (good for prompt caching) and changes
// only when the site's content or prices change.
export function buildKnowledgePack(input: KnowledgeInput): string {
  const discountPct = Math.round(input.economyTier.discount * 100);
  const rooms = input.rooms
    .map((r) => {
      const t = roomTier(r);
      return [
        `- ${r.name} (id: ${r.slug}, page: ${input.siteUrl}/rooms/${r.slug})`,
        `  ${formatUSD(t.nightly)} per night (${formatApproxKRW(t.nightly)}); 1 week ${formatUSD(t.weekly)} (${formatApproxKRW(t.weekly)}); 4 weeks ${formatUSD(t.monthly)} (${formatApproxKRW(t.monthly)}) after the ${Math.round(t.discount * 100)}% long-stay discount`,
      ].join("\n");
    })
    .join("\n");

  const faqs = buildFaqs(discountPct)
    .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
    .join("\n\n");

  const guides = input.guides
    .filter((g) => KNOWLEDGE_GUIDE_SLUGS.includes(g.slug))
    .map((g) => `### ${g.title}\n${stripMarkdown(fillPricingTokens(g.content, input.economyTier))}`)
    .join("\n\n");

  return [
    "# STAR GOSHIWON — KNOWLEDGE PACK",
    "Only facts in this pack may be stated to guests.",
    "",
    "## Basics",
    `Name: Star Goshiwon (website: ${input.siteUrl}). Men-only residence. One person per room (single occupancy only, no couples or sharing).`,
    `Address: ${siteConfig.address} (Korean: 서울시 동작구 만양로12가길 64). Near Noryangjin Station.`,
    `Maps: Naver Map ${siteConfig.naverMapUrl} · Google Maps ${siteConfig.mapUrl}`,
    `Check-in from ${stayTimes.checkInEn}, check-out by ${stayTimes.checkOutEn}. Self check-in.`,
    `Minimum stay: ${MIN_STAY_NIGHTS} nights. Stays of ${LONG_STAY_MIN_NIGHTS}+ nights get the long-stay discount.`,
    `Booking: request a room on the website (no payment to request: ${input.siteUrl}/request-to-book). We reply within ${siteConfig.responseTime}.`,
    `Amenities in every room / building: ${amenities.map((a) => a.label).join(", ")}.`,
    "",
    "## Rooms and prices (USD is what PayPal charges; KRW is approximate)",
    rooms,
    `Refundable deposit: ${formatUSD(DEPOSIT_USD)} (${formatApproxKRW(DEPOSIT_USD)}). Optional bedding set: ${formatUSD(BEDDING_FEE_USD)} (${formatApproxKRW(BEDDING_FEE_USD)}).`,
    "",
    "## Nearby",
    nearbyLocations.map((l) => `- ${l.name}: ${l.distance}`).join("\n"),
    "",
    "## Manager's house notes",
    MANAGER_FACTS.map((f) => `- ${f}`).join("\n"),
    "",
    "## FAQ",
    faqs,
    "",
    "## Policies (from the Policies page)",
    input.policiesText,
    "",
    "## Guides",
    guides,
  ].join("\n");
}

function stripMarkdown(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
