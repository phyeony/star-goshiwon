"use client";

import { useEffect, useState } from "react";
import { pricingInsightHtml } from "./pricing-insight-html";

/**
 * Renders the self-contained pricing-analysis document inside a sandboxed
 * iframe (srcDoc), so its global CSS/JS can't leak into the admin app. The
 * embedded doc posts its content height back so we can size the frame to fit
 * with no inner scrollbar.
 */
export function PricingInsight() {
  const [height, setHeight] = useState(3600);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data as { __ph_h?: number } | null;
      if (data && typeof data.__ph_h === "number" && data.__ph_h > 0) {
        setHeight(data.__ph_h + 24);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <iframe
      title="요금 분석"
      srcDoc={pricingInsightHtml}
      className="w-full rounded-2xl border border-gray-200 bg-white"
      style={{ height }}
    />
  );
}
