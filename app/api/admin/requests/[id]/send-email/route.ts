import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail, wrapEmailHtml, textToEmailHtml } from "@/lib/email";
import {
  createEmailSend,
  getBookingRequestById,
} from "@/lib/queries";
import { getAdminUserOrNull } from "@/lib/supabase-server";

export const runtime = "nodejs";

const bodySchema = z.object({
  subject: z.string().trim().min(1).max(200),
  text: z.string().min(1).max(10_000),
  templateSlug: z.string().trim().min(1).max(64).optional(),
  templateLocale: z.enum(["en", "ko"]).optional(),
});

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, ctx: Context) {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  let parsed;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_body", details: (err as Error).message },
      { status: 400 }
    );
  }

  const request = await getBookingRequestById(id);
  if (!request) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const html = wrapEmailHtml(textToEmailHtml(parsed.text));

  let sendError: string | null = null;
  try {
    await sendEmail(request.guest_email, parsed.subject, parsed.text, html);
  } catch (err) {
    sendError = err instanceof Error ? err.message : "send_failed";
    console.error("send-email failed:", err);
  }

  try {
    await createEmailSend({
      booking_request_id: request.id,
      kind: "send",
      template_slug: parsed.templateSlug ?? null,
      template_locale: parsed.templateLocale ?? null,
      subject: parsed.subject,
      body_text: parsed.text,
      body_html: html,
      sent_by_email: adminUser.email ?? "",
      sent_to_email: request.guest_email,
      send_status: sendError ? "failed" : "sent",
      send_error: sendError ?? "",
    });
  } catch (err) {
    console.error("send-email audit insert failed:", err);
  }

  if (sendError) {
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
