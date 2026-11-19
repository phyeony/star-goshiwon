import { NextRequest, NextResponse } from "next/server";
import { isInternalCall, runConversation } from "@/lib/whatsapp/runtime";

// Called by the queue consumer in worker.ts (through the worker's own
// service binding), never by the public. One agent turn per call.
export async function POST(req: NextRequest) {
  if (!isInternalCall(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { conversationId } = (await req.json().catch(() => ({}))) as { conversationId?: string };
  if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });

  const result = await runConversation(conversationId);
  return NextResponse.json(result);
}
