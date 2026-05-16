import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminEmail } from "@/lib/admin-auth";

export const runtime = "nodejs";

const LOGIN_NEXT_COOKIE = "admin_login_next";

function normalizeNext(next?: string | null): string {
  if (!next) return "/admin";
  if (!next.startsWith("/") || next.startsWith("//")) return "/admin";
  return next;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = normalizeNext(
    url.searchParams.get("next") ?? req.cookies.get(LOGIN_NEXT_COOKIE)?.value
  );

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=exchange_failed", url.origin)
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.redirect(
      new URL("/login?error=exchange_failed", url.origin)
    );
  }

  // Bind the supabase client to a response we control so the session
  // cookies set during exchangeCodeForSession reliably ride the redirect.
  let response = NextResponse.redirect(new URL(next, url.origin));
  response.cookies.delete(LOGIN_NEXT_COOKIE);
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(
      new URL("/login?error=exchange_failed", url.origin)
    );
  }

  if (!isAdminEmail(data.session.user.email)) {
    // signOut writes clearing cookies into `response` via setAll, but we
    // want to redirect to the login page, so swap the redirect target.
    response = NextResponse.redirect(
      new URL("/login?error=forbidden", url.origin)
    );
    const supabaseSignOut = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });
    await supabaseSignOut.auth.signOut();
    return response;
  }

  return response;
}
