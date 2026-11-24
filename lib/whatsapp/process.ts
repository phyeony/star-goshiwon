// One agent turn for one conversation, run from the queue.
//
//   claim the conversation → wait out bursts → work out its state →
//   runAgentTurn (agent.ts) → send / mark read → save the run → release
//
// Everything that touches the database, Meta or the model comes in through
// `deps`, so the whole flow is unit tested with fakes (process.test.ts).

import { runAgentTurn, type AgentTurnResult } from "@/lib/whatsapp-agent/agent";
import { AFTER_HOURS_NOTICE } from "@/lib/whatsapp-agent/facts";
import type { LlmClient } from "@/lib/whatsapp-agent/llm";
import type { AvailabilityCount, QuoteRoom } from "@/lib/whatsapp-agent/tools";
import type {
  AgentSettings,
  BotState,
  ConversationState,
  GuestMessage,
  LinkedBooking,
  MenOnlyState,
} from "@/lib/whatsapp-agent/types";

// Guests often send several short messages in a row. The webhook queues a
// job ~15 s after each message; a job only runs once the newest message is
// at least this old, so the last job answers all of them together.
export const BURST_WAIT_MS = 10_000;
// How long one run may hold the conversation (model calls included).
export const CLAIM_MS = 3 * 60_000;
// A manager reply from the app pauses the agent this long.
export const MANAGER_PAUSE_MS = 12 * 60 * 60_000;
// Free-form replies are only allowed within 24 h of the guest's last message.
const SERVICE_WINDOW_MS = 23 * 60 * 60_000;
// At most one after-hours line per conversation per night.
const AFTER_HOURS_REPEAT_MS = 12 * 60 * 60_000;
const HISTORY_LIMIT = 20;

export interface ConversationRow {
  id: string;
  wa_phone: string;
  booking_request_id: string | null;
  men_only_state: MenOnlyState;
  bot_state: BotState;
  paused_until: string | null;
  after_hours_notice_at: string | null;
}

export interface MessageRow {
  id: string;
  wa_message_id: string | null;
  sender: "guest" | "bot" | "manager";
  body: string;
  message_type: string;
  handled_at: string | null;
  created_at: string;
}

export interface Settings extends AgentSettings {
  llmProvider: string;
  llmModel: string;
  llmEffort: "none" | "minimal" | "low" | "medium" | "high" | null;
}

export interface AgentContext {
  knowledgePack: string;
  rooms: QuoteRoom[];
  siteUrl: string;
  forbidden: string[];
  getAvailability: (checkIn: string, checkOut: string) => Promise<AvailabilityCount[]>;
}

export interface RunRecord {
  conversationId: string;
  result: AgentTurnResult | null;
  outgoing: string | null;
  afterHoursNotice: boolean;
  sendError: string | null;
  model: string;
}

export interface WhatsAppStore {
  getSettings(): Promise<Settings>;
  /** Atomically takes the conversation; null if another run holds it. */
  claimConversation(id: string, until: Date, now: Date): Promise<ConversationRow | null>;
  releaseConversation(id: string): Promise<void>;
  /** Newest last; guest, bot and manager messages. */
  getRecentMessages(conversationId: string, limit: number): Promise<MessageRow[]>;
  /** Guest messages with handled_at null, oldest first. */
  getPendingGuestMessages(conversationId: string): Promise<MessageRow[]>;
  /** The linked booking, linking it by phone first if needed. */
  getLinkedBooking(conversation: ConversationRow): Promise<LinkedBooking | null>;
  updateConversation(
    id: string,
    patch: Partial<Pick<ConversationRow, "men_only_state" | "bot_state" | "paused_until" | "after_hours_notice_at">>,
  ): Promise<void>;
  saveRun(run: RunRecord): Promise<string>;
  markHandled(messageIds: string[], runId: string | null, at: Date): Promise<void>;
  /** Points still-pending messages at the run that tried to answer them. */
  linkRun(messageIds: string[], runId: string): Promise<void>;
  insertOutbound(conversationId: string, waMessageId: string, body: string, at: Date): Promise<void>;
}

export interface Sender {
  sendText(to: string, text: string): Promise<string>;
  markRead(waMessageId: string): Promise<void>;
}

export interface ProcessDeps {
  store: WhatsAppStore;
  sender: Sender;
  makeLlm(settings: Settings): LlmClient;
  loadContext(): Promise<AgentContext>;
  now?: () => Date;
}

export type ProcessResult =
  | { status: "busy" | "nothing_pending" | "waiting_for_more" | "mode_off" | "bot_off" }
  | { status: "done"; runId: string; outcome: string; sent: boolean };

/** Hour of the day in Korea (UTC+9, no daylight saving). */
export function seoulHour(at: Date): number {
  return (at.getUTCHours() + 9) % 24;
}

/** Outside 9 AM – 11 PM Korea time. */
export function isAfterHours(at: Date): boolean {
  const h = seoulHour(at);
  return h < 9 || h >= 23;
}

export function seoulDate(at: Date): string {
  return new Date(at.getTime() + 9 * 60 * 60_000).toISOString().slice(0, 10);
}

export function effectiveBotState(c: ConversationRow, now: Date): BotState {
  if (c.bot_state === "paused_by_manager" && c.paused_until && Date.parse(c.paused_until) <= now.getTime()) {
    return "active";
  }
  return c.bot_state;
}

function toGuestMessages(recent: MessageRow[], pendingIds: Set<string>): GuestMessage[] {
  return recent.map((m) => ({
    from: m.sender,
    text: m.body || (m.message_type === "text" ? "" : `[${m.message_type}]`),
    pending: pendingIds.has(m.id),
  }));
}

export async function processConversation(deps: ProcessDeps, conversationId: string): Promise<ProcessResult> {
  const now = deps.now?.() ?? new Date();
  const { store } = deps;

  const settings = await store.getSettings();
  const conversation = await store.claimConversation(conversationId, new Date(now.getTime() + CLAIM_MS), now);
  if (!conversation) return { status: "busy" };

  try {
    const pending = await store.getPendingGuestMessages(conversationId);
    if (pending.length === 0) return { status: "nothing_pending" };

    const newest = pending[pending.length - 1];
    if (now.getTime() - Date.parse(newest.created_at) < BURST_WAIT_MS) return { status: "waiting_for_more" };

    const pendingIds = pending.map((m) => m.id);

    // Off: the manager handles everything in the app. The messages are
    // marked handled so turning the agent on later doesn't answer old ones.
    if (settings.mode === "off") {
      await store.markHandled(pendingIds, null, now);
      return { status: "mode_off" };
    }

    const botState = effectiveBotState(conversation, now);
    if (botState !== conversation.bot_state) {
      await store.updateConversation(conversationId, { bot_state: botState, paused_until: null });
    }
    if (botState === "off") {
      await store.markHandled(pendingIds, null, now);
      return { status: "bot_off" };
    }

    const recent = await store.getRecentMessages(conversationId, HISTORY_LIMIT);
    const pendingSet = new Set(pendingIds);
    const isFirstContact = !recent.some((m) => !pendingSet.has(m.id));
    const linkedBooking = await store.getLinkedBooking(conversation);
    const state: ConversationState = {
      menOnlyState: conversation.men_only_state,
      botState,
      isFirstContact,
      linkedBooking,
    };

    // Past the 24 h window Meta refuses free-form messages, so it can only
    // be a handoff (only happens if the queue was stuck for a day).
    const inWindow = now.getTime() - Date.parse(newest.created_at) < SERVICE_WINDOW_MS;
    const agentSettings: AgentSettings = {
      mode: inWindow ? settings.mode : "shadow",
      autoSend: settings.autoSend,
    };

    const ctx = await deps.loadContext();
    const llm = deps.makeLlm(settings);
    const result = await runAgentTurn({
      llm,
      knowledgePack: ctx.knowledgePack,
      settings: agentSettings,
      state,
      messages: toGuestMessages(recent, pendingSet),
      rooms: ctx.rooms,
      siteUrl: ctx.siteUrl,
      today: seoulDate(now),
      forbidden: ctx.forbidden,
      getAvailability: ctx.getAvailability,
    });

    let outgoing = result.outgoing;
    let afterHoursNotice = false;
    if (
      !outgoing &&
      result.decision.outcome === "draft" &&
      agentSettings.mode === "live" &&
      botState === "active" &&
      result.decision.newMenOnlyState !== "not_eligible" &&
      isAfterHours(now) &&
      (!conversation.after_hours_notice_at ||
        now.getTime() - Date.parse(conversation.after_hours_notice_at) > AFTER_HOURS_REPEAT_MS)
    ) {
      outgoing = AFTER_HOURS_NOTICE;
      afterHoursNotice = true;
    }

    let sent = false;
    let sendError: string | null = null;
    let waId: string | null = null;
    if (outgoing) {
      try {
        waId = await deps.sender.sendText(conversation.wa_phone, outgoing);
        sent = true;
      } catch (e) {
        sendError = e instanceof Error ? e.message : String(e);
      }
    }

    // Once a reply is out, the guest's messages count as answered straight
    // away: if saving anything below fails, the queue's retry then finds
    // nothing pending instead of sending the same reply twice.
    if (sent) await store.markHandled(pendingIds, null, now);
    if (sent && waId) await store.insertOutbound(conversationId, waId, outgoing!, now);

    // Read receipts only after a successful send of a real answer.
    if (sent && result.decision.markRead) {
      const lastWaId = [...pending].reverse().find((m) => m.wa_message_id)?.wa_message_id;
      if (lastWaId) {
        try {
          await deps.sender.markRead(lastWaId);
        } catch {
          // The answer went out; grey ticks are harmless.
        }
      }
    }

    // The men-only state moves to "asked" only when the check really went
    // out; a confirmation or a decline from the guest counts either way.
    const next = result.decision.newMenOnlyState;
    const men_only_state =
      next === "confirmed" || next === "not_eligible" || (sent && !afterHoursNotice) ? next : conversation.men_only_state;
    const patch: Parameters<WhatsAppStore["updateConversation"]>[1] = {};
    if (men_only_state !== conversation.men_only_state) patch.men_only_state = men_only_state;
    if (afterHoursNotice && sent) patch.after_hours_notice_at = now.toISOString();
    if (Object.keys(patch).length) await store.updateConversation(conversationId, patch);

    // A failed send keeps the text (outgoing + send_error) so the manager
    // can resend it from the admin page.
    const runId = await store.saveRun({
      conversationId,
      result,
      outgoing: outgoing ?? null,
      afterHoursNotice,
      sendError,
      model: llm.label,
    });
    if (sendError) {
      // Not answered: the guest's messages stay pending, so the next turn
      // (their next message, or the manager's 다시 보내기) covers them all,
      // and the admin page flags the chat as 처리 실패.
      await store.linkRun(pendingIds, runId);
    } else {
      await store.markHandled(pendingIds, runId, now);
    }
    return { status: "done", runId, outcome: result.decision.outcome, sent };
  } finally {
    await store.releaseConversation(conversationId);
  }
}
