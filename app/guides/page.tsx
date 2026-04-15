import type { Metadata } from "next";
import Link from "next/link";
import { SectionTitle } from "@/components/section-title";
import { guides } from "@/lib/guides-data";

export const metadata: Metadata = {
  title: "Guides",
  description:
    "Guides for guests of Noryangjin Star Goshiwon — how to get here, how to use our facilities, and tips for living in Seoul as a foreigner.",
};

export default function GuidesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <SectionTitle
        title="Guides"
        subtitle="How to get here, how to use our facilities, and tips for living in Seoul."
      />

      <div className="space-y-6">
        {guides.map((guide) => (
          <Link key={guide.slug} href={`/guides/${guide.slug}`} className="block">
            <article className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition duration-150 ease-in-out">
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
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
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {guide.title}
              </h2>
              <p className="text-base text-gray-600">{guide.excerpt}</p>
            </article>
          </Link>
        ))}
      </div>

      <div className="mt-12 bg-indigo-50 rounded-2xl border border-indigo-100 p-8 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          More guides coming soon
        </h3>
        <p className="text-base text-gray-600">
          We&rsquo;re working on more guides for guests of Noryangjin Star Goshiwon.
          Follow us for updates.
        </p>
      </div>
    </div>
  );
}
