import Link from "next/link";
import { property } from "@/lib/site-data";

export default function LocationPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-5xl text-ink">Location</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-ink/72">
        {property.address}. Position this page around convenience: transit, nearby food, late-night
        essentials, and how easy it is for new arrivals to settle in.
      </p>
      <div className="mt-8 rounded-[32px] bg-white p-8 shadow-card">
        <p className="text-sm uppercase tracking-[0.2em] text-coral">Nearby highlights</p>
        <ul className="mt-4 space-y-3 text-sm leading-7 text-ink/70">
          <li>3-minute walk to the subway station</li>
          <li>Convenience store and laundromat on the same block</li>
          <li>Fast access to university and office districts</li>
        </ul>
        <Link href={property.mapHref} className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
          Open map
        </Link>
      </div>
    </section>
  );
}
