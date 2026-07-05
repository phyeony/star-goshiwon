import { NextRequest, NextResponse } from "next/server";
import { updateReviewStatus } from "@/lib/review-queries";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { getPostHogClient } from "@/lib/posthog-server";
import type { ReviewStatus } from "@/lib/types";

const validStatuses: ReviewStatus[] = ["pending", "approved", "rejected"];

interface Context {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, context: Context) {
  try {
    const adminUser = await getAdminUserOrNull();
    if (!adminUser) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await req.json().catch(() => ({}))) as { status?: string };
    if (!validStatuses.includes(body.status as ReviewStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const review = await updateReviewStatus(id, body.status as ReviewStatus);

    if (review.status === "approved") {
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: adminUser.email ?? "admin",
        event: "review_approved",
        properties: {
          review_id: review.id,
          score: review.score,
          room_type: review.room_type,
        },
      });
      await posthog.shutdown();
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("Update review status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
