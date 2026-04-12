import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-data";

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/dev"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
