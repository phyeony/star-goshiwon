import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { quickReplyTarget, recordQuickReply } from "@/lib/whatsapp/admin-queries";
import { sendText } from "@/lib/whatsapp/graph";
import { canSendText, quickReply } from "@/lib/whatsapp/quick-replies";
import { graphConfig } from "@/lib/whatsapp/runtime";
import { isSimulatedPhone, simMessageId } from "@/lib/whatsapp/simulator";

const bodySchema = z.object({ key: z.string().max(40) });

// Sends one of the canned messages in lib/whatsapp/quick-replies.ts. It
// doesn't pause the AI: the manager only sent a stock line.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUserOrNull())) {
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

  let waMessageId: string;
  try {
    waMessageId = isSimulatedPhone(target.waPhone)
      ? simMessageId() // test chat: never sent
      : await sendText(graphConfig(), target.waPhone, reply.text);
  } catch (e) {
    return NextResponse.json({ error: "send_failed", detail: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
  await recordQuickReply({
    conversationId: id,
    waMessageId,
    body: reply.text,
    sentAt: now,
    asksMenOnly: Boolean(reply.asksMenOnly),
  });
  return NextResponse.json({ ok: true });
}
