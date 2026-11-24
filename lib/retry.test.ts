import { describe, expect, it, vi } from "vitest";
import { isTransient, withRetry } from "./retry";
import { LlmError, retryingClient, type LlmClient } from "./whatsapp-agent/llm";
import { sendText } from "./whatsapp/graph";

const noWait = vi.fn(async () => {});

describe("withRetry", () => {
  it("retries transient failures with the given waits, then gives up", async () => {
    const waits: number[] = [];
    const fn = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(withRetry(fn, { delaysMs: [2, 5], shouldRetry: () => true, sleep: async (ms) => void waits.push(ms) })).rejects.toThrow(
      "fetch failed",
    );
    expect(fn).toHaveBeenCalledTimes(3);
    expect(waits).toEqual([2, 5]);
  });

  it("knows what is worth another try", () => {
    expect(isTransient(null, 429)).toBe(true);
    expect(isTransient(null, 503)).toBe(true);
    expect(isTransient(null, 400)).toBe(false);
    expect(isTransient(new TypeError("fetch failed"))).toBe(true);
    expect(isTransient(new DOMException("timed out", "TimeoutError"))).toBe(false);
  });
});

describe("model retries", () => {
  it("retries a 429, not a bad reply", async () => {
    let calls = 0;
    const flaky: LlmClient = {
      label: "x",
      async json() {
        calls++;
        if (calls === 1) throw new LlmError("HTTP 429", 429);
        return { data: { ok: true }, usage: { inputTokens: 1, cachedInputTokens: 0, outputTokens: 1 }, latencyMs: 1 };
      },
    };
    const c = retryingClient(flaky, { sleep: noWait });
    await expect(c.json({} as never)).resolves.toMatchObject({ data: { ok: true } });
    expect(calls).toBe(2);

    let badCalls = 0;
    const bad = retryingClient(
      {
        label: "x",
        async json() {
          badCalls++;
          throw new LlmError("reply was not JSON");
        },
      },
      { sleep: noWait },
    );
    await expect(bad.json({} as never)).rejects.toThrow("not JSON");
    expect(badCalls).toBe(1);
  });
});

describe("send retries", () => {
  it("retries a Meta 5xx, not a 4xx", async () => {
    const responses = [new Response("oops", { status: 500 }), new Response(JSON.stringify({ messages: [{ id: "wamid.ok" }] }))];
    const fetchImpl = vi.fn(async () => responses.shift()!);
    await expect(sendText({ accessToken: "T", phoneNumberId: "P", fetchImpl, sleep: noWait }, "1", "x")).resolves.toBe("wamid.ok");
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    const refused = vi.fn(async () => new Response("bad token", { status: 401 }));
    await expect(sendText({ accessToken: "T", phoneNumberId: "P", fetchImpl: refused, sleep: noWait }, "1", "x")).rejects.toThrow(/401/);
    expect(refused).toHaveBeenCalledTimes(1);
  });
});
