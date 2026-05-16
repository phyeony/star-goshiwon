import { NextResponse } from "next/server";
import { getEmailTemplates } from "@/lib/queries";
import { getAdminUserOrNull } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET() {
  const adminUser = await getAdminUserOrNull();
  if (!adminUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const templates = await getEmailTemplates();
    return NextResponse.json({ templates });
  } catch (err) {
    console.error("list email templates failed:", err);
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }
}
