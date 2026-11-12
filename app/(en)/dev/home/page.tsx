import Link from "next/link";
import { HERO_VARIANTS } from "@/components/dev/hero-variants";

export const metadata = { title: "Home Variants (dev)" };

export default function DevHomeIndex() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
        Home Hero Variants
      </h1>
      <p className="text-gray-500 mb-8">
        Exploring hero button treatments for better readability over the
        slideshow backgrounds.
      </p>
      <ul className="space-y-3">
        {HERO_VARIANTS.map((v) => (
          <li key={v.slug}>
            <Link
              href={`/dev/home/${v.slug}`}
              className="flex items-center justify-between px-5 py-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-400 hover:shadow-sm transition"
            >
              <span className="font-semibold text-gray-900">{v.label}</span>
              <span className="text-indigo-600 text-sm font-medium">
                View →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
