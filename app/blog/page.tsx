import type { Metadata } from "next";
import Link from "next/link";
import { SectionTitle } from "@/components/section-title";
import { blogPosts } from "@/lib/blog-data";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Tips, guides, and stories about living in Seoul as a foreigner. Learn about goshiwon life, neighborhoods, and more.",
};

export default function BlogPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <SectionTitle
        title="Blog"
        subtitle="Tips and guides for foreigners living in Seoul."
      />

      <div className="space-y-6">
        {blogPosts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block">
            <article className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition duration-150 ease-in-out">
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <span>&middot;</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {post.title}
              </h2>
              <p className="text-base text-gray-600">{post.excerpt}</p>
            </article>
          </Link>
        ))}
      </div>

      <div className="mt-12 bg-indigo-50 rounded-2xl border border-indigo-100 p-8 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          More content coming soon
        </h3>
        <p className="text-base text-gray-600">
          We&rsquo;re working on more guides and tips for foreigners in Seoul.
          Follow us for updates.
        </p>
      </div>
    </div>
  );
}
