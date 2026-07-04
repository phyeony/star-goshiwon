import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PostHogProvider } from "@/components/analytics/posthog-provider";
import { PostHogPageview } from "@/components/analytics/posthog-pageview";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { siteConfig } from "@/lib/site-data";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Cheap Goshiwon in Seoul for Foreigners | Star Goshiwon",
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "goshiwon",
    "goshiwon in Seoul",
    "cheap stay in Seoul",
    "cheap room in Korea",
    "short term stay Seoul",
    "monthly rental Seoul",
    "student housing Seoul",
    "foreigner housing Korea",
    "budget accommodation Seoul",
    "Seoul long term stay",
  ],
  alternates: {
    canonical: "/",
  },
  robots:
    process.env.STAGING === "true"
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  openGraph: {
    title: "Cheap Goshiwon in Seoul for Foreigners | Star Goshiwon",
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/images/hero/balcony-view.jpg",
        width: 1200,
        height: 630,
        alt: "Goshiwon room with balcony view in Seoul",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/images/hero/balcony-view.jpg"],
  },
  verification: {
    google: "k6UYqKp5TQzy36pTlf3HiOZb7JCnbG0a_2cJpzTHXVo",
    other: {
      "naver-site-verification": "27d29061aa07cd1bef8feb57653daf872d3b45b0"
    }
  },
};

const lodgingJsonLd = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  name: siteConfig.name,
  description: siteConfig.description,
  url: siteConfig.url,
  email: siteConfig.email,
  telephone: siteConfig.phone,
  image: `${siteConfig.url}/images/og-cover.jpg`,
  priceRange: "$75–$300",
  address: {
    "@type": "PostalAddress",
    streetAddress: "64, Manyang-ro 12ga-gil, Dongjak-gu",
    addressLocality: "Seoul",
    addressRegion: "Seoul",
    postalCode: "06937",
    addressCountry: "KR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: siteConfig.coordinates.lat,
    longitude: siteConfig.coordinates.lng,
  },
  hasMap: siteConfig.mapUrl,
  amenityFeature: [
    "High-Speed WiFi",
    "AC / Heating",
    "Shared Kitchen",
    "Laundry Room",
    "Utilities Included",
    "English-Speaking Staff",
  ].map((name) => ({
    "@type": "LocationFeatureSpecification",
    name,
    value: true,
  })),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(lodgingJsonLd) }}
        />
        <PostHogProvider>
          <Suspense fallback={null}>
            <PostHogPageview />
          </Suspense>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <GoogleAnalytics />
        </PostHogProvider>
      </body>
    </html>
  );
}
