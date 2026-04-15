"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/site-data";

const navLinks = [
  { href: "/rooms", label: "Rooms" },
  { href: "/guides", label: "Guides" },
  { href: "/faq", label: "FAQ" },
  { href: "/location", label: "Location" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [visible, setVisible] = useState(!isHome);

  useEffect(() => {
    if (!isHome) {
      setVisible(true);
      return;
    }

    setVisible(false);

    function handleScroll() {
      const hero = document.getElementById("hero-section");
      if (!hero) return;
      const heroBottom = hero.offsetTop + hero.offsetHeight;
      setVisible(window.scrollY > heroBottom - 80);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  return (
    <nav
      className={`bg-white border-b border-gray-200 sticky top-0 z-50 transition-all duration-500 ${
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex flex-col leading-none w-fit">
              <span className="font-bold text-2xl tracking-tight text-[#0b1f4d]">
                Star Gositel
              </span>
              <span className="-mt-0.5 flex items-center gap-1">
                <span className="h-px flex-1 bg-[#4a5fb8]/60" />
                <span className="text-[13px] font-medium tracking-wide text-[#4a5fb8] whitespace-nowrap">
                  Seoul Goshiwon
                </span>
                <span className="h-px flex-1 bg-[#4a5fb8]/60" />
              </span>
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-base text-gray-600 hover:text-indigo-600 font-medium transition duration-150 ease-in-out"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href={siteConfig.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out"
            >
              <svg
                className="w-4 h-4 mr-2 text-green-500"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
            <Link
              href="/request-to-book"
              className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition duration-150 ease-in-out"
            >
              Request to Book
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition duration-150 ease-in-out"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-base text-gray-600 hover:text-indigo-600 font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-gray-200" />
            <Link
              href="/request-to-book"
              className="block w-full text-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition duration-150 ease-in-out"
              onClick={() => setMobileOpen(false)}
            >
              Request to Book
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
