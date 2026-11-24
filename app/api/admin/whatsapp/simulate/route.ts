import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { scheduleRun } from "@/lib/whatsapp/runtime";
import { isSimulatedPhone, simMessageId, simPhoneFor, simulatorEnabled } from "@/lib/whatsapp/simulator";
import { MANAGER_PAUSE_MS } from "@/lib/whatsapp/process";
import { conversationPhone, insertMessage, pauseForManager, upsertConversation } from "@/lib/whatsapp/store";

const bodySchema = z.object({
  text: z.string().trim().min(1).max(2000),
  // A new test chat is named; an existing one is continued by id.
  name: z.string().trim().max(40).optional(),
  conversationId: z.string().uuid().optional(),
  // "manager": what the manager would type in the WhatsApp Business app.
  as: z.enum(["guest", "manager"]).default("guest"),
});

// A message typed by the admin into a test chat (staging and `next dev`
// only), saved exactly as the webhook would save it. As the guest: queued
// for the agent; its reply is saved but never sent (lib/whatsapp/simulator.ts).
// As the manager: like a reply from the WhatsApp Business app, it pauses the
// AI for MANAGER_PAUSE_MS (일시정지 해제 on the chat page resumes it).
export async function POST(req: NextRequest) {
  if (!simulatorEnabled()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!(await getAdminUserOrNull())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const { text, name, conversationId: existingId, as } = parsed.data;
  if (as === "manager" && !existingId) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  let waPhone: string;
  let profileName = name || "Test guest";
  if (existingId) {
    const chat = await conversationPhone(existingId);
    // Only test chats: never write into a real guest's chat.
    if (!chat || !isSimulatedPhone(chat.waPhone)) {
      return NextResponse.json({ error: "not_a_test_chat" }, { status: 404 });
    }
    waPhone = chat.waPhone;
    profileName = chat.profileName || profileName;
  } else {
    waPhone = simPhoneFor(profileName);
  }

  const now = new Date();
  const conversationId = await upsertConversation(waPhone, profileName, now);
  const fromGuest = as === "guest";
  await insertMessage({
    conversationId,
    waMessageId: simMessageId(),
    direction: fromGuest ? "in" : "out",
    sender: fromGuest ? "guest" : "manager",
    messageType: "text",
    body: text,
    sentAt: now,
    handled: !fromGuest,
  });
  if (fromGuest) await scheduleRun(conversationId);
  else await pauseForManager(conversationId, new Date(now.getTime() + MANAGER_PAUSE_MS));
  return NextResponse.json({ conversationId });
}
