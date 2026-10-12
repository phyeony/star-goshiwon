import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  createReviewInvite,
  generateReviewToken,
  updateReviewStatus,
} from "@/lib/review-queries";
import type { Review, ReviewStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

// Every invite this fixture creates uses this email shape; cleanup refuses to
// touch anything else, so it can never reach a real guest's invite or review.
const FIXTURE_EMAIL_PREFIX = "playwright-review-";
const FIXTURE_EMAIL_DOMAIN = "@example.com";

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
      inviteIds?: string[];
      dryRun?: boolean;
    };

    if (body.action === "create-invite") {
      const invite = await createReviewInvite({
        token: generateReviewToken(),
        guest_name: body.guestName ?? "Playwright Reviewer",
        guest_email: `${FIXTURE_EMAIL_PREFIX}${Date.now()}${FIXTURE_EMAIL_DOMAIN}`,
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

    // Deletes fixture invites and their reviews (reviews first: no cascade).
    // With inviteIds, only those; without, every fixture invite — the sweep
    // for runs that died before their afterEach.
    if (body.action === "cleanup") {
      const supabase = getSupabaseServiceClient();
      let query = supabase
        .from("review_invites")
        .select("id, guest_name, created_at, reviews(id, status, score)")
        .like("guest_email", `${FIXTURE_EMAIL_PREFIX}%${FIXTURE_EMAIL_DOMAIN}`);
      if (body.inviteIds) query = query.in("id", body.inviteIds);
      const { data: invites, error } = await query;
      if (error) throw error;

      const inviteIds = (invites ?? []).map((invite) => invite.id);
      if (body.dryRun || inviteIds.length === 0) {
        return NextResponse.json({ dryRun: !!body.dryRun, invites });
      }

      const { count: reviewsDeleted, error: reviewsError } = await supabase
        .from("reviews")
        .delete({ count: "exact" })
        .in("invite_id", inviteIds);
      if (reviewsError) throw reviewsError;
      const { count: invitesDeleted, error: invitesError } = await supabase
        .from("review_invites")
        .delete({ count: "exact" })
        .in("id", inviteIds);
      if (invitesError) throw invitesError;

      return NextResponse.json({ reviewsDeleted, invitesDeleted });
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
