"use client";

import { useEffect, useRef } from "react";
import { trackGaEvent, type GaParams } from "@/lib/ga";

interface GaEventProps {
  event: string;
  params?: GaParams;
}

// Fires a GA4 event once on mount. Renders nothing — drop it into a server
// component (room page, payment return page) to emit a GA4 recommended event
// with ecommerce params. Consent gating lives in trackGaEvent.
export function GaEvent({ event, params }: GaEventProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackGaEvent(event, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
