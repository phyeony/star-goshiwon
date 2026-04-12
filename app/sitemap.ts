import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-data";
import { getPublicRooms } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/rooms`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/location`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/policies`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/request-to-book`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  let roomRoutes: MetadataRoute.Sitemap = [];
  try {
    const rooms = await getPublicRooms();
    roomRoutes = rooms.map((room) => ({
      url: `${base}/rooms/${room.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // If DB unreachable at build time, fall back to static routes only.
  }

  return [...staticRoutes, ...roomRoutes];
}
