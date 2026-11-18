// WhatsApp agent test run with a real model. Not part of `pnpm verify`.
//
//   pnpm eval:whatsapp                                   # openai / gpt-6-luna
//   pnpm eval:whatsapp --provider gemini --model gemini-3.1-flash-lite
//   pnpm eval:whatsapp --only short-stay,price-one-month
//   pnpm eval:whatsapp --effort low --price 0.10,0.01,0.50
//
// Keys come from .env.local (OPENAI_API_KEY, GEMINI_API_KEY,
// OPENROUTER_API_KEY, CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_AI_API_TOKEN).
// Room prices are a snapshot of production (2026-11-18), so the test doesn't
// touch the database.
import { mkdirSync, writeFileSync } from "node:fs";
import { guides } from "@/lib/guides";
import { deriveTier } from "@/lib/pricing";
import { runAgentTurn, type AgentTurnResult } from "@/lib/whatsapp-agent/agent";
import { buildKnowledgePack } from "@/lib/whatsapp-agent/knowledge";
import { createLlmClient, type ProviderName } from "@/lib/whatsapp-agent/llm";
import { policiesPlainText } from "@/lib/whatsapp-agent/policies-text";
import { CATEGORIES, type Category, type ConversationState } from "@/lib/whatsapp-agent/types";
import { CASES, type EvalCase } from "./cases";

const ROOMS = [
  { id: "r1", name: "Economy Room", slug: "economy-room", nightly_rate_usd: 15, long_stay_discount: 0.4 },
  { id: "r2", name: "Private Shower Room", slug: "room-with-private-shower", nightly_rate_usd: 20, long_stay_discount: 0.4 },
  { id: "r3", name: "Private Shower & Toilet Room", slug: "room-with-private-shower-and-toilet", nightly_rate_usd: 20, long_stay_discount: 0.4 },
];
const SITE_URL = "https://goshiwonseoul.com";
const TODAY = "2026-11-18";
const FORBIDDEN = ["501", "502", "503", "506", "701", "702", "703", "813"];
// USD per 1M tokens: input, cached input, output. Defaults: GPT-6 Luna.
const DEFAULT_PRICE: Record<string, [number, number, number]> = {
  "gpt-6-luna": [0.1, 0.01, 0.5],
};

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

function matches(text: string, p: string | RegExp): boolean {
  return typeof p === "string" ? text.toLowerCase().includes(p.toLowerCase()) : p.test(text);
}

function grade(c: EvalCase, r: AgentTurnResult): string[] {
  const fails: string[] = [];
  const want = Array.isArray(c.expect.outcome) ? c.expect.outcome : [c.expect.outcome];
  if (!want.includes(r.decision.outcome)) fails.push(`outcome ${r.decision.outcome}, wanted ${want.join(" | ")}`);
  const sent = r.outgoing ?? "";
  // Includes are checked on what is sent, or on the draft for handoffs.
  const text = r.outgoing ?? r.draft;
  for (const p of c.expect.includes ?? []) if (!matches(text, p)) fails.push(`missing ${p}`);
  for (const p of c.expect.excludes ?? []) if (sent && matches(sent, p)) fails.push(`sent text contains ${p}`);
  return fails;
}

async function main() {
  const provider = (arg("provider") ?? "openai") as ProviderName;
  const model = arg("model") ?? "gpt-6-luna";
  const effort = arg("effort") as "none" | "low" | "medium" | undefined;
  const only = arg("only")?.split(",");
  const price = arg("price")?.split(",").map(Number) as [number, number, number] | undefined;
  const [pIn, pCached, pOut] = price ?? DEFAULT_PRICE[model] ?? [0, 0, 0];

  const llm = createLlmClient(provider, model, process.env, { reasoningEffort: effort, timeoutMs: 90_000 });
  const economy = deriveTier(15, 0.4);
  const knowledgePack = buildKnowledgePack({
    rooms: ROOMS,
    economyTier: economy,
    policiesText: policiesPlainText(Math.round(economy.discount * 100)),
    guides,
    siteUrl: SITE_URL,
  });
  const allOn = Object.fromEntries(CATEGORIES.map((c) => [c, true])) as Record<Category, boolean>;

  const cases = only ? CASES.filter((c) => only.includes(c.id)) : CASES;
  console.log(`\n${llm.label}${effort ? ` (effort ${effort})` : ""} — ${cases.length} cases, knowledge pack ${knowledgePack.length.toLocaleString()} chars\n`);

  const rows: { c: EvalCase; r: AgentTurnResult; fails: string[] }[] = [];
  for (const c of cases) {
    const state: ConversationState = {
      menOnlyState: "unasked",
      botState: "active",
      isFirstContact: false,
      linkedBooking: null,
      ...c.state,
    };
    const r = await runAgentTurn({
      llm,
      knowledgePack,
      settings: { mode: "live", autoSend: allOn },
      state,
      messages: [
        ...(c.history ?? []),
        ...c.messages.map((text) => ({ from: "guest" as const, text, pending: true })),
      ],
      rooms: ROOMS,
      siteUrl: SITE_URL,
      today: TODAY,
      forbidden: FORBIDDEN,
      getAvailability: async () =>
        ROOMS.map((room) => ({ room: room.name, slug: room.slug, free: c.free?.[room.slug] ?? 2 })),
    });
    const fails = r.error ? [`error: ${r.error}`, ...grade(c, r)] : grade(c, r);
    rows.push({ c, r, fails });

    const mark = fails.length ? "FAIL" : "pass";
    console.log(`${mark}  ${c.id}  →  ${r.decision.outcome}  [${r.understanding?.categories.join(", ") ?? "-"}]  ${(r.latencyMs / 1000).toFixed(1)}s`);
    if (fails.length) console.log(`      ${fails.join("\n      ")}`);
    if (r.outgoing) console.log(`      sent: ${r.outgoing.replace(/\n/g, " ⏎ ")}`);
    else if (r.draft) console.log(`      draft: ${r.draft.replace(/\n/g, " ⏎ ")}`);
    if (r.decision.reasons.length) console.log(`      handoff: ${r.decision.reasons.join("; ")}`);
    if (r.understanding?.summary_ko) console.log(`      요약: ${r.understanding.summary_ko}`);
  }

  // Summary
  const passed = rows.filter((x) => !x.fails.length).length;
  const unsafe = rows.filter((x) => x.r.outgoing && x.r.guardProblems.length).length;
  const wrongSends = rows.filter(
    (x) => x.r.outgoing && x.r.decision.outcome === "send" && ![x.c.expect.outcome].flat().includes("send"),
  );
  const missedAnswers = rows.filter(
    (x) => !x.r.outgoing && [x.c.expect.outcome].flat().every((o) => o !== "draft"),
  );
  const tokens = rows.reduce(
    (t, x) => ({
      input: t.input + x.r.usage.inputTokens,
      cached: t.cached + x.r.usage.cachedInputTokens,
      output: t.output + x.r.usage.outputTokens,
    }),
    { input: 0, cached: 0, output: 0 },
  );
  const cost =
    ((tokens.input - tokens.cached) * pIn + tokens.cached * pCached + tokens.output * pOut) / 1_000_000;
  const lat = rows.map((x) => x.r.latencyMs).sort((a, b) => a - b);
  const pct = (p: number) => (lat[Math.min(lat.length - 1, Math.floor(p * lat.length))] / 1000).toFixed(1);

  console.log("\n──────── summary ────────");
  console.log(`passed            ${passed}/${rows.length}`);
  for (const src of ["chat", "tricky"] as const) {
    const sub = rows.filter((x) => x.c.source === src);
    console.log(`  ${src.padEnd(15)} ${sub.filter((x) => !x.fails.length).length}/${sub.length}`);
  }
  console.log(`sent when it should have handed off   ${wrongSends.length}${wrongSends.length ? `  (${wrongSends.map((x) => x.c.id).join(", ")})` : ""}`);
  console.log(`handed off when it could have answered ${missedAnswers.length}${missedAnswers.length ? `  (${missedAnswers.map((x) => x.c.id).join(", ")})` : ""}`);
  console.log(`sent despite reply-check problems      ${unsafe}`);
  console.log(`tokens            in ${tokens.input.toLocaleString()} (cached ${tokens.cached.toLocaleString()}), out ${tokens.output.toLocaleString()}`);
  if (pIn || pOut) {
    console.log(`cost              $${cost.toFixed(4)} for this run → ≈ $${((cost / rows.length) * 300).toFixed(2)} per 300 turns`);
  }
  console.log(`latency per turn  p50 ${pct(0.5)}s, p95 ${pct(0.95)}s`);

  mkdirSync("scripts/whatsapp-eval/results", { recursive: true });
  const file = `scripts/whatsapp-eval/results/${new Date().toISOString().replace(/[:.]/g, "-")}-${model}.json`;
  writeFileSync(file, JSON.stringify({ model: llm.label, effort, rows: rows.map(({ c, r, fails }) => ({ id: c.id, fails, ...r })) }, null, 2));
  console.log(`\nfull results: ${file}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
