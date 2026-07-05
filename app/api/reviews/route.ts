import { NextRequest, NextResponse } from "next/server";
import {
  createReview,
  getReviewInviteByToken,
  isReviewInviteOpen,
  markReviewInviteUsed,
} from "@/lib/review-queries";
import { validateReviewSubmission } from "@/lib/review-validation";
import { getPostHogClient } from "@/lib/posthog-server";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const token = typeof body.token === "string" ? body.token : "";
    if (!token) {
      return NextResponse.json({ error: "invalid_link" }, { status: 404 });
    }

    const invite = await getReviewInviteByToken(token);
    if (!invite) {
      return NextResponse.json({ error: "invalid_link" }, { status: 404 });
    }
    if (invite.used_at) {
      return NextResponse.json({ error: "already_used" }, { status: 409 });
    }
    if (!isReviewInviteOpen(invite)) {
      return NextResponse.json({ error: "expired" }, { status: 410 });
    }

    const result = validateReviewSubmission(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    let review;
    try {
      review = await createReview({
        invite_id: invite.id,
        ...result.value,
        room_type: invite.room_type,
      });
    } catch (error) {
      // 23505 = unique_violation on invite_id: a concurrent submit won.
      if ((error as { code?: string })?.code === "23505") {
        return NextResponse.json({ error: "already_used" }, { status: 409 });
      }
      throw error;
    }
    await markReviewInviteUsed(invite.id);

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: invite.guest_email ?? `review-invite:${invite.id}`,
      event: "review_submitted",
      properties: {
        review_id: review.id,
        invite_id: invite.id,
        score: review.score,
        room_type: review.room_type,
        has_comments: Boolean(review.positive || review.negative),
      },
    });
    await posthog.shutdown();

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Review submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
