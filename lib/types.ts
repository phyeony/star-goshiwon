export type RoomStatus = "available" | "available_soon" | "limited" | "unavailable";

export type BookingStatus =
  | "new"
  | "reviewing"
  | "contacted"
  | "approved"
  | "declined"
  | "expired"
  | "closed";

export interface Room {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_weekly: number;
  price_daily: number;
  capacity: number;
  size_sqm: number | null;
  amenities: string[];
  status: RoomStatus;
  available_from: string | null;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RoomImage {
  id: string;
  room_id: string;
  url: string;
  alt: string;
  sort_order: number;
  created_at: string;
}

export interface RoomWithImages extends Room {
  room_images: RoomImage[];
}

export interface BookingRequest {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_count: number;
  room_id: string | null;
  room_slug: string;
  check_in_date: string;
  check_out_date: string;
  // USD (PayPal settles in USD). Existing rows pre-cutover may contain KRW.
  estimated_total: number;
  bedding_prepaid: boolean;
  notes: string;
  status: BookingStatus;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface BookingRequestWithRoom extends BookingRequest {
  rooms: Pick<Room, "name" | "slug"> | null;
}

// Supabase generated types (simplified for V1)
export type RoomInsert = {
  name: string;
  slug: string;
  description?: string;
  price_monthly: number;
  price_weekly: number;
  price_daily: number;
  capacity?: number;
  size_sqm?: number | null;
  amenities?: string[];
  status?: RoomStatus;
  available_from?: string | null;
  featured?: boolean;
  sort_order?: number;
};

export type RoomUpdate = Partial<RoomInsert>;

export type RoomImageInsert = {
  room_id: string;
  url: string;
  alt?: string;
  sort_order?: number;
};

export type BookingRequestInsert = {
  guest_name: string;
  guest_email: string;
  guest_count?: number;
  room_id?: string | null;
  room_slug: string;
  check_in_date: string;
  check_out_date: string;
  estimated_total?: number;
  bedding_prepaid?: boolean;
  notes?: string;
  status?: BookingStatus;
  admin_notes?: string;
};

export type BookingRequestUpdate = Partial<Pick<BookingRequest, "status" | "admin_notes">>;

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: Room;
        Insert: RoomInsert;
        Update: RoomUpdate;
      };
      room_images: {
        Row: RoomImage;
        Insert: RoomImageInsert;
        Update: Partial<RoomImageInsert>;
      };
      booking_requests: {
        Row: BookingRequest;
        Insert: BookingRequestInsert;
        Update: BookingRequestUpdate;
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      room_status: RoomStatus;
      booking_status: BookingStatus;
    };
  };
}

// Status display helpers
export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  available: "Available Now",
  available_soon: "Available Soon",
  limited: "Limited Availability",
  unavailable: "Unavailable",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  contacted: "Contacted",
  approved: "Approved",
  declined: "Declined",
  expired: "Expired",
  closed: "Closed",
};
