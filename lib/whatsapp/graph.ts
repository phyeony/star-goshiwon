// WhatsApp Cloud API calls: send a text, mark a message read.
// https://developers.facebook.com/docs/whatsapp/cloud-api/messages
//
// Test chats from the simulator (lib/whatsapp/simulator.ts) are answered
// here with a made-up id and never reach Meta.

import { isSimulatedMessageId, isSimulatedPhone, simMessageId } from "./simulator";

import { isTransient, withRetry } from "@/lib/retry";

export interface GraphConfig {
  accessToken: string;
  phoneNumberId: string;
  apiVersion?: string;
  fetchImpl?: typeof fetch;
  /** Waits before each retry; default 2 s then 6 s. [] = no retries. */
  retryDelaysMs?: number[];
  sleep?: (ms: number) => Promise<void>;
}

export class GraphError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "GraphError";
  }
}

export const DEFAULT_GRAPH_VERSION = "v24.0";

// A rate limit, a Meta server error or a dropped connection gets two more
// tries. A 4xx (bad token, closed window, …) or a timeout does not: the
// first can't succeed, and after the second the message may already be out.
function post(cfg: GraphConfig, body: unknown): Promise<Record<string, unknown>> {
  return withRetry(() => postOnce(cfg, body), {
    delaysMs: cfg.retryDelaysMs ?? [2_000, 6_000],
    shouldRetry: (e) => (e instanceof GraphError ? e.status !== undefined && isTransient(e, e.status) : isTransient(e)),
    sleep: cfg.sleep,
  });
}

async function postOnce(cfg: GraphConfig, body: unknown): Promise<Record<string, unknown>> {
  const doFetch = cfg.fetchImpl ?? fetch;
  const url = `https://graph.facebook.com/${cfg.apiVersion ?? DEFAULT_GRAPH_VERSION}/${cfg.phoneNumberId}/messages`;
  const res = await doFetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${cfg.accessToken}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new GraphError(`WhatsApp API HTTP ${res.status}: ${text.slice(0, 300)}`, res.status);
  }
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

/** Sends a plain text message; returns Meta's message id. */
export async function sendText(cfg: GraphConfig, to: string, text: string): Promise<string> {
  if (isSimulatedPhone(to)) return simMessageId();
  const json = await post(cfg, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: false, body: text },
  });
  const id = (json.messages as { id?: string }[] | undefined)?.[0]?.id;
  if (!id) throw new GraphError("WhatsApp API: no message id in the response");
  return id;
}

/** Marks a guest message (and the ones before it) as read: blue ticks. */
export async function markRead(cfg: GraphConfig, waMessageId: string): Promise<void> {
  if (isSimulatedMessageId(waMessageId)) return;
  await post(cfg, { messaging_product: "whatsapp", status: "read", message_id: waMessageId });
}

/**
 * Sends an approved message template with positional body parameters
 * ({{1}}, {{2}}, …); returns Meta's message id. Templates are the only way
 * to write first, outside the 24-hour window.
 */
export async function sendTemplate(
  cfg: GraphConfig,
  to: string,
  template: { name: string; language: string; bodyParams: string[] },
): Promise<string> {
  if (isSimulatedPhone(to)) return simMessageId();
  const json = await post(cfg, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: template.name,
      language: { code: template.language },
      components: [
        { type: "body", parameters: template.bodyParams.map((text) => ({ type: "text", text })) },
      ],
    },
  });
  const id = (json.messages as { id?: string }[] | undefined)?.[0]?.id;
  if (!id) throw new GraphError("WhatsApp API: no message id in the response");
  return id;
}
