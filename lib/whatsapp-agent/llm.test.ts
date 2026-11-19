import { describe, expect, it } from "vitest";
import { LlmError, createLlmClient, openAiCompatibleClient } from "./llm";

const schema = { type: "object" as const, properties: { reply: { type: "string" } }, required: ["reply"], additionalProperties: false as const };

function fakeFetch(status: number, body: unknown, seen: { url?: string; body?: Record<string, unknown> } = {}) {
  return (async (url: string, init: RequestInit) => {
    seen.url = url;
    seen.body = JSON.parse(String(init.body));
    return new Response(JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
}

describe("openAiCompatibleClient", () => {
  it("sends a json_schema request and parses the reply and usage", async () => {
    const seen: { url?: string; body?: Record<string, unknown> } = {};
    const client = openAiCompatibleClient({
      label: "openai/test",
      baseUrl: "https://api.openai.com/v1",
      apiKey: "k",
      model: "gpt-test",
      reasoningEffort: "low",
      fetchImpl: fakeFetch(200, {
        choices: [{ message: { content: '{"reply":"hi"}' } }],
        usage: { prompt_tokens: 100, completion_tokens: 5, prompt_tokens_details: { cached_tokens: 80 } },
      }, seen),
    });
    const res = await client.json({ system: "s", user: "u", schemaName: "reply", schema });
    expect(res.data).toEqual({ reply: "hi" });
    expect(res.usage).toEqual({ inputTokens: 100, cachedInputTokens: 80, outputTokens: 5 });
    expect(seen.url).toBe("https://api.openai.com/v1/chat/completions");
    expect(seen.body).toMatchObject({ model: "gpt-test", reasoning_effort: "low", response_format: { type: "json_schema" } });
  });

  it("throws LlmError on HTTP errors and non-JSON content", async () => {
    const bad = openAiCompatibleClient({ label: "x", baseUrl: "https://h", apiKey: "k", model: "m", fetchImpl: fakeFetch(429, { error: "slow down" }) });
    await expect(bad.json({ system: "s", user: "u", schemaName: "r", schema })).rejects.toBeInstanceOf(LlmError);
    const prose = openAiCompatibleClient({ label: "x", baseUrl: "https://h", apiKey: "k", model: "m", fetchImpl: fakeFetch(200, { choices: [{ message: { content: "Sure!" } }] }) });
    await expect(prose.json({ system: "s", user: "u", schemaName: "r", schema })).rejects.toThrow(/not JSON/);
  });

  it("json_object mode puts the schema in the prompt", async () => {
    const seen: { body?: Record<string, unknown> } = {};
    const c = openAiCompatibleClient({ label: "x", baseUrl: "https://h", apiKey: "k", model: "m", responseFormat: "json_object", fetchImpl: fakeFetch(200, { choices: [{ message: { content: '```json\n{"reply":"ok"}\n```' } }] }, seen) });
    const res = await c.json({ system: "s", user: "u", schemaName: "r", schema });
    expect(res.data).toEqual({ reply: "ok" });
    expect(JSON.stringify(seen.body)).toContain("JSON schema");
  });
});

describe("createLlmClient", () => {
  it("needs the provider's key", () => {
    expect(() => createLlmClient("openai", "gpt-6-luna", {})).toThrow(/OPENAI_API_KEY/);
    expect(createLlmClient("openai", "gpt-6-luna", { OPENAI_API_KEY: "k" }).label).toBe("openai/gpt-6-luna");
  });
});
