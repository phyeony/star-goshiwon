import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isAdminEmail } from "./admin-auth";

function getEnv() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be set for SSR auth"
    );
  }
  return { url, anonKey };
}

export async function createSupabaseServerClient() {
  const { url, anonKey } = getEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `cookies().set` throws inside Server Components. The middleware
          // refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

export async function getAdminUserOrNull() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !isAdminEmail(user.email)) return null;
    return user;
  } catch {
    // Env not configured, or auth network failure — treat as logged out so
    // pages like /login can still render and show their setup messaging.
    return null;
  }
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}
