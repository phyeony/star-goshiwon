import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/supabase-server";
import { scheduleRun } from "@/lib/whatsapp/runtime";
import { isSimulatedPhone, simMessageId, simPhoneFor, simulatorEnabled } from "@/lib/whatsapp/simulator";
import { conversationPhone, insertMessage, upsertConversation } from "@/lib/whatsapp/store";

const bodySchema = z.object({
  text: z.string().trim().min(1).max(2000),
  // A new test chat is named; an existing one is continued by id.
  name: z.string().trim().max(40).optional(),
  conversationId: z.string().uuid().optional(),
});

// A guest message typed by the admin into a test chat (staging and
// `next dev` only). It is saved and queued exactly like a webhook message;
// the agent's reply is saved but never sent (lib/whatsapp/simulator.ts).
export async function POST(req: NextRequest) {
  if (!simulatorEnabled()) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!(await getAdminUserOrNull())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const { text, name, conversationId: existingId } = parsed.data;

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
  await insertMessage({
    conversationId,
    waMessageId: simMessageId(),
    direction: "in",
    sender: "guest",
    messageType: "text",
    body: text,
    sentAt: now,
    handled: false,
  });
  await scheduleRun(conversationId);
  return NextResponse.json({ conversationId });
}
