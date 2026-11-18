import { NextRequest, NextResponse } from "next/server";
import { isInternalCall } from "@/lib/whatsapp/runtime";
import { deleteIdleConversations } from "@/lib/whatsapp/store";

// Daily cleanup, called by the cron trigger in worker.ts: chats with no
// message for 12 months are deleted with their messages (spec §2.7).
export async function POST(req: NextRequest) {
  if (!isInternalCall(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const deleted = await deleteIdleConversations(new Date());
  return NextResponse.json({ deleted });
}
