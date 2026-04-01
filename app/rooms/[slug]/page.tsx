import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { rooms } from "@/lib/site-data";

export function generateStaticParams() {
  return rooms.map((room) => ({ slug: room.slug }));
}

export default async function RoomDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = rooms.find((entry) => entry.slug === slug);

  if (!room) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative min-h-[420px] overflow-hidden rounded-[36px]">
          <Image src={room.photo} alt={room.name} fill className="object-cover" />
        </div>
        <div>
          <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-pine">
            {room.status}
          </span>
          <h1 className="mt-5 font-display text-5xl text-ink">{room.name}</h1>
          <p className="mt-4 text-base leading-7 text-ink/70">{room.summary}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] bg-white p-5 shadow-card">
              <p className="text-sm text-ink/60">Nightly</p>
              <p className="font-display text-3xl">${room.priceNight}</p>
            </div>
            <div className="rounded-[24px] bg-white p-5 shadow-card">
              <p className="text-sm text-ink/60">Monthly</p>
              <p className="font-display text-3xl">${room.priceMonth}</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {room.amenities.map((amenity) => (
              <span key={amenity} className="rounded-full bg-white px-4 py-2 text-sm shadow-card">
                {amenity}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/request-to-book" className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white">
              Request this room
            </Link>
            <Link href="/contact" className="rounded-full border border-ink px-5 py-3 text-sm font-semibold text-ink">
              Ask a question
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
