import { buildGuestConfirmationHtml, buildGuestConfirmationText } from "@/lib/email";
import { calculateEstimate, getUsdPrices } from "@/lib/pricing";

const sampleBreakdown = calculateEstimate(
  getUsdPrices("room-with-private-shower"),
  "2026-05-01",
  "2026-05-29",
  { beddingPrepaid: true }
);

const sample = {
  guest_name: "Jane Doe",
  guest_email: "jane@example.com",
  room_name: "Private Room with Shower (Room 601)",
  check_in_date: "2026-05-01",
  check_out_date: "2026-05-29",
  guest_count: 1,
  estimated_total: sampleBreakdown.total,
  bedding_prepaid: true,
  notes: "Hi! I'd like to arrive around 3pm. Is early check-in possible?",
  breakdown: sampleBreakdown,
};

export default function EmailPreviewPage() {
  const html = buildGuestConfirmationHtml(sample);
  const text = buildGuestConfirmationText(sample);

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Email Preview — Guest Confirmation
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Rendered with sample booking data. Edit{" "}
          <code className="bg-gray-200 px-1 rounded">lib/email.ts</code> to change
          the template.
        </p>

        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700 mb-3">
            HTML version
          </h2>
          <div
            className="bg-white rounded-lg shadow-sm p-4"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700 mb-3">
            Plain-text version
          </h2>
          <pre className="bg-white rounded-lg shadow-sm p-4 text-sm text-gray-800 whitespace-pre-wrap font-mono">
            {text}
          </pre>
        </section>
      </div>
    </div>
  );
}
