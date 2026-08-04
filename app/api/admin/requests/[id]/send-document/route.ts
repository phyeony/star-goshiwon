import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendDocumentEmail } from "@/lib/documents/send";
import { getAdminUserOrNull } from "@/lib/supabase-server";

export const runtime = "nodejs";

const formSchema = z.object({
  passportNumber: z.string().trim().max(64).default(""),
  nationality: z.string().trim().max(120).default(""),
  dateOfBirth: z.string().trim().max(32).default(""),
  homeAddress: z.string().trim().max(300).default(""),
  specialTerms: z.string().trim().max(2000).default(""),
  issueDate: z.string().trim().max(32).default(""),
});

const bodySchema = z.object({
  type: z.enum(["letter", "contract"]),
  lang: z.enum(["ko", "en"]),
  form: formSchema,
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
    // Deliberately no details in the response: the body carries passport data.
    console.error("send-document invalid body:", (err as Error).name);
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await sendDocumentEmail({
    requestId: id,
    type: parsed.type,
    lang: parsed.lang,
    form: parsed.form,
    sentByEmail: adminUser.email ?? "",
  });

  if (result.status === "not_found") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (result.status === "send_failed") {
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
