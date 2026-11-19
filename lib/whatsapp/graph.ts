// WhatsApp Cloud API calls: send a text, mark a message read.
// https://developers.facebook.com/docs/whatsapp/cloud-api/messages

export interface GraphConfig {
  accessToken: string;
  phoneNumberId: string;
  apiVersion?: string;
  fetchImpl?: typeof fetch;
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

async function post(cfg: GraphConfig, body: unknown): Promise<Record<string, unknown>> {
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
  await post(cfg, { messaging_product: "whatsapp", status: "read", message_id: waMessageId });
}
