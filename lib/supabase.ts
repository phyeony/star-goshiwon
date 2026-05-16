import { createClient } from "@supabase/supabase-js";

type SupabaseServiceClient = ReturnType<typeof createClient<any, "public">>;

let serviceRoleClient: SupabaseServiceClient | null = null;

export function getSupabaseServiceClient() {
  if (serviceRoleClient) return serviceRoleClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for Supabase service access"
    );
  }

  serviceRoleClient = createClient<any, "public">(supabaseUrl, supabaseKey);
  return serviceRoleClient;
}
