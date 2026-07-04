"use client";

import { PostHogProvider as PHProvider } from "posthog-js/react";
import { POSTHOG_HOST, POSTHOG_KEY, posthogEnabled } from "@/lib/analytics";

// Wraps the app in PostHog. Runs cookieless (`persistence: 'memory'`) with
// autocapture on (every click is tracked automatically). Pageviews are captured
// manually by <PostHogPageview /> because App Router soft navigations don't
// fire $pageview reliably. When the key is absent (staging/dev), this is a
// no-op passthrough.
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!posthogEnabled) return <>{children}</>;

  return (
    <PHProvider
      apiKey={POSTHOG_KEY}
      options={{
        api_host: POSTHOG_HOST,
        persistence: "memory",
        autocapture: true,
        capture_pageview: false,
        capture_pageleave: true,
        disable_session_recording: true,
      }}
    >
      {children}
    </PHProvider>
  );
}
