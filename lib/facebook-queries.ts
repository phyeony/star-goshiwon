import { getSupabaseServiceClient } from "./supabase";
import type { FacebookGroup, FacebookPost, FacebookPostLogEntry } from "./facebook-posts";

export async function listFacebookGroups(): Promise<FacebookGroup[]> {
  const { data, error } = await getSupabaseServiceClient()
    .from("facebook_groups")
    .select("*")
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return (data as FacebookGroup[]) ?? [];
}

export async function listFacebookPosts(): Promise<FacebookPost[]> {
  const { data, error } = await getSupabaseServiceClient()
    .from("facebook_posts")
    .select("*")
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return (data as FacebookPost[]) ?? [];
}

/** The last 52 weeks of posting history; older rows are not shown anywhere. */
export async function listFacebookPostLog(): Promise<FacebookPostLogEntry[]> {
  const since = new Date(Date.now() - 365 * 86_400_000).toISOString();
  const { data, error } = await getSupabaseServiceClient()
    .from("facebook_post_log")
    .select("*")
    .gte("posted_at", since)
    .order("posted_at", { ascending: false });
  if (error) throw error;
  return (data as FacebookPostLogEntry[]) ?? [];
}
