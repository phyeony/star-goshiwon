import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createEmailReceive,
  getMatchedEmailReceiveByProviderThread,
  getOpenBookingRequestsByGuestEmail,
} from "@/lib/queries";
import type { EmailReceive } from "@/lib/types";

export const runtime = "nodejs";

const inboundEmailSchema = z.object({
  secret: z.string().optional(),
  provider: z.string().trim().max(64).optional(),
  providerThreadId: z.string().trim().max(500).optional(),
  messageId: z.string().trim().max(500).optional(),
  fromEmail: z.string().trim().email(),
  fromName: z.string().trim().max(200).optional(),
  toEmail: z.string().trim().email().optional(),
  subject: z.string().trim().max(500).default(""),
  text: z.string().max(100_000).optional(),
  html: z.string().max(500_000).optional(),
  receivedAt: z.string().datetime().optional(),
  extra: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const configuredSecret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;
  if (!configuredSecret) {
    return NextResponse.json(
      { error: "inbound_email_not_configured" },
      { status: 503 }
    );
  }

  let parsed;
  try {
    parsed = inboundEmailSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_body", details: (err as Error).message },
      { status: 400 }
    );
  }

  const providedSecret =
    req.headers.get("x-inbound-email-secret") ?? parsed.secret ?? "";
  if (providedSecret !== configuredSecret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const fromEmail = parsed.fromEmail.toLowerCase();
  const text = parsed.text ?? htmlToPlainText(parsed.html ?? "");
  const html = parsed.html ?? textToBasicHtml(text);
  const provider = parsed.provider ?? "gmail";
  const match = await matchInboundEmail({
    provider,
    providerThreadId: parsed.providerThreadId,
    fromEmail,
  });

  try {
    const receive = await createEmailReceive({
      booking_request_id: match.bookingRequestId,
      provider,
      provider_thread_id: parsed.providerThreadId ?? null,
      provider_message_id: parsed.messageId ?? null,
      match_status: match.status,
      subject: parsed.subject,
      body_text: text,
      body_html: html,
      from_email: fromEmail,
      from_name: parsed.fromName ?? "",
      to_email: parsed.toEmail?.toLowerCase() ?? "",
      received_at: parsed.receivedAt,
      extra: parsed.extra ?? {},
    });

    return NextResponse.json({
      ok: true,
      id: receive.id,
      booking_request_id: receive.booking_request_id,
      match_status: receive.match_status,
    });
  } catch (err) {
    console.error("inbound email insert failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "insert_failed" },
      { status: 500 }
    );
  }
}

async function matchInboundEmail({
  provider,
  providerThreadId,
  fromEmail,
}: {
  provider: string;
  providerThreadId?: string;
  fromEmail: string;
}): Promise<{
  status: EmailReceive["match_status"];
  bookingRequestId: string | null;
}> {
  if (providerThreadId) {
    const threadMatch = await getMatchedEmailReceiveByProviderThread(
      provider,
      providerThreadId
    );
    if (threadMatch?.booking_request_id) {
      return {
        status: "matched",
        bookingRequestId: threadMatch.booking_request_id,
      };
    }
  }

  const openRequests = await getOpenBookingRequestsByGuestEmail(fromEmail, 2);
  if (openRequests.length === 1) {
    return { status: "matched", bookingRequestId: openRequests[0].id };
  }
  if (openRequests.length > 1) {
    return { status: "ambiguous", bookingRequestId: null };
  }
  return { status: "unmatched", bookingRequestId: null };
}

function textToBasicHtml(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => {
      const lines = paragraph
        .split("\n")
        .map((line) => escapeHtml(line))
        .join("<br />");
      return `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;">${lines}</p>`;
    })
    .join("\n");
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
