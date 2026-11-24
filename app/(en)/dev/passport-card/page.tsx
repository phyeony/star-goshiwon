import { PassportCard } from "@/components/admin/passport-card";

// Dev-only preview of the admin request page's passport card, in its three
// states. Buttons call real admin routes, so they only work with a real request.
export default function PassportCardPreview() {
  const id = "00000000-0000-0000-0000-000000000000";
  const log = [
    { action: "view", actor: "manager@example.com", at: "2026-11-24T05:10:00Z" },
    { action: "upload", actor: "guest", at: "2026-11-24T04:58:00Z" },
    { action: "link_sent", actor: "manager@example.com", at: "2026-11-24T04:50:00Z" },
  ];
  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 md:grid-cols-3">
        <PassportCard requestId={id} checkOutDate="2026-12-15" hasPhoto={false} uploadedAt={null} checkedAt={null} deletedAt={null} linkCreatedAt={null} hasWhatsApp log={[]} />
        <PassportCard requestId={id} checkOutDate="2026-12-15" hasPhoto uploadedAt="2026-11-24T04:58:00Z" checkedAt={null} deletedAt={null} linkCreatedAt="2026-11-24T04:50:00Z" hasWhatsApp log={log} />
        <PassportCard requestId={id} checkOutDate="2026-12-15" hasPhoto uploadedAt="2026-11-24T04:58:00Z" checkedAt="2026-11-24T05:12:00Z" deletedAt={null} linkCreatedAt="2026-11-24T04:50:00Z" hasWhatsApp={false} log={log} />
      </div>
    </div>
  );
}
