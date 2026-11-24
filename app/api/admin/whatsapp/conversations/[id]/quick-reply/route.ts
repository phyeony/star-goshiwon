import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPassportLink, logPassport } from "@/lib/passport/service";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { quickReplyTarget, recordQuickReply } from "@/lib/whatsapp/admin-queries";
import { sendText } from "@/lib/whatsapp/graph";
import { canSendText, quickReply } from "@/lib/whatsapp/quick-replies";
import { graphConfig } from "@/lib/whatsapp/runtime";
import { isSimulatedPhone, simMessageId } from "@/lib/whatsapp/simulator";

const bodySchema = z.object({ key: z.string().max(40) });

// Sends one of the canned messages in lib/whatsapp/quick-replies.ts. It
// doesn't pause the AI: the manager only sent a stock line. The
// verification reply makes a new upload link for the linked booking request
// (the old link stops working), like 인증 링크 만들기 on the request page.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  const reply = parsed.success ? quickReply(parsed.data.key) : undefined;
  if (!reply) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { id } = await ctx.params;
  const target = await quickReplyTarget(id);
  if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const now = new Date();
  if (!canSendText(target.lastGuestMessageAt, now)) {
    return NextResponse.json({ error: "window_closed" }, { status: 409 });
  }

  let text = reply.text;
  if (reply.sendsVerificationLink && reply.withLink) {
    if (!target.bookingRequestId) return NextResponse.json({ error: "no_booking" }, { status: 409 });
    text = reply.withLink(await createPassportLink(target.bookingRequestId, admin.email ?? "admin"));
  }

  let waMessageId: string;
  try {
    waMessageId = isSimulatedPhone(target.waPhone)
      ? simMessageId() // test chat: never sent
      : await sendText(graphConfig(), target.waPhone, text);
  } catch (e) {
    return NextResponse.json({ error: "send_failed", detail: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
  await recordQuickReply({
    conversationId: id,
    waMessageId,
    body: text,
    sentAt: now,
    asksMenOnly: Boolean(reply.asksMenOnly),
  });
  if (reply.sendsVerificationLink && target.bookingRequestId) {
    await logPassport(target.bookingRequestId, null, "link_sent", admin.email ?? "admin");
  }
  return NextResponse.json({ ok: true });
}
