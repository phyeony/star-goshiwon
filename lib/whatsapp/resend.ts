// 다시 보내기: the manager resends a reply that failed to send, from the
// admin chat page. Normal texts only reach the guest within 24 hours of
// their last message, so after that the button is gone.

import { canSendText } from "./quick-replies";
import { CLAIM_MS, type ConversationRow } from "./process";

export interface ResendDeps {
  getRun(id: string): Promise<{ conversation_id: string; outgoing: string | null; send_error: string | null } | null>;
  claimConversation(id: string, until: Date, now: Date): Promise<ConversationRow | null>;
  releaseConversation(id: string): Promise<void>;
  lastGuestMessageAt(conversationId: string): Promise<string | null>;
  /** The guest messages this run tried to answer are still unanswered. */
  stillPending(runId: string): Promise<boolean>;
  sendText(to: string, text: string): Promise<string>;
  insertOutbound(conversationId: string, waMessageId: string, body: string, at: Date): Promise<void>;
  /** Clears the run's send_error and marks the messages it answered as handled. */
  markResent(runId: string, at: Date): Promise<void>;
}

export type ResendResult =
  | { status: "sent" }
  | { status: "not_found" | "nothing_to_resend" | "busy" | "window_closed" }
  | { status: "send_failed"; detail: string };

export async function resendRun(deps: ResendDeps, runId: string, now = new Date()): Promise<ResendResult> {
  const run = await deps.getRun(runId);
  if (!run) return { status: "not_found" };
  if (!run.send_error || !run.outgoing) return { status: "nothing_to_resend" };

  // Hold the chat so the queue doesn't answer the same messages meanwhile.
  const conversation = await deps.claimConversation(run.conversation_id, new Date(now.getTime() + CLAIM_MS), now);
  if (!conversation) return { status: "busy" };
  try {
    // A later turn already answered them (or the manager did in the app).
    if (!(await deps.stillPending(runId))) return { status: "nothing_to_resend" };
    if (!canSendText(await deps.lastGuestMessageAt(run.conversation_id), now)) return { status: "window_closed" };
    let waId: string;
    try {
      waId = await deps.sendText(conversation.wa_phone, run.outgoing);
    } catch (e) {
      return { status: "send_failed", detail: e instanceof Error ? e.message : String(e) };
    }
    await deps.markResent(runId, now);
    await deps.insertOutbound(run.conversation_id, waId, run.outgoing, now);
    return { status: "sent" };
  } finally {
    await deps.releaseConversation(run.conversation_id);
  }
}
