import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["worker-mailer", "cloudflare:sockets"],
  // The Korean policy moved under the Korean site. Keep old links (emails,
  // signed documents) working.
  async redirects() {
    return [
      { source: "/policies/ko", destination: "/ko/policy", permanent: true },
      { source: "/policies/ko/archive", destination: "/ko/policy/archive", permanent: true },
      { source: "/policies/ko/archive/:slug", destination: "/ko/policy/archive/:slug", permanent: true },
    ];
  },
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
