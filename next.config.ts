import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["worker-mailer", "cloudflare:sockets"],
  // The Korean policy moved under the Korean site. Keep old links (emails,
  // signed documents) working.
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
