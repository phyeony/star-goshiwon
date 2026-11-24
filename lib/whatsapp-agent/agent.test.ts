import { describe, expect, it } from "vitest";
import { runAgentTurn, type AgentTurnInput } from "./agent";
import { DECLINE_TEXT, MEN_ONLY_CHECK } from "./facts";
import type { LlmClient, LlmRequest } from "./llm";
import { CATEGORIES, type Category, type Understanding } from "./types";

const allOn = Object.fromEntries(CATEGORIES.map((c) => [c, true])) as Record<Category, boolean>;

function fakeLlm(understanding: Partial<Understanding>, reply: string, calls: LlmRequest[] = []): LlmClient {
  return {
    label: "fake",
    async json(req) {
      calls.push(req);
      const data = req.schemaName === "understanding"
        ? { categories: ["location"], needs_human: false, men_only_signal: "none", guest_language: "en", room_slug: null, check_in: null, check_out: null, reason_ko: "없음", summary_ko: "", guest_message_ko: "", ...understanding }
        : { reply };
      return { data, usage: { inputTokens: 10, cachedInputTokens: 0, outputTokens: 2 }, latencyMs: 1 };
    },
  };
}

function base(llm: LlmClient, state: Partial<AgentTurnInput["state"]> = {}): AgentTurnInput {
  return {
    llm,
    knowledgePack: "Economy Room $11 per night (~₩16,000). Deposit $70.",
    settings: { mode: "live", autoSend: allOn },
    state: { menOnlyState: "confirmed", botState: "active", isFirstContact: false, linkedBooking: null, ...state },
    messages: [{ from: "guest", text: "Where are you?", pending: true }],
    rooms: [{ name: "Economy Room", slug: "economy-room", nightly_rate_usd: 11, long_stay_discount: 0.4 }],
    siteUrl: "https://goshiwonseoul.com",
    today: "2026-11-18",
    forbidden: ["701"],
  };
}

describe("runAgentTurn", () => {
  it("sends a clean answer", async () => {
    const r = await runAgentTurn(base(fakeLlm({}, "We're near Noryangjin Station.")));
    expect(r.decision.outcome).toBe("send");
    expect(r.outgoing).toBe("We're near Noryangjin Station.");
  });

  it("puts the knowledge pack first in both calls (cache-friendly)", async () => {
    const calls: LlmRequest[] = [];
    await runAgentTurn(base(fakeLlm({}, "Hi", calls)));
    expect(calls).toHaveLength(2);
    expect(calls[0].system.startsWith("Economy Room")).toBe(true);
    expect(calls[1].system.startsWith("Economy Room")).toBe(true);
  });

  it("never asks about gender on WhatsApp (policy)", async () => {
    const r = await runAgentTurn(base(fakeLlm({}, "We're near Noryangjin Station."), { menOnlyState: "unasked", isFirstContact: true }));
    expect(r.outgoing).toBe("We're near Noryangjin Station.");
    expect(r.outgoing).not.toContain(MEN_ONLY_CHECK);
  });

  it("hands off when the reply invents a price", async () => {
    const r = await runAgentTurn(base(fakeLlm({ categories: ["pricing"] }, "For you, $8 a night!")));
    expect(r.decision.outcome).toBe("draft");
    expect(r.outgoing).toBeNull();
    expect(r.guardProblems[0]).toMatch(/amount/);
  });

  it("quotes from the calculator when room and dates are given", async () => {
    const r = await runAgentTurn(base(fakeLlm({ categories: ["pricing"], room_slug: "economy-room", check_in: "2026-12-01", check_out: "2026-12-15" }, "14 nights in the Economy Room come to $154, plus the $70 deposit: $224 in total.")));
    expect(r.quote?.ok).toBe(true);
    expect(r.decision.outcome).toBe("send");
  });

  it("never turns anyone away by gender: hands the chat to the manager", async () => {
    const r = await runAgentTurn(base(fakeLlm({ categories: ["men_only"], men_only_signal: "declined" }, "whatever"), { menOnlyState: "asked" }));
    expect(r.outgoing).toBeNull();
    expect(r.outgoing).not.toBe(DECLINE_TEXT);
    expect(r.decision.outcome).toBe("draft");
  });

  it("a drafted reply that mentions gender is not sent", async () => {
    const r = await runAgentTurn(base(fakeLlm({ categories: ["rules"] }, "Sorry, we only take male guests.")));
    expect(r.decision.outcome).toBe("draft");
    expect(r.guardProblems).toContain("mentions gender");
  });

  it("an LLM failure is a handoff, not a crash", async () => {
    const broken: LlmClient = { label: "x", json: async () => { throw new Error("timeout"); } };
    const r = await runAgentTurn(base(broken));
    expect(r.decision.outcome).toBe("draft");
    expect(r.error).toBe("timeout");
  });
});
