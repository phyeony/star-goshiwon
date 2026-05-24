import { getSupabaseServiceClient } from "./supabase";
import type {
  Room,
  RoomWithImages,
  RoomInsert,
  RoomUpdate,
  BookingRequest,
  BookingRequestInsert,
  BookingRequestUpdate,
  BookingRequestWithRoom,
  BookingStatus,
  PaymentOrder,
  PaymentOrderInsert,
  PaymentOrderUpdate,
  EmailTemplate,
  EmailTemplateInsert,
  EmailTemplateUpdate,
  EmailSend,
  EmailSendInsert,
  EmailReceive,
  EmailReceiveInsert,
} from "./types";

// ─── Rooms ───

export async function getRooms(): Promise<RoomWithImages[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*, room_images(*)")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data as RoomWithImages[]) ?? [];
}

export async function getPublicRooms(): Promise<RoomWithImages[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*, room_images(*)")
    .neq("status", "unavailable")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data as RoomWithImages[]) ?? [];
}

export async function getRoomBySlug(
  slug: string
): Promise<RoomWithImages | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*, room_images(*)")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as RoomWithImages;
}

export async function getRoomById(id: string): Promise<Room | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Room;
}

export async function createRoom(room: RoomInsert): Promise<Room> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("rooms")
    .insert(room)
    .select()
    .single();

  if (error) throw error;
  return data as Room;
}

export async function updateRoom(
  id: string,
  updates: RoomUpdate
): Promise<Room> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("rooms")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Room;
}

export async function deleteRoom(id: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("rooms").delete().eq("id", id);
  if (error) throw error;
}

// ─── Booking Requests ───

export async function getBookingRequests(filters?: {
  status?: BookingStatus;
  from?: string;
  to?: string;
}): Promise<BookingRequestWithRoom[]> {
  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("booking_requests")
    .select("*, rooms(name, slug)")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.from) {
    query = query.gte("created_at", filters.from);
  }
  if (filters?.to) {
    query = query.lte("created_at", filters.to);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as BookingRequestWithRoom[]) ?? [];
}

export async function getBookingRequestById(
  id: string
): Promise<BookingRequestWithRoom | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("booking_requests")
    .select("*, rooms(name, slug)")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as BookingRequestWithRoom;
}

export async function getLatestBookingRequestByGuestEmail(
  guestEmail: string
): Promise<BookingRequest | null> {
  const matches = await getOpenBookingRequestsByGuestEmail(guestEmail, 1);
  return matches[0] ?? null;
}

export async function getOpenBookingRequestsByGuestEmail(
  guestEmail: string,
  limit = 10
): Promise<BookingRequest[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("booking_requests")
    .select("*")
    .ilike("guest_email", guestEmail.trim().toLowerCase())
    .not("status", "in", "(closed,declined,expired)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as BookingRequest[]) ?? [];
}

export async function getBookingRequestByPaymentOrderId(
  orderId: string
): Promise<BookingRequestWithRoom | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("booking_requests")
    .select("*, rooms(name, slug)")
    .eq("payment_order_id", orderId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as BookingRequestWithRoom;
}

export async function createBookingRequest(
  request: BookingRequestInsert
): Promise<BookingRequest> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("booking_requests")
    .insert(request)
    .select()
    .single();

  if (error) throw error;
  return data as BookingRequest;
}

export async function updateBookingRequest(
  id: string,
  updates: BookingRequestUpdate
): Promise<BookingRequest> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("booking_requests")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as BookingRequest;
}

// ─── Payment Orders ───

export async function createPaymentOrder(
  insert: PaymentOrderInsert
): Promise<PaymentOrder> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("payment_orders")
    .insert(insert)
    .select()
    .single();

  if (error) throw error;
  return data as PaymentOrder;
}

export async function getPaymentOrderByProviderOrderId(
  providerOrderId: string
): Promise<PaymentOrder | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("provider_order_id", providerOrderId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as PaymentOrder;
}

export async function getActivePaymentOrderForRequest(
  bookingRequestId: string
): Promise<PaymentOrder | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("booking_request_id", bookingRequestId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as PaymentOrder | null;
}

export async function updatePaymentOrder(
  id: string,
  updates: PaymentOrderUpdate
): Promise<PaymentOrder> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("payment_orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as PaymentOrder;
}

export async function updatePaymentOrderByProviderOrderId(
  providerOrderId: string,
  updates: PaymentOrderUpdate
): Promise<PaymentOrder | null> {
  const existing = await getPaymentOrderByProviderOrderId(providerOrderId);
  if (!existing) return null;
  return updatePaymentOrder(existing.id, updates);
}

export async function supersedeActivePaymentOrders(
  bookingRequestId: string
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("payment_orders")
    .update({ is_active: false, status: "superseded" })
    .eq("booking_request_id", bookingRequestId)
    .eq("is_active", true)
    .in("status", ["created", "approved"]);

  if (error) throw error;
}

// ─── Email Templates ───

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as EmailTemplate[]) ?? [];
}

export async function getEmailTemplateById(
  id: string
): Promise<EmailTemplate | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as EmailTemplate;
}

export async function getEmailTemplateBySlug(
  slug: string
): Promise<EmailTemplate | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as EmailTemplate;
}

export async function createEmailTemplate(
  insert: EmailTemplateInsert
): Promise<EmailTemplate> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("email_templates")
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return data as EmailTemplate;
}

export async function updateEmailTemplate(
  id: string,
  updates: EmailTemplateUpdate
): Promise<EmailTemplate> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("email_templates")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as EmailTemplate;
}

export async function deleteEmailTemplate(id: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("email_templates").delete().eq("id", id);
  if (error) throw error;
}

// ─── Email Sends (per-send audit log) ───

export async function createEmailSend(
  insert: EmailSendInsert
): Promise<EmailSend> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("email_sends")
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return data as EmailSend;
}

export async function getEmailSendsForRequest(
  bookingRequestId: string
): Promise<EmailSend[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("email_sends")
    .select("*")
    .eq("booking_request_id", bookingRequestId)
    .order("sent_at", { ascending: false });
  if (error) throw error;
  return (data as EmailSend[]) ?? [];
}

export async function createEmailReceive(
  insert: EmailReceiveInsert
): Promise<EmailReceive> {
  const supabase = getSupabaseServiceClient();
  const query = insert.provider_message_id
    ? supabase
        .from("email_receives")
        .upsert(insert, { onConflict: "provider_message_id" })
    : supabase.from("email_receives").insert(insert);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data as EmailReceive;
}

export async function getMatchedEmailReceiveByProviderThread(
  provider: string,
  providerThreadId: string
): Promise<EmailReceive | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("email_receives")
    .select("*")
    .eq("provider", provider)
    .eq("provider_thread_id", providerThreadId)
    .not("booking_request_id", "is", null)
    .order("received_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as EmailReceive) ?? null;
}

export async function getEmailReceiveById(
  id: string
): Promise<EmailReceive | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("email_receives")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as EmailReceive) ?? null;
}

export async function getEmailReceivesForProviderThread(
  provider: string,
  providerThreadId: string
): Promise<EmailReceive[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("email_receives")
    .select("*")
    .eq("provider", provider)
    .eq("provider_thread_id", providerThreadId)
    .order("received_at", { ascending: true });

  if (error) throw error;
  return (data as EmailReceive[]) ?? [];
}

export async function getEmailReceivesForRequest(
  bookingRequestId: string,
  guestEmail: string
): Promise<EmailReceive[]> {
  const supabase = getSupabaseServiceClient();
  const normalizedEmail = guestEmail.trim().toLowerCase();
  const { data, error } = await supabase
    .from("email_receives")
    .select("*")
    .or(
      `booking_request_id.eq.${bookingRequestId},from_email.ilike.${normalizedEmail}`
    )
    .order("received_at", { ascending: false });
  if (error) throw error;
  return (data as EmailReceive[]) ?? [];
}

export async function getEmailReceives(filters?: {
  matchStatus?: EmailReceive["match_status"];
  limit?: number;
}): Promise<EmailReceive[]> {
  const supabase = getSupabaseServiceClient();
  let query = supabase
    .from("email_receives")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(filters?.limit ?? 100);

  if (filters?.matchStatus) {
    query = query.eq("match_status", filters.matchStatus);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as EmailReceive[]) ?? [];
}

// ─── Stats ───

export async function getAdminStats() {
  const supabase = getSupabaseServiceClient();
  const { count: totalRequests } = await supabase
    .from("booking_requests")
    .select("*", { count: "exact", head: true });

  const { count: newRequests } = await supabase
    .from("booking_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

  const { count: totalRooms } = await supabase
    .from("rooms")
    .select("*", { count: "exact", head: true });

  const { count: availableRooms } = await supabase
    .from("rooms")
    .select("*", { count: "exact", head: true })
    .eq("status", "available");

  return {
    totalRequests: totalRequests ?? 0,
    newRequests: newRequests ?? 0,
    totalRooms: totalRooms ?? 0,
    availableRooms: availableRooms ?? 0,
  };
}
