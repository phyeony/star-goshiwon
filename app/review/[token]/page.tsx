import type { Metadata } from "next";
import Link from "next/link";
import { ReviewForm } from "@/components/review-form";
import {
  getReviewInviteByToken,
  isReviewInviteOpen,
} from "@/lib/review-queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Write a Review",
  robots: { index: false, follow: false },
};

function Notice({ heading, body }: { heading: string; body: string }) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold text-gray-900">{heading}</h1>
        <p className="mt-4 text-base leading-7 text-gray-600">{body}</p>
        <Link
          href="/reviews"
          className="mt-8 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          See guest reviews
        </Link>
      </div>
    </section>
  );
}

export default async function ReviewInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getReviewInviteByToken(token);

  if (!invite) {
    return (
      <Notice
        heading="This review link is not valid"
        body="Please check the link you received, or contact us if you think this is a mistake."
      />
    );
  }
  if (invite.used_at) {
    return (
      <Notice
        heading="This review link has already been used"
        body="Thank you — your review was already submitted. Each link can only be used once."
      />
    );
  }
  if (!isReviewInviteOpen(invite)) {
    return (
      <Notice
        heading="This review link has expired"
        body="Review links are valid for 90 days after your stay. Contact us if you would still like to leave a review."
      />
    );
  }

  return (
    <section className="bg-[#f5f5f5]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          How was your stay?
        </h1>
        <p className="mt-3 text-base leading-7 text-gray-600">
          Thanks for staying at Star Goshiwon. Only the overall score is
          required — everything else is optional.
        </p>
        <div className="mt-8">
          <ReviewForm
            token={invite.token}
            initialGuestName={invite.guest_name}
            roomType={invite.room_type}
          />
        </div>
      </div>
    </section>
  );
}
