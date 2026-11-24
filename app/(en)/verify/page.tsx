import type { Metadata } from "next";
import Link from "next/link";
import { PassportUploadPage } from "@/components/passport-upload/passport-upload-page";
import { checkPassportLink, getActivePhoto } from "@/lib/passport/service";
import { siteConfig } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Verify your identity",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

// The guest's booking verification link: /verify?r=<request id>&t=<token>.
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string; t?: string }>;
}) {
  const { r, t } = await searchParams;
  const link = await checkPassportLink(r, t);

  if (!link.ok) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-gray-900">
          {link.reason === "closed" ? "This link has closed" : "This link isn't valid"}
        </h1>
        <p className="mt-3 text-gray-600">
          {link.reason === "closed"
            ? "This booking no longer needs verification."
            : "It may have been replaced by a newer link."}{" "}
          If you still need to verify, message us and we&apos;ll send you a new
          link.
        </p>
        <p className="mt-6 text-sm">
          <a href={`mailto:${siteConfig.email}`} className="text-indigo-600 hover:underline">
            {siteConfig.email}
          </a>
          {" · "}
          <Link href="/contact" className="text-indigo-600 hover:underline">
            Contact
          </Link>
        </p>
      </div>
    );
  }

  const request = link.request;
  const existing = await getActivePhoto(request.id);
  return (
    <PassportUploadPage
      booking={{
        guestName: request.guest_name,
        roomName: request.rooms?.name || request.room_slug,
        checkIn: request.check_in_date,
        checkOut: request.check_out_date,
      }}
      uploadUrl="/api/passport/upload"
      uploadFields={{ r: request.id, t: t! }}
      initiallyDone={Boolean(existing)}
    />
  );
}
