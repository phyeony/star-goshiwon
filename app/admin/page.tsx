import Link from "next/link";
import { requestStatuses, rooms } from "@/lib/site-data";

export default function AdminPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">Admin</p>
          <h1 className="mt-3 font-display text-5xl text-ink">Dashboard mock</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/rooms" className="rounded-full border border-ink px-4 py-2 text-sm font-semibold text-ink">
            Manage rooms
          </Link>
          <Link href="/admin/requests" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
            View requests
          </Link>
        </div>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-4">
        {requestStatuses.map((status) => (
          <div key={status.name} className="rounded-[28px] bg-white p-6 shadow-card">
            <p className="text-sm text-ink/60">{status.name}</p>
            <p className="mt-2 font-display text-4xl text-ink">{status.count}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 rounded-[32px] bg-white p-8 shadow-card">
        <h2 className="font-display text-3xl text-ink">Current room setup</h2>
        <div className="mt-6 grid gap-4">
          {rooms.map((room) => (
            <div key={room.slug} className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-sand p-4">
              <div>
                <p className="font-semibold text-ink">{room.name}</p>
                <p className="text-sm text-ink/60">${room.priceNight}/night · ${room.priceMonth}/month</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-pine">{room.status}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
