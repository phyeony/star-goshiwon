import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminEmail } from "@/lib/admin-auth";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isApi = pathname.startsWith("/api/admin");

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return isApi
      ? NextResponse.json({ error: "auth_not_configured" }, { status: 500 })
      : NextResponse.redirect(new URL("/login?error=exchange_failed", req.url));
  }

  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          req.cookies.set(name, value);
        }
        response = NextResponse.next({ request: req });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    if (isApi) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname + (search || ""));
    const redirect = NextResponse.redirect(loginUrl);
    // Preserve any refreshed cookies on the redirect response.
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie.name, cookie.value, cookie);
    }
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
