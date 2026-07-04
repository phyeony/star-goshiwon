"use client";

import { useEffect, useRef } from "react";
import posthog from "posthog-js";
import { posthogEnabled } from "@/lib/analytics";

interface TrackEventProps {
  event: string;
  properties?: Record<string, string | number | boolean | undefined>;
}

// Captures a PostHog event once when the page/component mounts. Renders
// nothing — drop it into a server component to track a typed page view
// (e.g. room_viewed) with richer properties than the generic $pageview.
export function TrackEvent({ event, properties }: TrackEventProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (!posthogEnabled || fired.current) return;
    fired.current = true;
    posthog.capture(event, properties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
