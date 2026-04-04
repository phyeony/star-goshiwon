import type { Metadata } from "next";
import { RequestForm } from "@/components/request-form";
import { getPublicRooms } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Request to Book",
  description:
    "Submit a booking request for a goshiwon room in Seoul. No payment required. We will review and respond within 24 hours.",
};

export const dynamic = "force-dynamic";

export default async function RequestToBookPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const { room: preselectedSlug } = await searchParams;
  const rooms = await getPublicRooms();

  const roomOptions = rooms.map((r) => ({
    name: r.name,
    slug: r.slug,
    price_monthly: r.price_monthly,
    price_weekly: r.price_weekly,
    price_daily: r.price_daily,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Request to Book
          </h1>
          <p className="mt-2 text-base text-gray-500">
            Fill in your details below and we&rsquo;ll get back to you within 24
            hours. No payment is required at this stage.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
          <RequestForm
            rooms={roomOptions}
            preselectedSlug={preselectedSlug}
          />
        </div>
      </div>
    </div>
  );
}
