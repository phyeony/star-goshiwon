// Queue consumer logic, used by worker.ts. Kept free of app imports so the
// small custom worker bundles without pulling in the Next.js app.
//
// A job is { conversationId } (an agent run: /api/whatsapp/process) or
// { bookingFollowup } (the booking-received check: /api/whatsapp/booking-followup).
// Each calls an internal route of the same worker, which does the real work.

export interface QueueMessage {
  body: unknown;
  ack(): void;
  retry(options?: { delaySeconds?: number }): void;
}

export type CallProcess = (conversationId: string) => Promise<{ status?: string } | null>;
export type CallFollowup = (bookingId: string) => Promise<unknown>;

// "busy": another run holds the chat and may have started before this
// message arrived, so try again shortly. "waiting_for_more": the guest is
// still typing; a later job will answer, but retry once in case it was lost.
const RETRY_DELAY: Record<string, number> = { busy: 30, waiting_for_more: 10 };

export async function consumeBatch(
  messages: readonly QueueMessage[],
  callProcess: CallProcess,
  callFollowup?: CallFollowup,
): Promise<void> {
  for (const msg of messages) {
    const followup = (msg.body as { bookingFollowup?: unknown } | null)?.bookingFollowup;
    if (typeof followup === "string" && followup && callFollowup) {
      try {
        await callFollowup(followup);
        msg.ack();
      } catch (e) {
        console.error("whatsapp queue: booking follow-up failed", followup, e);
        msg.retry({ delaySeconds: 60 });
      }
      continue;
    }
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
