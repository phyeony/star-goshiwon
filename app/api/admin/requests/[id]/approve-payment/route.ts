import { NextRequest, NextResponse } from "next/server";
import { approveAndSendPaymentLink } from "@/lib/payments";
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
    const body = await req.json().catch(() => ({}));
    const result = await approveAndSendPaymentLink(id, {
      regenerate: body.regenerate === true,
    });

    return NextResponse.json({
      status: "success",
      approval_url: result.approvalUrl,
      reused: result.reused,
    });
  } catch (error) {
    console.error("Approve payment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
