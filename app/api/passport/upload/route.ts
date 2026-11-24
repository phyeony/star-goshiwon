import { NextRequest, NextResponse } from "next/server";
import { uploadPassportPhoto } from "@/lib/passport/service";

// Public: the guest's upload from /verify. The link token in the form proves
// which booking it belongs to. Errors carry no details about the booking.
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const file = form.get("photo");
  const result = await uploadPassportPhoto({
    requestId: String(form.get("r") ?? "") || undefined,
    token: String(form.get("t") ?? "") || undefined,
    consent: form.get("consent") === "yes",
    file: file instanceof Blob ? file : null,
  }).catch((e) => {
    console.error("passport upload failed", e);
    return null;
  });
  if (!result) return NextResponse.json({ error: "server_error" }, { status: 500 });
  if (!result.ok) {
    const status = result.error === "invalid_link" ? 404 : result.error === "link_closed" ? 410 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
