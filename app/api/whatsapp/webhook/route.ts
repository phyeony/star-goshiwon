import { NextRequest, NextResponse } from "next/server";
import { parseWebhook } from "@/lib/whatsapp/payload";
import { MANAGER_PAUSE_MS } from "@/lib/whatsapp/process";
import { scheduleRun } from "@/lib/whatsapp/runtime";
import { verifyMetaSignature } from "@/lib/whatsapp/signature";
import { insertMessage, isUnansweredGuestMessage, pauseForManager, upsertConversation } from "@/lib/whatsapp/store";

// Meta's webhook for the WhatsApp number (plan/whatsapp-agent.md §2.2).
// Saves each message and queues the agent; answers Meta within a second.

// Meta's one-time check when the webhook URL is registered.
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (token && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === token) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const ok = await verifyMetaSignature(
    raw,
    req.headers.get("x-hub-signature-256"),
    process.env.WHATSAPP_APP_SECRET ?? "",
  );
  if (!ok) return NextResponse.json({ error: "invalid_signature" }, { status: 401 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const ourNumber = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const toRun = new Set<string>();

  for (const event of parseWebhook(body)) {
    // The app may be subscribed to more than one number.
    if (ourNumber && event.phoneNumberId && event.phoneNumberId !== ourNumber) continue;

    const conversationId = await upsertConversation(
      event.waPhone,
      event.kind === "guest_message" ? event.profileName : "",
      event.sentAt,
    );
    const isNew = await insertMessage({
      conversationId,
      waMessageId: event.waMessageId,
      direction: event.kind === "guest_message" ? "in" : "out",
      sender: event.kind === "guest_message" ? "guest" : "manager",
      messageType: event.messageType,
      body: event.body,
      sentAt: event.sentAt,
      handled: event.kind === "manager_echo",
    });
    if (!isNew) {
      // Meta re-sent it: already saved. If it was never answered (the job
      // got lost), queue the chat again.
      if (event.kind === "guest_message" && (await isUnansweredGuestMessage(event.waMessageId))) {
        toRun.add(conversationId);
      }
      continue;
    }

    if (event.kind === "manager_echo") {
      await pauseForManager(conversationId, new Date(Date.now() + MANAGER_PAUSE_MS));
    } else {
      toRun.add(conversationId);
    }
  }

  for (const conversationId of toRun) await scheduleRun(conversationId);

  return NextResponse.json({ received: true });
}
