import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PoliciesContent } from "@/components/policies-content";

// The /policies sections as plain text, rendered from the same component the
// page uses, so the agent can't drift from what guests read on the site.
//
// Next.js refuses react-dom/server inside the app, so the live agent reads a
// pre-rendered copy (policies-template.generated.ts, via policies-plain.ts).
// Only scripts and tests import this file. A test fails if the copy is stale;
// refresh it with `pnpm gen:policies-text`.
export function policiesPlainText(discountPct: number): string {
  return htmlToText(
    renderToStaticMarkup(createElement(PoliciesContent, { discountPct })),
  );
}

// The discount is the only live value in the policies. It is rendered as a
// sentinel number and turned into a placeholder.
export const DISCOUNT_PLACEHOLDER = "{{DISCOUNT_PCT}}";
const SENTINEL = 987654;

export function renderPoliciesTemplate(): string {
  return policiesPlainText(SENTINEL).replaceAll(String(SENTINEL), DISCOUNT_PLACEHOLDER);
}

export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<h2[^>]*>/g, "\n\n## ")
      .replace(/<h3[^>]*>/g, "\n\n### ")
      .replace(/<li[^>]*>/g, "\n- ")
      .replace(/<tr[^>]*>/g, "\n")
      .replace(/<\/t[dh]>/g, " | ")
      .replace(/<(p|div|section|ul|ol|table|br)[^>]*>/g, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l, i, all) => l !== "" || (i > 0 && all[i - 1] !== ""))
    .join("\n")
    .trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&rdquo;|&ldquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&nbsp;/g, " ");
}
