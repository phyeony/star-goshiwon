import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { createPassportLink, logPassport } from "@/lib/passport/service";
import { verificationMessage } from "@/lib/passport/messages";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { quickReplyTarget, recordQuickReply } from "@/lib/whatsapp/admin-queries";
import { sendText } from "@/lib/whatsapp/graph";
import { canSendText } from "@/lib/whatsapp/quick-replies";
import { graphConfig } from "@/lib/whatsapp/runtime";

const bodySchema = z.object({ send: z.enum(["none", "whatsapp"]).default("none") });

// Makes a new upload link for the guest (the old one stops working) and
// optionally sends it in the guest's WhatsApp chat. The WhatsApp text never
// mentions a passport: WhatsApp's policy bans asking for ID in the chat.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUserOrNull();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const { id } = await ctx.params;
  const actor = admin.email ?? "admin";

  const url = await createPassportLink(id, actor);
  if (parsed.data.send === "none") return NextResponse.json({ ok: true, url });

  const { data: conv } = await getSupabaseServiceClient()
    .from("whatsapp_conversations")
    .select("id")
    .eq("booking_request_id", id)
    .limit(1)
    .maybeSingle();
  if (!conv) return NextResponse.json({ ok: true, url, sent: false, error: "no_chat" });
  const target = await quickReplyTarget(conv.id as string);
  const now = new Date();
  if (!target || !canSendText(target.lastGuestMessageAt, now)) {
    return NextResponse.json({ ok: true, url, sent: false, error: "window_closed" });
  }
  const text = verificationMessage(url);
  try {
    const waMessageId = await sendText(graphConfig(), target.waPhone, text);
    await recordQuickReply({ conversationId: conv.id as string, waMessageId, body: text, sentAt: now, asksMenOnly: false });
    await logPassport(id, null, "link_sent", actor);
  } catch (e) {
    return NextResponse.json({ ok: true, url, sent: false, error: "send_failed", detail: e instanceof Error ? e.message : String(e) });
  }
  return NextResponse.json({ ok: true, url, sent: true });
}
