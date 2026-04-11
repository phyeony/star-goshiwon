import Link from "next/link";
import { notFound } from "next/navigation";
import { HERO_VARIANTS } from "@/components/dev/hero-variants";

export function generateStaticParams() {
  return HERO_VARIANTS.map((v) => ({ slug: v.slug }));
}

export default async function DevHomeVariantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const variant = HERO_VARIANTS.find((v) => v.slug === slug);
  if (!variant) notFound();

  const Hero = variant.component;

  return (
    <>
      <Hero />
      <div className="bg-gray-50 border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-500 mr-2">
            {variant.label}
          </span>
          <Link
            href="/dev/home"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            ← All variants
          </Link>
          <div className="flex gap-2 ml-auto flex-wrap">
            {HERO_VARIANTS.map((v) => (
              <Link
                key={v.slug}
                href={`/dev/home/${v.slug}`}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition ${
                  v.slug === slug
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400"
                }`}
              >
                {v.slug.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
