"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";

// Fires a $pageview on every client-side route change. App Router soft
// navigations don't trigger PostHog's automatic pageview, so we do it here.
// MUST be rendered inside a <Suspense> boundary because useSearchParams()
// otherwise opts the whole route into client-side bailout (Next.js 15 rule).
export function PostHogPageview() {
  const posthog = usePostHog();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!posthog || !pathname) return;
    let url = window.origin + pathname;
    const query = searchParams.toString();
    if (query) url += `?${query}`;
    posthog.capture("$pageview", { $current_url: url });
  }, [posthog, pathname, searchParams]);

  return null;
}
