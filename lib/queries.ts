import { supabase } from "./supabase";
import type {
  Room,
  RoomWithImages,
  RoomInsert,
  RoomUpdate,
  BookingRequest,
  BookingRequestInsert,
  BookingRequestWithRoom,
  BookingStatus,
} from "./types";

// ─── Rooms ───

export async function getRooms(): Promise<RoomWithImages[]> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*, room_images(*)")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data as RoomWithImages[]) ?? [];
}

export async function getPublicRooms(): Promise<RoomWithImages[]> {
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
  const { error } = await supabase.from("rooms").delete().eq("id", id);
  if (error) throw error;
}

// ─── Booking Requests ───

export async function getBookingRequests(filters?: {
  status?: BookingStatus;
  from?: string;
  to?: string;
}): Promise<BookingRequestWithRoom[]> {
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

export async function createBookingRequest(
  request: BookingRequestInsert
): Promise<BookingRequest> {
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
  updates: Partial<Pick<BookingRequest, "status" | "admin_notes">>
): Promise<BookingRequest> {
  const { data, error } = await supabase
    .from("booking_requests")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as BookingRequest;
}

// ─── Stats ───

export async function getAdminStats() {
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
