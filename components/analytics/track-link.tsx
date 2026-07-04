"use client";

import posthog from "posthog-js";
import { posthogEnabled } from "@/lib/analytics";

interface TrackLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  event: string;
  properties?: Record<string, string | number | boolean | undefined>;
}

// Anchor that captures a PostHog event on click, for outbound/contact links
// (mailto:, WhatsApp, maps) where autocapture alone can't tell us the channel.
export function TrackLink({
  event,
  properties,
  children,
  ...anchorProps
}: TrackLinkProps) {
  return (
    <a
      {...anchorProps}
      onClick={() => {
        if (posthogEnabled) posthog.capture(event, properties);
      }}
    >
      {children}
    </a>
  );
}
