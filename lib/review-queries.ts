import { getSupabaseServiceClient } from "./supabase";
import { siteConfig } from "./site-data";
import type {
  Review,
  ReviewInsert,
  ReviewInvite,
  ReviewInviteInsert,
  ReviewStatus,
} from "./types";

// 32 hex chars of Web-Crypto randomness; fine on Cloudflare Workers.
export function generateReviewToken(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

export function reviewInviteUrl(token: string): string {
  return `${siteConfig.url}/review/${token}`;
}

export function isReviewInviteOpen(
  invite: ReviewInvite,
  now: Date = new Date()
): boolean {
  return !invite.used_at && new Date(invite.expires_at) > now;
}

export async function createReviewInvite(
  insert: ReviewInviteInsert
): Promise<ReviewInvite> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("review_invites")
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return data as ReviewInvite;
}

export async function getReviewInviteById(
  id: string
): Promise<ReviewInvite | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("review_invites")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as ReviewInvite) ?? null;
}

export async function getReviewInviteByToken(
  token: string
): Promise<ReviewInvite | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("review_invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  return (data as ReviewInvite) ?? null;
}

export async function getReviewInvites(): Promise<ReviewInvite[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("review_invites")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ReviewInvite[]) ?? [];
}

export async function markReviewInviteUsed(id: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("review_invites")
    .update({ used_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function createReview(insert: ReviewInsert): Promise<Review> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("reviews")
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return data as Review;
}

export async function getReviews(): Promise<Review[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data as Review[]) ?? [];
}

export async function getApprovedReviews(): Promise<Review[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("status", "approved")
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data as Review[]) ?? [];
}

export async function updateReviewStatus(
  id: string,
  status: ReviewStatus
): Promise<Review> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("reviews")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Review;
}
