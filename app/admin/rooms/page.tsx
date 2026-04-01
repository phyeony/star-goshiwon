import { rooms } from "@/lib/site-data";

export default function AdminRoomsPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-5xl text-ink">Room management</h1>
      <div className="mt-10 grid gap-4">
        {rooms.map((room) => (
          <div key={room.slug} className="rounded-[28px] bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-2xl text-ink">{room.name}</p>
                <p className="mt-2 text-sm text-ink/65">{room.summary}</p>
              </div>
              <button className="rounded-full border border-ink px-4 py-2 text-sm font-semibold text-ink">
                Edit room
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
