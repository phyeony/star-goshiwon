import { NextRequest, NextResponse } from "next/server";
import { convertDocxToHtml } from "@/lib/documents/docx";
import { getAdminUserOrNull } from "@/lib/supabase-server";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Converts an uploaded .docx to template HTML and returns it for review.
 * Nothing is saved here — the admin previews the result and then saves via
 * PUT /api/admin/document-templates. The uploaded binary is never stored.
 */
export async function POST(req: NextRequest) {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let file: File | null = null;
  try {
    const formData = await req.formData();
    const value = formData.get("file");
    if (value instanceof File) file = value;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".docx")) {
    return NextResponse.json({ error: "docx_required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }

  try {
    const { html, warnings } = await convertDocxToHtml(await file.arrayBuffer());
    return NextResponse.json({
      html,
      warnings,
      source_filename: file.name,
    });
  } catch (err) {
    console.error("docx conversion failed:", (err as Error).message);
    return NextResponse.json({ error: "conversion_failed" }, { status: 500 });
  }
}
