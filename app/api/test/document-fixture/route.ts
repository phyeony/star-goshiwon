import { NextRequest, NextResponse } from "next/server";
import { createBookingRequest, getRoomBySlug } from "@/lib/queries";
import { calculateEstimate, roomTier } from "@/lib/pricing";
import { sendDocumentEmail } from "@/lib/documents/send";
import {
  deleteDocumentTemplate,
  upsertDocumentTemplate,
} from "@/lib/documents/queries";
import { sanitizeTemplateHtml } from "@/lib/documents/templates";
import { EMPTY_DOCUMENT_FORM } from "@/lib/documents/types";

export const dynamic = "force-dynamic";

// E2E-only shortcut. The admin routes are middleware-guarded and Playwright
// cannot complete a Supabase magic-link login, so the tests drive the same
// sendDocumentEmail() / template queries directly. 404s outside the harness.
export async function POST(req: NextRequest) {
  if (process.env.E2E_TEST_MODE !== "true") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      requestId?: string;
      type?: "letter" | "contract";
      lang?: "ko" | "en";
      form?: Record<string, string>;
      title?: string;
      bodyHtml?: string;
    };

    if (body.action === "create-booking") {
      const roomSlug = "room-with-private-shower";
      const room = await getRoomBySlug(roomSlug);
      if (!room) throw new Error(`Fixture room not found: ${roomSlug}`);

      const checkIn = "2026-06-01";
      const checkOut = "2026-07-01";
      const estimate = calculateEstimate(roomTier(room), checkIn, checkOut, {
        beddingPrepaid: true,
      });
      const guestEmail = `playwright-doc-${Date.now()}@example.com`;

      const booking = await createBookingRequest({
        guest_name: "Playwright Document Guest",
        guest_email: guestEmail,
        guest_count: 1,
        room_id: room.id,
        room_slug: roomSlug,
        check_in_date: checkIn,
        check_out_date: checkOut,
        estimated_total: estimate.total,
        bedding_prepaid: true,
        notes: "E2E document fixture",
        status: "confirmed",
        payment_status: "paid",
      });

      return NextResponse.json({ id: booking.id, guestEmail });
    }

    if (body.action === "send") {
      if (!body.requestId) {
        return NextResponse.json(
          { error: "requestId required" },
          { status: 400 }
        );
      }
      const result = await sendDocumentEmail({
        requestId: body.requestId,
        type: body.type ?? "letter",
        lang: body.lang ?? "ko",
        form: { ...EMPTY_DOCUMENT_FORM, ...(body.form ?? {}) },
        sentByEmail: "playwright-admin@example.com",
      });
      return NextResponse.json(result);
    }

    if (body.action === "set-template") {
      const template = await upsertDocumentTemplate({
        type: body.type ?? "contract",
        lang: body.lang ?? "ko",
        title: body.title ?? "",
        body_html: sanitizeTemplateHtml(body.bodyHtml ?? ""),
        source_filename: "playwright.docx",
        updated_by_email: "playwright-admin@example.com",
      });
      return NextResponse.json({ id: template.id });
    }

    if (body.action === "clear-template") {
      await deleteDocumentTemplate(
        body.type ?? "contract",
        body.lang ?? "ko"
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "fixture_failed" },
      { status: 500 }
    );
  }
}
