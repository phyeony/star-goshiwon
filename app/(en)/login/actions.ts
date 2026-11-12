"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export interface SignInResult {
  ok: boolean;
  error?: string;
}

const LOGIN_NEXT_COOKIE = "admin_login_next";

function normalizeNext(next?: string | null): string {
  if (!next) return "/admin";
  if (!next.startsWith("/") || next.startsWith("//")) return "/admin";
  return next;
}

async function rememberNext(next?: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(LOGIN_NEXT_COOKIE, normalizeNext(next), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/auth/callback",
    maxAge: 10 * 60,
  });
}

function buildCallbackUrl(): string | null {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!siteUrl) return null;

  return `${siteUrl}/auth/callback`;
}

export async function signInWithGoogle(next?: string): Promise<void> {
  const redirectTo = buildCallbackUrl();

  if (!redirectTo) {
    redirect(
      `/login?error=missing_site_url${
        next ? `&next=${encodeURIComponent(next)}` : ""
      }`,
    );
  }

  await rememberNext(next);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data?.url) {
    redirect(
      `/login?error=oauth_failed${
        next ? `&next=${encodeURIComponent(next)}` : ""
      }`,
    );
  }
  redirect(data.url);
}

export async function signInWithEmail(
  email: string,
  next?: string,
): Promise<SignInResult> {
  const trimmed = email.trim();
  if (!trimmed || !trimmed.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const emailRedirectTo = buildCallbackUrl();
  if (!emailRedirectTo) {
    return { ok: false, error: "NEXT_PUBLIC_SITE_URL is not configured." };
  }

  await rememberNext(next);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: {
      emailRedirectTo,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
