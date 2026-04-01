import { createClient } from "@supabase/supabase-js";

type BookingInsert = {
  check_in: string;
  check_out: string;
  email: string;
  estimated_total: number;
  guests: number;
  message: string;
  name: string;
  nights: number;
  pricing_basis: string;
  room_name: string;
  room_slug: string;
  status: string;
};

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function insertBookingRequest(payload: BookingInsert) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before submitting booking requests."
    );
  }

  const { error } = await supabase.from("booking_requests").insert(payload);

  if (error) {
    throw new Error(error.message);
  }
}
