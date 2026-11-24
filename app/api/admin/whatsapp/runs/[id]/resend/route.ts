import { NextRequest, NextResponse } from "next/server";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { resendStore } from "@/lib/whatsapp/admin-queries";
import { sendText } from "@/lib/whatsapp/graph";
import { resendRun } from "@/lib/whatsapp/resend";
import { graphConfig } from "@/lib/whatsapp/runtime";
import { supabaseStore } from "@/lib/whatsapp/store";

const STATUS: Record<string, number> = {
  sent: 200,
  not_found: 404,
  nothing_to_resend: 409,
  busy: 409,
  window_closed: 409,
  send_failed: 502,
};

// 다시 보내기 on a reply that failed to send.
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUserOrNull())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const result = await resendRun(
    {
      ...resendStore,
      claimConversation: supabaseStore.claimConversation,
      releaseConversation: supabaseStore.releaseConversation,
      insertOutbound: supabaseStore.insertOutbound,
      sendText: (to, text) => sendText(graphConfig(), to, text),
    },
    id,
  );
  return NextResponse.json(result, { status: STATUS[result.status] ?? 500 });
}
