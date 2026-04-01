import Link from "next/link";
import { property } from "@/lib/site-data";

export function Footer() {
  return (
    <footer className="border-t border-black/5 bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-xl">{property.name}</p>
          <p className="mt-3 text-sm text-white/75">{property.tagline}</p>
        </div>
        <div className="space-y-2 text-sm text-white/80">
          <p>{property.address}</p>
          <p>{property.email}</p>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/policies">Policies</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
