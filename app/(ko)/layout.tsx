import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { PostHogProvider } from "@/components/analytics/posthog-provider";
import { PostHogPageview } from "@/components/analytics/posthog-pageview";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { siteConfig } from "@/lib/site-data";
import "../globals.css";

// Root layout for the Korean site. A separate root layout (route group) is the
// only way to serve <html lang="ko">, which Naver and Google use for language.
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "노량진 고시원 스타고시원",
    template: "%s | 스타고시원",
  },
  robots:
    process.env.STAGING === "true"
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
  verification: {
    google: "k6UYqKp5TQzy36pTlf3HiOZb7JCnbG0a_2cJpzTHXVo",
    other: {
      "naver-site-verification": "27d29061aa07cd1bef8feb57653daf872d3b45b0",
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
};

export default function KoRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body
        className="bg-white text-[#16181A] antialiased"
        style={{
          fontFamily:
            "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
          wordBreak: "keep-all",
        }}
      >
        <PostHogProvider>
          <Suspense fallback={null}>
            <PostHogPageview />
          </Suspense>
          {children}
          <GoogleAnalytics lang="ko" />
        </PostHogProvider>
      </body>
    </html>
  );
}
