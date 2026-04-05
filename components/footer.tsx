import Link from "next/link";
import { siteConfig } from "@/lib/site-data";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <svg
                className="w-7 h-7 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="font-bold text-lg text-gray-900">
                Seoul Stay
              </span>
            </Link>
            <p className="text-sm text-gray-500">{siteConfig.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Browse
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/rooms"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition"
                >
                  Rooms
                </Link>
              </li>
              <li>
                <Link
                  href="/request-to-book"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition"
                >
                  Request to Book
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Info
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/location"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition"
                >
                  Location
                </Link>
              </li>
              <li>
                <Link
                  href="/policies"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition"
                >
                  Policies
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Contact
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="text-sm text-gray-500 hover:text-indigo-600 transition"
                >
                  {siteConfig.email}
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.kakao}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:text-indigo-600 transition"
                >
                  KakaoTalk
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} {siteConfig.name} (Stargositel).
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
