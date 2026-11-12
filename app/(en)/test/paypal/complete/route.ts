import { NextRequest, NextResponse } from "next/server";
import { approveFakePayPalOrder } from "@/lib/paypal";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (process.env.E2E_TEST_MODE !== "true") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const token = req.nextUrl.searchParams.get("token");
  const returnUrl = req.nextUrl.searchParams.get("return_url");
  if (!token || !returnUrl) {
    return NextResponse.json({ error: "invalid_fake_paypal_request" }, { status: 400 });
  }

  approveFakePayPalOrder(token);

  const redirectUrl = new URL(returnUrl);
  redirectUrl.searchParams.set("token", token);
  return NextResponse.redirect(redirectUrl);
}
