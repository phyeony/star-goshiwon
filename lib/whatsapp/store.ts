// Supabase side of the WhatsApp agent: the tables in
// supabase/migrations/2026-11-19-whatsapp.sql, through the service client.

import { buildKnowledgePack } from "@/lib/whatsapp-agent/knowledge";
import { guides } from "@/lib/guides";
import { getEconomyTier, getPublicRooms, getRoomUnitAvailability, getRoomUnits, isRoomUnitAvailableForBooking } from "@/lib/queries";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { policiesText } from "@/lib/whatsapp-agent/policies-plain";
import { CATEGORIES, type Category, type LinkedBooking, type Mode } from "@/lib/whatsapp-agent/types";
import type { AgentContext, ConversationRow, MessageRow, RunRecord, Settings, WhatsAppStore } from "./process";

const CONVERSATION_COLUMNS =
  "id, wa_phone, booking_request_id, men_only_state, bot_state, paused_until, after_hours_notice_at";
const MESSAGE_COLUMNS = "id, wa_message_id, sender, body, message_type, handled_at, created_at";
// A booking in one of these states no longer says anything about the guest.
const DEAD_BOOKING_STATUSES = ["declined", "expired", "closed"];

const db = () => getSupabaseServiceClient();

function must<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data;
}

// ─── Webhook side ───

/** Finds or creates the conversation for a phone number; returns its id. */
export async function upsertConversation(waPhone: string, profileName: string, at: Date): Promise<string> {
  const patch: Record<string, unknown> = { wa_phone: waPhone, last_message_at: at.toISOString() };
  if (profileName) patch.profile_name = profileName;
  const row = must(
    await db().from("whatsapp_conversations").upsert(patch, { onConflict: "wa_phone" }).select("id").single(),
  ) as { id: string };
  return row.id;
}

/** Inserts a message; false if Meta already delivered it (same id). */
export async function insertMessage(msg: {
  conversationId: string;
  waMessageId: string;
  direction: "in" | "out";
  sender: "guest" | "bot" | "manager";
  messageType: string;
  body: string;
  sentAt: Date;
  handled?: boolean;
}): Promise<boolean> {
  const res = await db()
    .from("whatsapp_messages")
    .upsert(
      {
        conversation_id: msg.conversationId,
        wa_message_id: msg.waMessageId,
        direction: msg.direction,
        sender: msg.sender,
        message_type: msg.messageType,
        body: msg.body,
        sent_at: msg.sentAt.toISOString(),
        handled_at: msg.handled ? new Date().toISOString() : null,
      },
      { onConflict: "wa_message_id", ignoreDuplicates: true },
    )
    .select("id");
  return (must(res) ?? []).length > 0;
}

/**
 * The manager wrote from the WhatsApp app: the agent stays quiet in this
 * chat until `until`, and the guest messages the manager has seen count as
 * handled. A chat the manager switched off stays off.
 */
export async function pauseForManager(conversationId: string, until: Date): Promise<void> {
  must(
    await db()
      .from("whatsapp_conversations")
      .update({ bot_state: "paused_by_manager", paused_until: until.toISOString() })
      .eq("id", conversationId)
      .neq("bot_state", "off"),
  );
  must(
    await db()
      .from("whatsapp_messages")
      .update({ handled_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("sender", "guest")
      .is("handled_at", null),
  );
}

/**
 * After the booking-received template went out: the chat for that number is
 * linked to the booking, the men-only question counts as asked (unless the
 * guest already answered it), and the message is stored as the agent's.
 */
export async function recordBookingReceived(args: {
  waPhone: string;
  bookingId: string;
  waMessageId: string;
  body: string;
  sentAt: Date;
}): Promise<void> {
  const conversationId = await upsertConversation(args.waPhone, "", args.sentAt);
  must(
    await db()
      .from("whatsapp_conversations")
      .update({ booking_request_id: args.bookingId, match_source: "phone" })
      .eq("id", conversationId),
  );
  must(
    await db()
      .from("whatsapp_conversations")
      .update({ men_only_state: "asked" })
      .eq("id", conversationId)
      .eq("men_only_state", "unasked"),
  );
  await insertMessage({
    conversationId,
    waMessageId: args.waMessageId,
    direction: "out",
    sender: "bot",
    messageType: "template",
    body: args.body,
    sentAt: args.sentAt,
    handled: true,
  });
}

// ─── Queue side ───

function toSettings(row: Record<string, unknown> | null): Settings {
  const autoSend = (row?.auto_send ?? {}) as Record<string, unknown>;
  return {
    mode: ((row?.mode as Mode) ?? "off") satisfies Mode,
    autoSend: Object.fromEntries(CATEGORIES.map((c) => [c, autoSend[c] === true])) as Record<Category, boolean>,
    llmProvider: (row?.llm_provider as string) ?? "openai",
    llmModel: (row?.llm_model as string) ?? "gpt-6-luna",
    llmEffort: (row?.llm_effort as Settings["llmEffort"]) ?? null,
  };
}

export const supabaseStore: WhatsAppStore = {
  async getSettings() {
    const row = must(await db().from("whatsapp_settings").select("*").eq("id", 1).maybeSingle());
    return toSettings(row as Record<string, unknown> | null);
  },

  async claimConversation(id, until, now) {
    // One UPDATE: it only matches when nobody else holds the conversation.
    const row = must(
      await db()
        .from("whatsapp_conversations")
        .update({ processing_until: until.toISOString() })
        .eq("id", id)
        .or(`processing_until.is.null,processing_until.lt."${now.toISOString()}"`)
        .select(CONVERSATION_COLUMNS)
        .maybeSingle(),
    );
    return (row as ConversationRow | null) ?? null;
  },

  async releaseConversation(id) {
    must(await db().from("whatsapp_conversations").update({ processing_until: null }).eq("id", id));
  },

  async getRecentMessages(conversationId, limit) {
    const rows = must(
      await db()
        .from("whatsapp_messages")
        .select(MESSAGE_COLUMNS)
        .eq("conversation_id", conversationId)
        .order("sent_at", { ascending: false })
        .limit(limit),
    );
    return ((rows ?? []) as MessageRow[]).reverse();
  },

  async getPendingGuestMessages(conversationId) {
    const rows = must(
      await db()
        .from("whatsapp_messages")
        .select(MESSAGE_COLUMNS)
        .eq("conversation_id", conversationId)
        .eq("sender", "guest")
        .is("handled_at", null)
        .order("sent_at", { ascending: true }),
    );
    return (rows ?? []) as MessageRow[];
  },

  async getLinkedBooking(conversation) {
    type Row = {
      id: string;
      status: LinkedBooking["status"];
      check_in_date: string;
      check_out_date: string;
      rooms: { name: string } | null;
    };
    const select = "id, status, check_in_date, check_out_date, rooms(name)";
    let row: Row | null = null;

    if (conversation.booking_request_id) {
      row = must(
        await db().from("booking_requests").select(select).eq("id", conversation.booking_request_id).maybeSingle(),
      ) as Row | null;
    } else {
      // Linked in code by the WhatsApp number on the booking form (§1.5).
      const rows = must(
        await db()
          .from("booking_requests")
          .select(select)
          .eq("whatsapp_number", `+${conversation.wa_phone}`)
          .not("status", "in", `(${DEAD_BOOKING_STATUSES.join(",")})`)
          .order("created_at", { ascending: false })
          .limit(1),
      ) as Row[] | null;
      row = rows?.[0] ?? null;
      if (row) {
        must(
          await db()
            .from("whatsapp_conversations")
            .update({ booking_request_id: row.id, match_source: "phone" })
            .eq("id", conversation.id),
        );
      }
    }
    if (!row) return null;
    return {
      status: row.status,
      check_in_date: row.check_in_date,
      check_out_date: row.check_out_date,
      room_name: row.rooms?.name ?? null,
    };
  },

  async updateConversation(id, patch) {
    must(await db().from("whatsapp_conversations").update(patch).eq("id", id));
  },

  async saveRun(run: RunRecord) {
    const r = run.result;
    const row = must(
      await db()
        .from("whatsapp_agent_runs")
        .insert({
          conversation_id: run.conversationId,
          outcome: r?.decision.outcome ?? "draft",
          reasons: r?.decision.reasons ?? [],
          understanding: r?.understanding ?? null,
          draft: r?.draft ?? "",
          outgoing: run.outgoing,
          guard_problems: r?.guardProblems ?? [],
          after_hours_notice: run.afterHoursNotice,
          send_error: run.sendError,
          error: r?.error ?? null,
          model: run.model,
          input_tokens: r?.usage.inputTokens ?? 0,
          cached_input_tokens: r?.usage.cachedInputTokens ?? 0,
          output_tokens: r?.usage.outputTokens ?? 0,
          latency_ms: r?.latencyMs ?? 0,
        })
        .select("id")
        .single(),
    ) as { id: string };
    return row.id;
  },

  async markHandled(messageIds, runId, at) {
    if (!messageIds.length) return;
    must(
      await db()
        .from("whatsapp_messages")
        .update({ handled_at: at.toISOString(), run_id: runId })
        .in("id", messageIds),
    );
  },

  async insertOutbound(conversationId, waMessageId, body, at) {
    await insertMessage({
      conversationId,
      waMessageId,
      direction: "out",
      sender: "bot",
      messageType: "text",
      body,
      sentAt: at,
      handled: true,
    });
  },
};

/** Live prices, policies and room numbers for the agent's prompt and checks. */
export async function loadAgentContext(siteUrl: string): Promise<AgentContext> {
  const [rooms, economyTier, units] = await Promise.all([getPublicRooms(), getEconomyTier(), getRoomUnits()]);
  const quoteRooms = rooms.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    nightly_rate_usd: r.nightly_rate_usd,
    long_stay_discount: r.long_stay_discount,
  }));
  return {
    knowledgePack: buildKnowledgePack({
      rooms: quoteRooms,
      economyTier,
      policiesText: policiesText(Math.round(economyTier.discount * 100)),
      guides,
      siteUrl,
    }),
    rooms: quoteRooms,
    siteUrl,
    // Room numbers must never reach a guest (guard.ts).
    forbidden: units.map((u) => u.name).filter((n) => n.trim().length >= 3),
    async getAvailability(checkIn, checkOut) {
      return Promise.all(
        quoteRooms.map(async (room) => {
          const unitsFree = (await getRoomUnitAvailability(room.id, checkIn, checkOut)).filter((u) =>
            isRoomUnitAvailableForBooking(u),
          );
          return { room: room.name, slug: room.slug, free: unitsFree.length };
        }),
      );
    },
  };
}
