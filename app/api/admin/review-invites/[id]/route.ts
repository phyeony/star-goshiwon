import { NextResponse } from "next/server";
import {
  deleteReviewInvite,
  getReviewInviteById,
} from "@/lib/review-queries";
import { getAdminUserOrNull } from "@/lib/supabase-server";

interface Context {
  params: Promise<{ id: string }>;
}

// Deletes an unused review link. A used one is the review's invite_id and
// stays, so the guest's link just stops working once deleted.
export async function DELETE(_req: Request, context: Context) {
  try {
    const adminUser = await getAdminUserOrNull();
    if (!adminUser) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const invite = await getReviewInviteById(id);
    if (!invite) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (invite.used_at) {
      return NextResponse.json(
        { error: "후기가 이미 제출된 링크는 삭제할 수 없습니다" },
        { status: 409 }
      );
    }

    try {
      await deleteReviewInvite(id);
    } catch (error) {
      // 23503 = foreign_key_violation: a review was submitted just now.
      if ((error as { code?: string })?.code === "23503") {
        return NextResponse.json(
          { error: "후기가 이미 제출된 링크는 삭제할 수 없습니다" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ status: "deleted" });
  } catch (error) {
    console.error("Delete review invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
