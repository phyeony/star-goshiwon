import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail, wrapEmailHtml, textToEmailHtml } from "@/lib/email";
import { createEmailSend } from "@/lib/queries";
import { approveAndCreatePaymentOrder } from "@/lib/payments";
import { substitute } from "@/lib/admin-email-templates";
import { getAdminUserOrNull } from "@/lib/supabase-server";

export const runtime = "nodejs";

const bodySchema = z.object({
  subject: z.string().trim().min(1).max(200),
  text: z.string().min(1).max(10_000),
  templateSlug: z.string().trim().min(1).max(64).optional(),
  templateLocale: z.enum(["en", "ko"]).optional(),
  regenerate: z.boolean().optional(),
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

  let approveResult;
  try {
    approveResult = await approveAndCreatePaymentOrder(id, {
      regenerate: parsed.regenerate === true,
    });
  } catch (err) {
    console.error("approve order failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "approve_failed" },
      { status: 500 }
    );
  }

  // Substitute any remaining {{payment_url}} placeholders the admin left in
  // the composed subject/body. The client substitutes on template load, but
  // re-running here is cheap and makes the route robust to clients that
  // skipped substitution.
  const vars = { payment_url: approveResult.paymentUrl };
  const subject = substitute(parsed.subject, vars);
  const text = substitute(parsed.text, vars);
  const html = wrapEmailHtml(textToEmailHtml(text));

  let sendError: string | null = null;
  try {
    await sendEmail(approveResult.request.guest_email, subject, text, html);
  } catch (err) {
    sendError = err instanceof Error ? err.message : "send_failed";
    console.error("approve-and-email send failed:", err);
  }

  try {
    await createEmailSend({
      booking_request_id: approveResult.request.id,
      kind: "approve_payment",
      template_slug: parsed.templateSlug ?? null,
      template_locale: parsed.templateLocale ?? null,
      subject,
      body_text: text,
      body_html: html,
      sent_by_email: adminUser.email ?? "",
      sent_to_email: approveResult.request.guest_email,
      send_status: sendError ? "failed" : "sent",
      send_error: sendError ?? "",
      extra: {
        payment_url: approveResult.paymentUrl,
        reused_order: approveResult.reused,
      },
    });
  } catch (err) {
    console.error("approve-and-email audit insert failed:", err);
  }

  if (sendError) {
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    payment_url: approveResult.paymentUrl,
    reused: approveResult.reused,
  });
}
