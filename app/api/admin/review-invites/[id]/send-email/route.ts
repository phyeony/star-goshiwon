import { NextRequest, NextResponse } from "next/server";
import {
  getReviewInviteById,
  isReviewInviteOpen,
  reviewInviteUrl,
} from "@/lib/review-queries";
import { sendReviewRequestEmail } from "@/lib/email";
import { getAdminUserOrNull } from "@/lib/supabase-server";

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: Context) {
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
    if (!invite.guest_email) {
      return NextResponse.json(
        { error: "이 초대에는 이메일 주소가 없습니다" },
        { status: 400 }
      );
    }
    if (!isReviewInviteOpen(invite)) {
      return NextResponse.json(
        { error: "이미 사용되었거나 만료된 링크입니다" },
        { status: 400 }
      );
    }

    await sendReviewRequestEmail({
      guest_name: invite.guest_name || "Guest",
      guest_email: invite.guest_email,
      review_url: reviewInviteUrl(invite.token),
    });

    return NextResponse.json({ status: "sent" });
  } catch (error) {
    console.error("Send review invite email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
