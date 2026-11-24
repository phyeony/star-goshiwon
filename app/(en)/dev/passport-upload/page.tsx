import type { Metadata } from "next";
import { PassportUploadPage } from "@/components/passport-upload/passport-upload-page";

export const metadata: Metadata = {
  title: "Verify your identity",
  robots: { index: false, follow: false },
};

// Dev-only preview with sample data; uploads are simulated (no uploadUrl).
// Add ?state=done to see the screen shown after a successful upload.
export default async function PassportUploadPreview({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  return (
    <PassportUploadPage
      booking={{
        guestName: "Jane Doe",
        roomName: "Private Room with Shower (Room 601)",
        checkIn: "2026-12-01",
        checkOut: "2026-12-15",
      }}
      initiallyDone={state === "done"}
    />
  );
}
