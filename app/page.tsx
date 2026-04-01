import Image from "next/image";
import Link from "next/link";
import { RoomCard } from "@/components/room-card";
import { SectionTitle } from "@/components/section-title";
import { faqs, property, rooms } from "@/lib/site-data";

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-coral">
            Foreigners welcome
          </p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-ink md:text-7xl">
            Comfortable Seoul living without the confusing rental process.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink/72">
            {property.tagline}. Browse fixed pricing, compare room types, and send an Airbnb-style
            request before you arrive in Korea.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/request-to-book" className="rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white">
              Request to Book
            </Link>
            <Link href="/rooms" className="rounded-full border border-ink px-5 py-3 text-sm font-semibold text-ink">
              Explore Rooms
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] bg-white p-5 shadow-card">
              <p className="font-display text-3xl">3 min</p>
              <p className="mt-2 text-sm text-ink/65">to the nearest subway station</p>
            </div>
            <div className="rounded-[24px] bg-white p-5 shadow-card">
              <p className="font-display text-3xl">24/7</p>
              <p className="mt-2 text-sm text-ink/65">self-service essentials nearby</p>
            </div>
            <div className="rounded-[24px] bg-white p-5 shadow-card">
              <p className="font-display text-3xl">From $38</p>
              <p className="mt-2 text-sm text-ink/65">fixed nightly pricing</p>
            </div>
          </div>
        </div>
        <div className="relative min-h-[420px] overflow-hidden rounded-[40px] bg-clay">
          <Image src={property.heroImage} alt={property.name} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-white/70">{property.address}</p>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/85">{property.neighborhood}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <SectionTitle
          eyebrow="Rooms"
          title="Three room styles, one simple booking path"
          body="Show foreign guests exactly what they get: fixed prices, clear amenities, and an approval-based booking request instead of hidden steps."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.slug} room={room} />
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-2">
          <SectionTitle
            eyebrow="Why it works"
            title="Built for international guests who need clarity fast"
            body="The site should answer the questions that stop conversions: where the building is, how much it costs, what is included, and how to ask for a room without speaking Korean."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Fixed short-stay and monthly pricing",
              "WhatsApp and KakaoTalk contact options",
              "Foreigner-friendly explanation of goshiwon rules",
              "Airbnb-style request-to-book instead of instant booking"
            ].map((item) => (
              <div key={item} className="rounded-[28px] bg-mist p-6 text-sm font-medium leading-6 text-ink">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <SectionTitle
          eyebrow="FAQ"
          title="Answer the obvious trust questions before guests ask them"
          body="This content should also support SEO for people searching from abroad."
        />
        <div className="mt-10 grid gap-4">
          {faqs.map((item) => (
            <div key={item.question} className="rounded-[28px] bg-white p-6 shadow-card">
              <h3 className="font-display text-2xl text-ink">{item.question}</h3>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/70">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
