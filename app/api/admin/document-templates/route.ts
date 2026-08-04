import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteDocumentTemplate,
  getDocumentTemplates,
  upsertDocumentTemplate,
} from "@/lib/documents/queries";
import {
  contractWordingWarnings,
  sanitizeTemplateHtml,
} from "@/lib/documents/templates";
import { getAdminUserOrNull } from "@/lib/supabase-server";

export const runtime = "nodejs";

const upsertSchema = z.object({
  type: z.enum(["letter", "contract"]),
  lang: z.enum(["ko", "en"]),
  title: z.string().trim().max(200).default(""),
  body_html: z.string().max(200_000),
  source_filename: z.string().trim().max(255).default(""),
});

const slotSchema = z.object({
  type: z.enum(["letter", "contract"]),
  lang: z.enum(["ko", "en"]),
});

export async function GET() {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ templates: await getDocumentTemplates() });
}

export async function PUT(req: NextRequest) {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = upsertSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_body", details: (err as Error).message },
      { status: 400 }
    );
  }

  const body_html = sanitizeTemplateHtml(parsed.body_html);
  // Advisory only — the owner decides whether to ship the wording.
  const warnings = contractWordingWarnings(
    parsed.type,
    parsed.title,
    body_html
  );

  const template = await upsertDocumentTemplate({
    type: parsed.type,
    lang: parsed.lang,
    title: parsed.title,
    body_html,
    source_filename: parsed.source_filename,
    updated_by_email: adminUser.email ?? "",
  });

  return NextResponse.json({ template, warnings });
}

export async function DELETE(req: NextRequest) {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let slot;
  try {
    slot = slotSchema.parse({
      type: searchParams.get("type"),
      lang: searchParams.get("lang"),
    });
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  await deleteDocumentTemplate(slot.type, slot.lang);
  return NextResponse.json({ ok: true });
}
