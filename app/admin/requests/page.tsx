const requests = [
  {
    guest: "Maria S.",
    room: "Standard Single",
    dates: "2026-05-10 to 2026-06-30",
    channel: "WhatsApp",
    status: "New"
  },
  {
    guest: "Daniel K.",
    room: "Compact Single",
    dates: "2026-04-12 to 2026-04-29",
    channel: "Email",
    status: "Contacted"
  }
];

export default function AdminRequestsPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-5xl text-ink">Booking requests</h1>
      <div className="mt-10 overflow-hidden rounded-[32px] bg-white shadow-card">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-mist text-ink/70">
            <tr>
              <th className="px-6 py-4">Guest</th>
              <th className="px-6 py-4">Room</th>
              <th className="px-6 py-4">Dates</th>
              <th className="px-6 py-4">Channel</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.guest} className="border-t border-black/5">
                <td className="px-6 py-4">{request.guest}</td>
                <td className="px-6 py-4">{request.room}</td>
                <td className="px-6 py-4">{request.dates}</td>
                <td className="px-6 py-4">{request.channel}</td>
                <td className="px-6 py-4">{request.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
