"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import {
  ANALYTICS_CONSENT_EVENT,
  GA_CONSENT_STORAGE_KEY,
  gaEnabled,
  NAVER_ANALYTICS_ID,
} from "@/lib/analytics";

type NaverWindow = Window & {
  wcs?: { inflow?: (domain?: string) => void };
  wcs_add?: Record<string, string>;
  wcs_do?: () => void;
};

/**
 * Naver Analytics (wcslog.js). Loads only on the live domain and, like GA,
 * only after the visitor accepts cookies. Logs a page view on every route change.
 */
export function NaverAnalytics() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!/(^|\.)goshiwonseoul\.com$/.test(window.location.hostname)) return;
    // Without GA there is no cookie banner, so nothing to wait for.
    const check = () =>
      setAllowed(!gaEnabled || window.localStorage.getItem(GA_CONSENT_STORAGE_KEY) === "granted");
    check();
    window.addEventListener(ANALYTICS_CONSENT_EVENT, check);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, check);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const w = window as NaverWindow;
    w.wcs_add = w.wcs_add || {};
    w.wcs_add["wa"] = NAVER_ANALYTICS_ID;
    if (w.wcs && w.wcs_do) {
      w.wcs.inflow?.("goshiwonseoul.com");
      w.wcs_do();
    }
  }, [loaded, pathname]);

  if (!allowed) return null;
  return (
    <Script
      id="naver-analytics"
      src="https://wcs.pstatic.net/wcslog.js"
      strategy="afterInteractive"
      onReady={() => setLoaded(true)}
    />
  );
}
