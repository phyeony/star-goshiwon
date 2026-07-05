import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackEvent } from "@/components/analytics/track-event";
import { getGuide } from "@/lib/guides-data";
import { fillPricingTokens } from "@/lib/pricing";
import { getEconomyTier } from "@/lib/queries";

interface Props {
  params: Promise<{ slug: string }>;
}

// Guide copy embeds live pricing (via {{...}} tokens filled from the rooms
// table), so guides render at request time instead of being prebuilt.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Guide Not Found" };

  return {
    title: guide.seoTitle ? { absolute: guide.seoTitle } : guide.title,
    description: guide.excerpt,
  };
}

function renderContent(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let tableRows: string[] = [];
  let key = 0;

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-1 text-base text-gray-600 mb-6 ml-1">
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  }

  function flushTable() {
    if (tableRows.length === 0) return;
    const parseRow = (row: string) =>
      row.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    const header = parseRow(tableRows[0]);
    const hasSeparator =
      tableRows.length > 1 && /^[\s\-|:]+$/.test(tableRows[1]);
    const body = tableRows.slice(hasSeparator ? 2 : 1).map(parseRow);
    elements.push(
      <div key={key++} className="my-6 overflow-x-auto">
        <table className="w-full text-sm border border-gray-200 rounded-2xl overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              {header.map((cell, i) => (
                <th
                  key={i}
                  className="text-left font-semibold text-gray-900 px-4 py-3 border-b border-gray-200"
                >
                  {renderInline(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr
                key={ri}
                className="border-b border-gray-100 last:border-b-0"
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="text-gray-600 px-4 py-3 align-top"
                  >
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
  }

  function renderInline(text: string): React.ReactNode {
    // Handle **bold** and [links](url)
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let partKey = 0;

    while (remaining.length > 0) {
      // Bold
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      // Link
      const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/);

      let firstMatch: { index: number; type: "bold" | "link"; full: string } | null = null;

      if (boldMatch?.index !== undefined) {
        firstMatch = { index: boldMatch.index, type: "bold", full: boldMatch[0] };
      }
      if (linkMatch?.index !== undefined) {
        if (!firstMatch || linkMatch.index < firstMatch.index) {
          firstMatch = { index: linkMatch.index, type: "link", full: linkMatch[0] };
        }
      }

      if (!firstMatch) {
        parts.push(remaining);
        break;
      }

      if (firstMatch.index > 0) {
        parts.push(remaining.slice(0, firstMatch.index));
      }

      if (firstMatch.type === "bold" && boldMatch) {
        parts.push(
          <strong key={partKey++} className="font-semibold text-gray-900">
            {boldMatch[1]}
          </strong>
        );
      } else if (firstMatch.type === "link" && linkMatch) {
        parts.push(
          <a
            key={partKey++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-700 underline"
          >
            {linkMatch[1]}
          </a>
        );
      }

      remaining = remaining.slice(firstMatch.index + firstMatch.full.length);
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList();
      tableRows.push(trimmed);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      flushTable();
      elements.push(
        <h2 key={key++} className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("### ")) {
      flushList();
      flushTable();
      elements.push(
        <h3 key={key++} className="text-xl font-bold text-gray-900 mt-8 mb-3">
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith("![")) {
      flushList();
      flushTable();
      const imgMatch = trimmed.match(/^!\[(.*?)\]\((.+?)\)$/);
      if (imgMatch) {
        elements.push(
          <figure key={key++} className="my-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgMatch[2]}
              alt={imgMatch[1]}
              className="w-full rounded-2xl border border-gray-200"
            />
            {imgMatch[1] && (
              <figcaption className="mt-2 text-sm text-gray-500 text-center">
                {imgMatch[1]}
              </figcaption>
            )}
          </figure>
        );
      }
    } else if (trimmed.startsWith("- ")) {
      flushTable();
      listItems.push(trimmed.slice(2));
    } else if (trimmed === "") {
      flushList();
      flushTable();
    } else {
      flushList();
      flushTable();
      elements.push(
        <p key={key++} className="text-base text-gray-600 mb-4 leading-relaxed">
          {renderInline(trimmed)}
        </p>
      );
    }
  }

  flushList();
  flushTable();
  return elements;
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) notFound();

  const tier = await getEconomyTier();
  const content = fillPricingTokens(guide.content, tier);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <TrackEvent
        event="guide_viewed"
        properties={{ guide_slug: guide.slug, guide_title: guide.title }}
      />
      <nav className="mb-8 text-sm text-gray-500">
        <Link href="/guides" className="hover:text-indigo-600 transition">
          Guides
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 line-clamp-1">{guide.title}</span>
      </nav>

      <article>
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
            {guide.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <time dateTime={guide.date}>
              {new Date(guide.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span>&middot;</span>
            <span>{guide.readTime}</span>
          </div>
        </header>

        <div>{renderContent(content)}</div>
      </article>

      <div className="mt-12 pt-8 border-t border-gray-200">
        <Link
          href="/guides"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 text-sm font-medium transition"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Guides
        </Link>
      </div>
    </div>
  );
}
