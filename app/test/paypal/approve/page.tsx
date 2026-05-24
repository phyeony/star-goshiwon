import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Fake PayPal Approval",
};

export const dynamic = "force-dynamic";

export default async function FakePayPalApprovePage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
    return_url?: string;
    cancel_url?: string;
  }>;
}) {
  if (process.env.E2E_TEST_MODE !== "true") notFound();

  const { token, return_url: returnUrl, cancel_url: cancelUrl } =
    await searchParams;
  if (!token || !returnUrl || !cancelUrl) notFound();

  const approveUrl = new URL("/test/paypal/complete", "http://localhost");
  approveUrl.searchParams.set("token", token);
  approveUrl.searchParams.set("return_url", returnUrl);

  return (
    <main className="max-w-xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900">Fake PayPal</h1>
      <p className="mt-4 text-sm text-gray-600">Order {token}</p>
      <div className="mt-8 flex gap-3">
        <Link
          href={`${approveUrl.pathname}${approveUrl.search}`}
          className="inline-flex rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Approve payment
        </Link>
        <Link
          href={cancelUrl}
          className="inline-flex rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700"
        >
          Cancel
        </Link>
      </div>
    </main>
  );
}
