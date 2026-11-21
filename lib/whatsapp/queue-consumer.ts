// Queue consumer logic, used by worker.ts. Kept free of app imports so the
// small custom worker bundles without pulling in the Next.js app.
//
// Each job is { conversationId }. The job calls /api/whatsapp/process inside
// the same worker; that route does the real work (lib/whatsapp/process.ts).

export interface QueueMessage {
  body: unknown;
  ack(): void;
  retry(options?: { delaySeconds?: number }): void;
}

export type CallProcess = (conversationId: string) => Promise<{ status?: string } | null>;

// "busy": another run holds the chat and may have started before this
// message arrived, so try again shortly. "waiting_for_more": the guest is
// still typing; a later job will answer, but retry once in case it was lost.
const RETRY_DELAY: Record<string, number> = { busy: 30, waiting_for_more: 10 };

export async function consumeBatch(messages: readonly QueueMessage[], callProcess: CallProcess): Promise<void> {
  for (const msg of messages) {
    const id = (msg.body as { conversationId?: unknown } | null)?.conversationId;
    if (typeof id !== "string" || !id) {
      msg.ack(); // malformed; retrying won't fix it
      continue;
    }
    try {
      const result = await callProcess(id);
      const delay = result?.status ? RETRY_DELAY[result.status] : undefined;
      if (delay) msg.retry({ delaySeconds: delay });
      else msg.ack();
    } catch (e) {
      console.error("whatsapp queue: run failed", id, e);
      msg.retry({ delaySeconds: 60 });
    }
  }
}

/** Calls an internal route of this same worker through its service binding. */
export function internalCaller(
  self: { fetch(req: Request): Promise<Response> },
  baseUrl: string,
  token: string,
) {
  return async (path: string, body: unknown): Promise<Record<string, unknown>> => {
    const res = await self.fetch(
      new Request(new URL(path, baseUrl), {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
    return (await res.json()) as Record<string, unknown>;
  };
}
