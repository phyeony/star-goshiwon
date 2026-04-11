import { NextResponse } from "next/server";

export function middleware() {
  return new NextResponse("Not Found", { status: 404 });
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
