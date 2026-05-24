import { NextResponse } from "next/server";
import { clearTestEmails, getTestEmails } from "@/lib/test-email-outbox";

export const dynamic = "force-dynamic";

function notFound() {
  return NextResponse.json({ error: "not_found" }, { status: 404 });
}

export async function GET() {
  if (process.env.E2E_TEST_MODE !== "true") return notFound();
  return NextResponse.json({ emails: getTestEmails() });
}

export async function DELETE() {
  if (process.env.E2E_TEST_MODE !== "true") return notFound();
  clearTestEmails();
  return NextResponse.json({ ok: true });
}
