// Reads and writes for the /admin/whatsapp pages.

import { getSupabaseServiceClient } from "@/lib/supabase";
import { estimateCostUsd } from "@/lib/whatsapp-agent/model-prices";
import { CATEGORIES, type BotState, type Category, type MenOnlyState, type Mode, type Understanding } from "@/lib/whatsapp-agent/types";

export interface AdminConversation {
  id: string;
  wa_phone: string;
  profile_name: string;
  booking_request_id: string | null;
  men_only_state: MenOnlyState;
  bot_state: BotState;
  paused_until: string | null;
  last_message_at: string;
  created_at: string;
}

export interface AdminMessage {
  id: string;
  direction: "in" | "out";
  sender: "guest" | "bot" | "manager";
  message_type: string;
  body: string;
  handled_at: string | null;
  run_id: string | null;
  sent_at: string;
}

export interface AdminRun {
  id: string;
  conversation_id: string;
  outcome: string;
  reasons: string[];
  understanding: Understanding | null;
  draft: string;
  outgoing: string | null;
  guard_problems: string[];
  after_hours_notice: boolean;
  send_error: string | null;
  error: string | null;
  model: string;
  input_tokens: number;
  cached_input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  manager_rating: "good" | "bad" | null;
  manager_note: string | null;
  manager_better_reply: string | null;
  created_at: string;
}

export interface AdminSettings {
  mode: Mode;
  autoSend: Record<Category, boolean>;
  llmProvider: string;
  llmModel: string;
}

export type ChatStatus = "needs_reply" | "processing" | "answered" | "quiet";

export interface ConversationListItem extends AdminConversation {
  lastMessage: AdminMessage | null;
  latestRun: AdminRun | null;
  status: ChatStatus;
}

const db = () => getSupabaseServiceClient();

function must<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data;
}

const HANDOFF_OUTCOMES = new Set(["draft", "send_check_only"]);

/**
 * Where a chat stands for the manager:
 * - processing: guest messages the agent hasn't got to yet (within a minute)
 * - needs_reply: the agent handed the last turn to the manager and nobody
 *   (manager or agent) has written since
 * - answered: the agent answered the last turn
 */
export function chatStatus(messages: AdminMessage[], latestRun: AdminRun | null): ChatStatus {
  const last = messages[messages.length - 1];
  if (!last) return "quiet";
  if (last.sender === "guest" && !last.handled_at) return "processing";
  if (last.sender === "manager") return "answered";
  if (!latestRun) return last.sender === "guest" ? "needs_reply" : "answered";
  const managerAfterRun = messages.some(
    (m) => m.sender === "manager" && Date.parse(m.sent_at) >= Date.parse(latestRun.created_at),
  );
  if (managerAfterRun) return "answered";
  if (HANDOFF_OUTCOMES.has(latestRun.outcome) || latestRun.send_error || latestRun.error) return "needs_reply";
  return last.sender === "guest" ? "needs_reply" : "answered";
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const row = must(await db().from("whatsapp_settings").select("*").eq("id", 1).maybeSingle()) as Record<
    string,
    unknown
  > | null;
  const auto = (row?.auto_send ?? {}) as Record<string, unknown>;
  return {
    mode: ((row?.mode as Mode) ?? "off") as Mode,
    autoSend: Object.fromEntries(CATEGORIES.map((c) => [c, auto[c] === true])) as Record<Category, boolean>,
    llmProvider: (row?.llm_provider as string) ?? "openai",
    llmModel: (row?.llm_model as string) ?? "",
  };
}

export async function updateAdminSettings(patch: { mode?: Mode; autoSend?: Partial<Record<Category, boolean>> }) {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.mode) update.mode = patch.mode;
  if (patch.autoSend) {
    const current = await getAdminSettings();
    update.auto_send = { ...current.autoSend, ...patch.autoSend };
  }
  must(await db().from("whatsapp_settings").upsert({ id: 1, ...update }));
}

export async function listConversations(limit = 100): Promise<ConversationListItem[]> {
  const conversations = (must(
    await db()
      .from("whatsapp_conversations")
      .select("id, wa_phone, profile_name, booking_request_id, men_only_state, bot_state, paused_until, last_message_at, created_at")
      .order("last_message_at", { ascending: false })
      .limit(limit),
  ) ?? []) as AdminConversation[];
  if (!conversations.length) return [];
  const ids = conversations.map((c) => c.id);

  // Recent messages and runs for these chats; enough to work out each status.
  const [messages, runs] = await Promise.all([
    db()
      .from("whatsapp_messages")
      .select("id, conversation_id, direction, sender, message_type, body, handled_at, run_id, sent_at")
      .in("conversation_id", ids)
      .order("sent_at", { ascending: false })
      .limit(limit * 10),
    db()
      .from("whatsapp_agent_runs")
      .select("*")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false })
      .limit(limit * 5),
  ]);
  const msgRows = (must(messages) ?? []) as (AdminMessage & { conversation_id: string })[];
  const runRows = (must(runs) ?? []) as AdminRun[];

  return conversations.map((c) => {
    const own = msgRows.filter((m) => m.conversation_id === c.id).reverse();
    const latestRun = runRows.find((r) => r.conversation_id === c.id) ?? null;
    return {
      ...c,
      lastMessage: own[own.length - 1] ?? null,
      latestRun,
      status: chatStatus(own, latestRun),
    };
  });
}

export async function getConversationDetail(id: string): Promise<{
  conversation: AdminConversation;
  messages: AdminMessage[];
  runs: AdminRun[];
  booking: { id: string; guest_name: string; status: string; check_in_date: string; check_out_date: string } | null;
} | null> {
  const conversation = must(
    await db()
      .from("whatsapp_conversations")
      .select("id, wa_phone, profile_name, booking_request_id, men_only_state, bot_state, paused_until, last_message_at, created_at")
      .eq("id", id)
      .maybeSingle(),
  ) as AdminConversation | null;
  if (!conversation) return null;

  const [messages, runs, booking] = await Promise.all([
    db()
      .from("whatsapp_messages")
      .select("id, direction, sender, message_type, body, handled_at, run_id, sent_at")
      .eq("conversation_id", id)
      .order("sent_at", { ascending: true })
      .limit(500),
    db().from("whatsapp_agent_runs").select("*").eq("conversation_id", id).order("created_at", { ascending: true }).limit(200),
    conversation.booking_request_id
      ? db()
          .from("booking_requests")
          .select("id, guest_name, status, check_in_date, check_out_date")
          .eq("id", conversation.booking_request_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  return {
    conversation,
    messages: (must(messages) ?? []) as AdminMessage[],
    runs: (must(runs) ?? []) as AdminRun[],
    booking: must(booking) as {
      id: string;
      guest_name: string;
      status: string;
      check_in_date: string;
      check_out_date: string;
    } | null,
  };
}

/** Turns the agent on or off for one chat. "active" also ends a manager pause. */
export async function setBotState(id: string, state: "active" | "off") {
  must(
    await db()
      .from("whatsapp_conversations")
      .update({ bot_state: state, paused_until: null })
      .eq("id", id)
      .select("id")
      .single(),
  );
}

export async function rateRun(id: string, rating: "good" | "bad" | null) {
  must(await db().from("whatsapp_agent_runs").update({ manager_rating: rating }).eq("id", id).select("id").single());
}

/** Saves the manager's note on a turn; empty text clears it. */
export async function noteRun(id: string, note: string, betterReply: string) {
  const n = note.trim();
  const b = betterReply.trim();
  must(
    await db()
      .from("whatsapp_agent_runs")
      .update({
        manager_note: n || null,
        manager_better_reply: b || null,
        manager_noted_at: n || b ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .select("id")
      .single(),
  );
}

/**
 * Model or sending failures in the last hour. Two or more means the agent is
 * probably down (key, budget or Meta token), so the admin page shows a banner.
 */
export async function recentFailures(now = new Date()): Promise<{ count: number; latest: string | null }> {
  const since = new Date(now.getTime() - 60 * 60_000).toISOString();
  const rows = (must(
    await db()
      .from("whatsapp_agent_runs")
      .select("error, send_error, created_at")
      .gte("created_at", since)
      .or("error.not.is.null,send_error.not.is.null")
      .order("created_at", { ascending: false })
      .limit(20),
  ) ?? []) as { error: string | null; send_error: string | null }[];
  return { count: rows.length, latest: rows[0] ? (rows[0].error ?? rows[0].send_error) : null };
}

export interface UsageSummary {
  since: string;
  turns: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  costUsd: number;
  unpricedModels: string[];
}

type UsageRow = { model: string; input_tokens: number; cached_input_tokens: number; output_tokens: number };

/** Start of the current month in Korea time. */
export function seoulMonthStart(now = new Date()): Date {
  const kst = new Date(now.getTime() + 9 * 3600_000);
  return new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), 1) - 9 * 3600_000);
}

/** Adds up the stored token counts; no model call. */
export function summarizeUsage(rows: UsageRow[], since: Date): UsageSummary {
  const sum: UsageSummary = {
    since: since.toISOString(),
    turns: 0,
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    unpricedModels: [],
  };
  for (const r of rows) {
    // Runs that never called the model (bot off, paused) have no tokens.
    if (!r.input_tokens && !r.output_tokens) continue;
    sum.turns += 1;
    sum.inputTokens += r.input_tokens;
    sum.cachedInputTokens += r.cached_input_tokens;
    sum.outputTokens += r.output_tokens;
    const cost = estimateCostUsd(r.model, {
      input: r.input_tokens,
      cachedInput: r.cached_input_tokens,
      output: r.output_tokens,
    });
    if (cost === null) {
      if (!sum.unpricedModels.includes(r.model)) sum.unpricedModels.push(r.model);
    } else sum.costUsd += cost;
  }
  return sum;
}

/** This month's (Korea time) AI turns, tokens and estimated cost. */
export async function monthUsage(now = new Date()): Promise<UsageSummary> {
  const since = seoulMonthStart(now);
  const rows = (must(
    await db()
      .from("whatsapp_agent_runs")
      .select("model, input_tokens, cached_input_tokens, output_tokens")
      .gte("created_at", since.toISOString())
      .limit(20000),
  ) ?? []) as UsageRow[];
  return summarizeUsage(rows, since);
}

/** ✓ / ✗ counts per category, for deciding which switches to turn on. */
export async function ratingStats(): Promise<Record<string, { good: number; bad: number }>> {
  const rows = (must(
    await db()
      .from("whatsapp_agent_runs")
      .select("understanding, manager_rating")
      .not("manager_rating", "is", null)
      .order("created_at", { ascending: false })
      .limit(2000),
  ) ?? []) as { understanding: Understanding | null; manager_rating: "good" | "bad" }[];
  const stats: Record<string, { good: number; bad: number }> = {};
  for (const r of rows) {
    for (const c of r.understanding?.categories ?? []) {
      stats[c] ??= { good: 0, bad: 0 };
      stats[c][r.manager_rating] += 1;
    }
  }
  return stats;
}
