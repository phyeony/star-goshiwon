import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PoliciesContent } from "@/components/policies-content";

// The /policies sections as plain text, rendered from the same component the
// page uses, so the agent can't drift from what guests read on the site.
export function policiesPlainText(discountPct: number): string {
  return htmlToText(
    renderToStaticMarkup(createElement(PoliciesContent, { discountPct })),
  );
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
