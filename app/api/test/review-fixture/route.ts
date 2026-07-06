import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  createReviewInvite,
  generateReviewToken,
  updateReviewStatus,
} from "@/lib/review-queries";
import type { Review, ReviewStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

// Stands in for admin actions in Playwright runs (the admin UI needs a real
// Supabase login), mirroring the payment-fixture pattern.
export async function POST(req: NextRequest) {
  if (process.env.E2E_TEST_MODE !== "true") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      guestName?: string;
      roomType?: string;
      expired?: boolean;
      inviteId?: string;
      status?: ReviewStatus;
    };

    if (body.action === "create-invite") {
      const invite = await createReviewInvite({
        token: generateReviewToken(),
        guest_name: body.guestName ?? "Playwright Reviewer",
        guest_email: `playwright-review-${Date.now()}@example.com`,
        room_type: body.roomType ?? "Private Shower Room",
      });
      if (body.expired) {
        const supabase = getSupabaseServiceClient();
        const { error } = await supabase
          .from("review_invites")
          .update({ expires_at: new Date(Date.now() - 60_000).toISOString() })
          .eq("id", invite.id);
        if (error) throw error;
      }
      return NextResponse.json({
        id: invite.id,
        token: invite.token,
        url: `/review/${invite.token}`,
      });
    }

    if (body.action === "set-status" && body.inviteId && body.status) {
      const supabase = getSupabaseServiceClient();
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("invite_id", body.inviteId)
        .single();
      if (error) throw error;
      const review = await updateReviewStatus((data as Review).id, body.status);
      return NextResponse.json(review);
    }

    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (error) {
    console.error("Review fixture error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "fixture_failed" },
      { status: 500 }
    );
  }
}
