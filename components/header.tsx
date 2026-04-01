import Link from "next/link";
import { property } from "@/lib/site-data";

const links = [
  { href: "/rooms", label: "Rooms" },
  { href: "/request-to-book", label: "Request to Book" },
  { href: "/location", label: "Location" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" }
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-sand/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-xl font-semibold text-ink">
          {property.name}
        </Link>
        <nav className="hidden gap-6 text-sm font-medium text-ink/80 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-coral">
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/request-to-book"
          className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white"
        >
          Request to Book
        </Link>
      </div>
    </header>
  );
}
