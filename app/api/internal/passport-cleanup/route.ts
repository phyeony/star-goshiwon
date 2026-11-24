import { NextRequest, NextResponse } from "next/server";
import { cleanupPassportPhotos } from "@/lib/passport/service";
import { isInternalCall } from "@/lib/whatsapp/runtime";

// Called once a day by the cron trigger in worker.ts (through the worker's own
// service binding), never by the public. Deletes passport photos whose
// request reached its check-out day, or ended 7+ days ago.
export async function POST(req: NextRequest) {
  if (!isInternalCall(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const result = await cleanupPassportPhotos();
  console.log("passport cleanup", JSON.stringify(result));
  return NextResponse.json(result);
}
