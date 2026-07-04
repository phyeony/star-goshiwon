"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { GA_ID, gaEnabled, GA_CONSENT_STORAGE_KEY } from "@/lib/analytics";

type Choice = "granted" | "denied" | null;
const STORAGE_KEY = GA_CONSENT_STORAGE_KEY;

function updateConsent(granted: boolean) {
  const value = granted ? "granted" : "denied";
  (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.(
    "consent",
    "update",
    {
      analytics_storage: value,
      ad_storage: value,
      ad_user_data: value,
      ad_personalization: value,
    }
  );
}

// Google Analytics 4 with Consent Mode v2. gtag.js is NOT loaded until the
// user accepts cookies — until then only the consent defaults (all denied)
// are registered. No-op when the measurement ID is absent (staging/dev).
export function GoogleAnalytics() {
  const [mounted, setMounted] = useState(false);
  const [choice, setChoice] = useState<Choice>(null);

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem(STORAGE_KEY) as Choice;
    if (stored === "granted" || stored === "denied") setChoice(stored);
  }, []);

  if (!gaEnabled) return null;

  const consented = choice === "granted";

  function decide(granted: boolean) {
    setChoice(granted ? "granted" : "denied");
    window.localStorage.setItem(STORAGE_KEY, granted ? "granted" : "denied");
    updateConsent(granted);
  }

  return (
    <>
      {/* Consent Mode v2 defaults — runs early, does not load gtag.js */}
      <Script id="ga-consent-default" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            wait_for_update: 500
          });
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>

      {/* gtag.js only loads once the visitor has consented */}
      {mounted && consented && (
        <Script
          id="ga-lib"
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        />
      )}

      {/* Consent banner — only shown before a choice is made.
          Rendered after mount to avoid an SSR/hydration mismatch. */}
      {mounted && choice === null && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700">
              We use cookies to understand how visitors use our site and improve
              your experience. You can accept or decline analytics cookies.
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => decide(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => decide(true)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
