import { describe, expect, it } from "vitest";
import { AFTER_HOURS_NOTICE, MEN_ONLY_CHECK } from "@/lib/whatsapp-agent/facts";
import type { LlmClient } from "@/lib/whatsapp-agent/llm";
import { CATEGORIES, type Category, type Understanding } from "@/lib/whatsapp-agent/types";
import {
  isAfterHours,
  processConversation,
  type ConversationRow,
  type MessageRow,
  type ProcessDeps,
  type RunRecord,
  type Settings,
  type WhatsAppStore,
} from "./process";

const NOON_KST = new Date("2026-11-18T03:00:00Z");
const ONE_AM_KST = new Date("2026-11-18T16:00:00Z");
const allOn = Object.fromEntries(CATEGORIES.map((c) => [c, true])) as Record<Category, boolean>;

function setup(opts: {
  conversation?: Partial<ConversationRow>;
  messages?: Partial<MessageRow>[];
  settings?: Partial<Settings>;
  understanding?: Partial<Understanding>;
  reply?: string;
  now?: Date;
  claimFails?: boolean;
  sendFails?: boolean;
}) {
  const now = opts.now ?? NOON_KST;
  const ago = (s: number) => new Date(now.getTime() - s * 1000).toISOString();
  let conversation: ConversationRow = {
    id: "c1",
    wa_phone: "447700900123",
    booking_request_id: null,
    men_only_state: "confirmed",
    bot_state: "active",
    paused_until: null,
    after_hours_notice_at: null,
    ...opts.conversation,
  };
  const messages: MessageRow[] = (opts.messages ?? [{ body: "Where are you?" }]).map((m, i) => ({
    id: `m${i}`,
    wa_message_id: `wamid.${i}`,
    sender: "guest",
    message_type: "text",
    body: "",
    handled_at: null,
    created_at: ago(60),
    ...m,
  }));
  const log = {
    runs: [] as RunRecord[],
    sent: [] as string[],
    read: [] as string[],
    llmCalls: 0,
    released: false,
    handled: [] as { ids: string[]; runId: string | null }[],
  };
  const store: WhatsAppStore = {
    async getSettings() {
      return { mode: "live", autoSend: allOn, llmProvider: "fake", llmModel: "fake", llmEffort: null, ...opts.settings };
    },
    async claimConversation() {
      return opts.claimFails ? null : conversation;
    },
    async releaseConversation() {
      log.released = true;
    },
    async getRecentMessages() {
      return messages;
    },
    async getPendingGuestMessages() {
      return messages.filter((m) => m.sender === "guest" && !m.handled_at);
    },
    async getLinkedBooking() {
      return null;
    },
    async updateConversation(_id, patch) {
      conversation = { ...conversation, ...patch };
    },
    async saveRun(run) {
      log.runs.push(run);
      return `run${log.runs.length}`;
    },
    async markHandled(ids, runId) {
      log.handled.push({ ids, runId });
    },
    async insertOutbound() {},
  };
  const llm: LlmClient = {
    label: "fake/model",
    async json(req) {
      log.llmCalls++;
      const data =
        req.schemaName === "understanding"
          ? {
              categories: ["location"],
              needs_human: false,
              men_only_signal: "none",
              guest_language: "en",
              room_slug: null,
              check_in: null,
              check_out: null,
              reason_ko: "",
              summary_ko: "",
              guest_message_ko: "",
              ...opts.understanding,
            }
          : { reply: opts.reply ?? "We're a short walk from Noryangjin Station." };
      return { data, usage: { inputTokens: 1, cachedInputTokens: 0, outputTokens: 1 }, latencyMs: 1 };
    },
  };
  const deps: ProcessDeps = {
    store,
    now: () => now,
    makeLlm: () => llm,
    sender: {
      async sendText(_to, text) {
        if (opts.sendFails) throw new Error("WhatsApp API HTTP 500");
        log.sent.push(text);
        return `wamid.out${log.sent.length}`;
      },
      async markRead(id) {
        log.read.push(id);
      },
    },
    async loadContext() {
      return {
        knowledgePack: "Star Goshiwon is near Noryangjin Station.",
        rooms: [],
        siteUrl: "https://goshiwonseoul.com",
        forbidden: ["701"],
        getAvailability: async () => [],
      };
    },
  };
  return { deps, log, conversation: () => conversation };
}

describe("isAfterHours", () => {
  it("is outside 9 AM – 11 PM Korea time", () => {
    expect(isAfterHours(new Date("2026-11-18T23:59:00Z"))).toBe(true); // 08:59 KST
    expect(isAfterHours(new Date("2026-11-18T00:00:00Z"))).toBe(false); // 09:00
    expect(isAfterHours(new Date("2026-11-18T13:59:00Z"))).toBe(false); // 22:59
    expect(isAfterHours(new Date("2026-11-18T14:00:00Z"))).toBe(true); // 23:00
  });
});

describe("processConversation", () => {
  it("answers, marks the newest guest message read, and saves the run", async () => {
    const t = setup({ messages: [{ body: "Hi" }, { body: "Where are you?" }] });
    const r = await processConversation(t.deps, "c1");
    expect(r).toMatchObject({ status: "done", outcome: "send", sent: true });
    expect(t.log.sent).toEqual(["We're a short walk from Noryangjin Station."]);
    expect(t.log.read).toEqual(["wamid.1"]);
    expect(t.log.handled).toEqual([{ ids: ["m0", "m1"], runId: "run1" }]);
    expect(t.log.runs[0].model).toBe("fake/model");
    expect(t.log.released).toBe(true);
  });

  it("asks the men-only check on first contact and remembers it was asked", async () => {
    const t = setup({ conversation: { men_only_state: "unasked" } });
    await processConversation(t.deps, "c1");
    expect(t.log.sent[0]).toContain(MEN_ONLY_CHECK);
    expect(t.conversation().men_only_state).toBe("asked");
  });

  it("waits while the guest is still typing", async () => {
    const t = setup({ messages: [{ body: "Hi", created_at: new Date(NOON_KST.getTime() - 10_000).toISOString() }] });
    expect(await processConversation(t.deps, "c1")).toEqual({ status: "waiting_for_more" });
    expect(t.log.llmCalls).toBe(0);
    expect(t.log.handled).toEqual([]);
    expect(t.log.released).toBe(true);
  });

  it("does nothing when another run holds the conversation", async () => {
    const t = setup({ claimFails: true });
    expect(await processConversation(t.deps, "c1")).toEqual({ status: "busy" });
    expect(t.log.released).toBe(false);
  });

  it("mode off: no model call, messages marked handled so they aren't answered later", async () => {
    const t = setup({ settings: { mode: "off" } });
    expect(await processConversation(t.deps, "c1")).toEqual({ status: "mode_off" });
    expect(t.log.llmCalls).toBe(0);
    expect(t.log.handled).toEqual([{ ids: ["m0"], runId: null }]);
  });

  it("bot off for the chat: nothing at all", async () => {
    const t = setup({ conversation: { bot_state: "off" } });
    expect(await processConversation(t.deps, "c1")).toEqual({ status: "bot_off" });
    expect(t.log.llmCalls).toBe(0);
    expect(t.log.sent).toEqual([]);
  });

  it("paused by the manager: drafts only, even at night", async () => {
    const until = new Date(ONE_AM_KST.getTime() + 3600_000).toISOString();
    const t = setup({ now: ONE_AM_KST, conversation: { bot_state: "paused_by_manager", paused_until: until } });
    const r = await processConversation(t.deps, "c1");
    expect(r).toMatchObject({ outcome: "draft", sent: false });
    expect(t.log.sent).toEqual([]);
    expect(t.log.runs[0].result?.draft).toContain("Noryangjin");
  });

  it("the 12-hour pause ends by itself", async () => {
    const t = setup({
      conversation: { bot_state: "paused_by_manager", paused_until: new Date(NOON_KST.getTime() - 1000).toISOString() },
    });
    const r = await processConversation(t.deps, "c1");
    expect(r).toMatchObject({ outcome: "send", sent: true });
    expect(t.conversation().bot_state).toBe("active");
  });

  it("at night a handoff gets the after-hours line once, and stays unread", async () => {
    const t = setup({ now: ONE_AM_KST, understanding: { categories: ["complaint"] } });
    const r = await processConversation(t.deps, "c1");
    expect(r).toMatchObject({ outcome: "draft", sent: true });
    expect(t.log.sent).toEqual([AFTER_HOURS_NOTICE]);
    expect(t.log.read).toEqual([]);
    expect(t.log.runs[0].afterHoursNotice).toBe(true);
    expect(t.conversation().after_hours_notice_at).toBe(ONE_AM_KST.toISOString());

    const again = setup({
      now: new Date(ONE_AM_KST.getTime() + 3600_000),
      understanding: { categories: ["complaint"] },
      conversation: { after_hours_notice_at: ONE_AM_KST.toISOString() },
    });
    await processConversation(again.deps, "c1");
    expect(again.log.sent).toEqual([]);
  });

  it("by day a handoff sends nothing", async () => {
    const t = setup({ understanding: { categories: ["complaint"] } });
    const r = await processConversation(t.deps, "c1");
    expect(r).toMatchObject({ outcome: "draft", sent: false });
    expect(t.log.sent).toEqual([]);
    expect(t.log.handled[0].runId).toBe("run1");
  });

  it("a failed send is recorded and nothing is marked read", async () => {
    const t = setup({ sendFails: true });
    const r = await processConversation(t.deps, "c1");
    expect(r).toMatchObject({ outcome: "send", sent: false });
    expect(t.log.read).toEqual([]);
    expect(t.log.runs[0].sendError).toMatch(/HTTP 500/);
    expect(t.log.runs[0].outgoing).toBeNull();
  });

  it("never sends free-form text after Meta's 24-hour window", async () => {
    const old = new Date(NOON_KST.getTime() - 25 * 3600_000).toISOString();
    const t = setup({ messages: [{ body: "Where are you?", created_at: old }] });
    const r = await processConversation(t.deps, "c1");
    expect(r).toMatchObject({ outcome: "draft", sent: false });
  });
});
