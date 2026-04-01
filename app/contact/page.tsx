import Link from "next/link";
import { property } from "@/lib/site-data";

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-5xl text-ink">Contact</h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/72">
        Give guests fast options. Some will prefer email before arrival, others will move to
        WhatsApp or KakaoTalk once they are in Korea.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Link href={`mailto:${property.email}`} className="rounded-[28px] bg-white p-6 shadow-card">
          <p className="font-display text-2xl">Email</p>
          <p className="mt-3 text-sm text-ink/70">{property.email}</p>
        </Link>
        <Link href={property.whatsappHref} className="rounded-[28px] bg-white p-6 shadow-card">
          <p className="font-display text-2xl">WhatsApp</p>
          <p className="mt-3 text-sm text-ink/70">Chat for booking questions</p>
        </Link>
        <Link href={property.kakaotalkHref} className="rounded-[28px] bg-white p-6 shadow-card">
          <p className="font-display text-2xl">KakaoTalk</p>
          <p className="mt-3 text-sm text-ink/70">Local messaging channel</p>
        </Link>
      </div>
    </section>
  );
}
