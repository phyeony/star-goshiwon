// Wiring for the live agent: env keys, the queue binding and the real
// dependencies of processConversation. Every key is also listed in
// .env.example; staging uses Meta's test number.
//
//   WHATSAPP_APP_SECRET       Meta app secret (webhook signatures)
//   WHATSAPP_VERIFY_TOKEN     any random string, also typed into Meta's webhook form
//   WHATSAPP_ACCESS_TOKEN     System User permanent token
//   WHATSAPP_PHONE_NUMBER_ID  the number the agent answers on
//   WHATSAPP_INTERNAL_TOKEN   random string; lets the queue call /api/whatsapp/process
//   WHATSAPP_GRAPH_VERSION    optional, e.g. v24.0
//   WHATSAPP_BOOKING_TEMPLATE name of the approved booking-received template;
//                             empty = don't send it (lib/whatsapp/booking-received.ts)
//   WHATSAPP_BOOKING_TEMPLATE_LANG  optional, default "en"
//   OPENAI_API_KEY etc.       the model provider chosen in whatsapp_settings

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createLlmClient, type ProviderName } from "@/lib/whatsapp-agent/llm";
import { markRead, sendTemplate, sendText, type GraphConfig } from "./graph";
import type { BookingReceivedDeps } from "./booking-received";
import { processConversation, type ProcessDeps, type ProcessResult } from "./process";
import { loadAgentContext, recordBookingReceived, supabaseStore } from "./store";

// The webhook queues a job this long after each guest message (burst wait).
export const QUEUE_DELAY_SECONDS = 45;

export interface QueueJob {
  conversationId: string;
}

interface QueueBinding {
  send(body: QueueJob, options?: { delaySeconds?: number }): Promise<void>;
}

function env(name: string): string {
  return process.env[name] ?? "";
}

export function siteUrl(): string {
  return env("NEXT_PUBLIC_SITE_URL") || "https://goshiwonseoul.com";
}

export function graphConfig(): GraphConfig {
  const accessToken = env("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = env("WHATSAPP_PHONE_NUMBER_ID");
  if (!accessToken || !phoneNumberId) {
    throw new Error("WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID not set");
  }
  return { accessToken, phoneNumberId, apiVersion: env("WHATSAPP_GRAPH_VERSION") || undefined };
}

/** True when the internal call carries WHATSAPP_INTERNAL_TOKEN. */
export function isInternalCall(authorization: string | null): boolean {
  const token = env("WHATSAPP_INTERNAL_TOKEN");
  return Boolean(token) && authorization === `Bearer ${token}`;
}

/**
 * Queues an agent run for a conversation. In `next dev`, or without a queue
 * binding, it returns false and the caller runs it in the background.
 */
export async function enqueue(job: QueueJob): Promise<boolean> {
  // `next dev` emulates the queue binding but has no consumer, so a job
  // sent there would never run.
  if (process.env.NODE_ENV === "development") return false;
  try {
    const { env: cf } = await getCloudflareContext({ async: true });
    const queue = (cf as unknown as { WHATSAPP_QUEUE?: QueueBinding }).WHATSAPP_QUEUE;
    if (!queue) return false;
    await queue.send(job, { delaySeconds: QUEUE_DELAY_SECONDS });
    return true;
  } catch {
    return false;
  }
}

export function liveDeps(): ProcessDeps {
  return {
    store: supabaseStore,
    sender: {
      sendText: (to, text) => sendText(graphConfig(), to, text),
      markRead: (id) => markRead(graphConfig(), id),
    },
    makeLlm: (s) =>
      createLlmClient(s.llmProvider as ProviderName, s.llmModel, process.env, {
        reasoningEffort: s.llmEffort ?? undefined,
        timeoutMs: 45_000,
      }),
    loadContext: () => loadAgentContext(siteUrl()),
  };
}

export function runConversation(conversationId: string): Promise<ProcessResult> {
  return processConversation(liveDeps(), conversationId);
}

/** Deps for the booking-received template, or null when it isn't set up. */
export function bookingReceivedDeps(): BookingReceivedDeps | null {
  const templateName = env("WHATSAPP_BOOKING_TEMPLATE");
  if (!templateName || !env("WHATSAPP_ACCESS_TOKEN") || !env("WHATSAPP_PHONE_NUMBER_ID")) return null;
  const cfg = graphConfig();
  return {
    templateName,
    language: env("WHATSAPP_BOOKING_TEMPLATE_LANG") || "en",
    send: (to, template) => sendTemplate(cfg, to, template),
    record: recordBookingReceived,
  };
}
