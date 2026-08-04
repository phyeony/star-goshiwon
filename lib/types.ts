export type RoomStatus = "available" | "available_soon" | "limited" | "unavailable";

export type BookingStatus =
  | "new"
  | "reviewing"
  | "contacted"
  | "approved"
  | "confirmed"
  | "declined"
  | "expired"
  | "closed";

export type PaymentStatus =
  | "none"
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "refunded";

export type PaymentOrderStatus =
  | "created"
  | "approved"
  | "paid"
  | "failed"
  | "expired"
  | "superseded"
  | "duplicate_paid";

export type RoomUnitStatus = "active" | "inactive" | "maintenance";

export type RoomUnitBlockSource = "direct" | "external";

export type RoomUnitBlockStatus = "tentative" | "confirmed" | "cancelled";

export interface Room {
  id: string;
  name: string;
  name_ko?: string | null;
  slug: string;
  description: string;
  nightly_rate_usd: number; // flat per-night rate in USD (source of truth)
  long_stay_discount: number; // discount fraction at 28+ nights, e.g. 0.15
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
  assigned_room_unit_id: string | null;
  room_slug: string;
  check_in_date: string;
  check_out_date: string;
  // USD (PayPal settles in USD). Existing rows pre-cutover may contain KRW.
  estimated_total: number;
  bedding_prepaid: boolean;
  payment_status: PaymentStatus;
  payment_provider: string | null;
  payment_order_id: string | null;
  payment_capture_id: string | null;
  payment_approval_url: string | null;
  payment_amount: number | null;
  payment_currency: string | null;
  payment_created_at: string | null;
  payment_paid_at: string | null;
  payment_expires_at: string | null;
  payment_token_hash: string | null;
  payment_token_created_at: string | null;
  payment_error: string;
  refund_amount: number;
  refunded_at: string | null;
  refund_id: string | null;
  notes: string;
  status: BookingStatus;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface BookingRequestWithRoom extends BookingRequest {
  rooms: Pick<
    Room,
    "name" | "name_ko" | "slug" | "nightly_rate_usd" | "long_stay_discount"
  > | null;
  room_units?: Pick<RoomUnit, "name"> | null;
}

export interface RoomUnit {
  id: string;
  room_id: string;
  name: string;
  status: RoomUnitStatus;
  notes: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RoomUnitWithRoom extends RoomUnit {
  rooms: Pick<Room, "name" | "name_ko" | "slug"> | null;
}

export interface RoomUnitBlock {
  id: string;
  room_unit_id: string;
  booking_request_id: string | null;
  source: RoomUnitBlockSource;
  status: RoomUnitBlockStatus;
  guest_name: string;
  check_in_date: string;
  check_out_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface RoomUnitWithBlocks extends RoomUnit {
  room_unit_blocks: RoomUnitBlock[];
}

export type RoomUnitInsert = {
  room_id: string;
  name: string;
  status?: RoomUnitStatus;
  notes?: string;
  sort_order?: number;
};

export type RoomUnitUpdate = Partial<RoomUnitInsert>;

export type RoomUnitBlockInsert = {
  room_unit_id: string;
  booking_request_id?: string | null;
  source?: RoomUnitBlockSource;
  status?: RoomUnitBlockStatus;
  guest_name?: string;
  check_in_date: string;
  check_out_date: string;
  notes?: string;
};

export type RoomUnitBlockUpdate = Partial<
  Pick<
    RoomUnitBlock,
    | "room_unit_id"
    | "booking_request_id"
    | "source"
    | "status"
    | "guest_name"
    | "check_in_date"
    | "check_out_date"
    | "notes"
  >
>;

export interface PaymentOrder {
  id: string;
  booking_request_id: string;
  provider: string;
  provider_order_id: string;
  status: PaymentOrderStatus;
  approval_url: string;
  amount: number;
  currency: string;
  capture_id: string | null;
  is_active: boolean;
  requires_refund: boolean;
  raw_status: string;
  error: string;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
}

export type PaymentOrderInsert = {
  booking_request_id: string;
  provider?: string;
  provider_order_id: string;
  status?: PaymentOrderStatus;
  approval_url: string;
  amount: number;
  currency?: string;
  capture_id?: string | null;
  is_active?: boolean;
  requires_refund?: boolean;
  raw_status?: string;
  error?: string;
  paid_at?: string | null;
};

export type PaymentOrderUpdate = Partial<
  Pick<
    PaymentOrder,
    | "status"
    | "approval_url"
    | "amount"
    | "currency"
    | "capture_id"
    | "is_active"
    | "requires_refund"
    | "raw_status"
    | "error"
    | "paid_at"
  >
>;

export interface EmailTemplate {
  id: string;
  slug: string;
  label: string;
  description: string;
  subject: string;
  body: string;
  subject_ko: string;
  body_ko: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type EmailTemplateInsert = {
  slug: string;
  label: string;
  description?: string;
  subject: string;
  body: string;
  subject_ko?: string;
  body_ko?: string;
  sort_order?: number;
};

export type EmailTemplateUpdate = Partial<EmailTemplateInsert>;

export interface EmailSend {
  id: string;
  booking_request_id: string;
  kind: string;
  template_slug: string | null;
  template_locale: string | null;
  subject: string;
  body_text: string;
  body_html: string;
  sent_by_email: string;
  sent_to_email: string;
  sent_at: string;
  send_status: string;
  send_error: string;
  extra: Record<string, unknown>;
}

export type EmailSendInsert = {
  booking_request_id: string;
  kind?: string;
  template_slug?: string | null;
  template_locale?: string | null;
  subject: string;
  body_text: string;
  body_html: string;
  sent_by_email?: string;
  sent_to_email: string;
  sent_at?: string;
  send_status?: string;
  send_error?: string;
  extra?: Record<string, unknown>;
};

export interface EmailReceive {
  id: string;
  booking_request_id: string | null;
  provider: string;
  provider_thread_id: string | null;
  provider_message_id: string | null;
  match_status: "matched" | "unmatched" | "ambiguous" | "ignored";
  subject: string;
  body_text: string;
  body_html: string;
  from_email: string;
  from_name: string;
  to_email: string;
  received_at: string;
  extra: Record<string, unknown>;
  created_at: string;
}

export type EmailReceiveInsert = {
  booking_request_id?: string | null;
  provider?: string;
  provider_thread_id?: string | null;
  provider_message_id?: string | null;
  match_status?: "matched" | "unmatched" | "ambiguous" | "ignored";
  subject: string;
  body_text: string;
  body_html: string;
  from_email: string;
  from_name?: string;
  to_email?: string;
  received_at?: string;
  extra?: Record<string, unknown>;
};

// Supabase generated types (simplified for V1)
export type RoomInsert = {
  name: string;
  name_ko?: string | null;
  slug: string;
  description?: string;
  nightly_rate_usd: number;
  long_stay_discount?: number;
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
  assigned_room_unit_id?: string | null;
  room_slug: string;
  check_in_date: string;
  check_out_date: string;
  estimated_total?: number;
  bedding_prepaid?: boolean;
  payment_status?: PaymentStatus;
  payment_provider?: string | null;
  payment_order_id?: string | null;
  payment_capture_id?: string | null;
  payment_approval_url?: string | null;
  payment_amount?: number | null;
  payment_currency?: string | null;
  payment_created_at?: string | null;
  payment_paid_at?: string | null;
  payment_expires_at?: string | null;
  payment_token_hash?: string | null;
  payment_token_created_at?: string | null;
  payment_error?: string;
  notes?: string;
  status?: BookingStatus;
  admin_notes?: string;
};

export type BookingRequestUpdate = Partial<
  Pick<
    BookingRequest,
    | "assigned_room_unit_id"
    | "status"
    | "admin_notes"
    | "estimated_total"
    | "payment_status"
    | "payment_provider"
    | "payment_order_id"
    | "payment_capture_id"
    | "payment_approval_url"
    | "payment_amount"
    | "payment_currency"
    | "payment_created_at"
    | "payment_paid_at"
    | "payment_expires_at"
    | "payment_token_hash"
    | "payment_token_created_at"
    | "payment_error"
    | "refund_amount"
    | "refunded_at"
    | "refund_id"
  >
>;

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
      room_units: {
        Row: RoomUnit;
        Insert: RoomUnitInsert;
        Update: RoomUnitUpdate;
      };
      room_unit_blocks: {
        Row: RoomUnitBlock;
        Insert: RoomUnitBlockInsert;
        Update: RoomUnitBlockUpdate;
      };
      payment_orders: {
        Row: PaymentOrder;
        Insert: PaymentOrderInsert;
        Update: PaymentOrderUpdate;
      };
      email_templates: {
        Row: EmailTemplate;
        Insert: EmailTemplateInsert;
        Update: EmailTemplateUpdate;
      };
      email_sends: {
        Row: EmailSend;
        Insert: EmailSendInsert;
        Update: Partial<EmailSendInsert>;
      };
      email_receives: {
        Row: EmailReceive;
        Insert: EmailReceiveInsert;
        Update: Partial<EmailReceiveInsert>;
      };
      document_templates: {
        Row: DocumentTemplate;
        Insert: DocumentTemplateUpsert;
        Update: Partial<DocumentTemplateUpsert>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      room_status: RoomStatus;
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
    };
  };
}

// Status display helpers — public site shows English (guests are foreigners).
// The KO variants are for the admin UI only.

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  available: "Available Now",
  available_soon: "Available Soon",
  limited: "Limited Availability",
  unavailable: "Unavailable",
};

export const ROOM_STATUS_LABELS_KO: Record<RoomStatus, string> = {
  available: "예약 가능",
  available_soon: "곧 예약 가능",
  limited: "잔여 객실 적음",
  unavailable: "예약 불가",
};

// Admin-only — BookingStatusBadge and admin pages reference this directly,
// so it can be Korean without leaking to guest-facing UI.
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  new: "신규",
  reviewing: "검토 중",
  contacted: "연락 완료",
  approved: "승인됨",
  confirmed: "확정됨",
  declined: "거절됨",
  expired: "만료됨",
  closed: "종료됨",
};

export const PAYMENT_STATUS_LABELS_KO: Record<PaymentStatus, string> = {
  none: "결제 없음",
  pending: "결제 대기",
  paid: "결제 완료",
  failed: "결제 실패",
  expired: "만료됨",
  refunded: "환불됨",
};

// ─── Guest Reviews ───

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ReviewCategoryScoreRow {
  label: string;
  score: number;
}

export interface ReviewInvite {
  id: string;
  token: string;
  guest_name: string;
  guest_email: string | null;
  room_type: string;
  booking_request_id: string | null;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}

export interface ReviewInviteInsert {
  token: string;
  guest_name: string;
  guest_email?: string | null;
  room_type: string;
  booking_request_id?: string | null;
}

export interface Review {
  id: string;
  invite_id: string;
  guest_name: string;
  country: string | null;
  room_type: string;
  score: number;
  title: string | null;
  positive: string | null;
  negative: string | null;
  basic_categories: ReviewCategoryScoreRow[];
  additional_categories: ReviewCategoryScoreRow[];
  status: ReviewStatus;
  submitted_at: string;
  reviewed_at: string | null;
}

// ─── Guest Residence Documents ───

/** Admin-editable override for a built-in document. No row = built-in renders. */
export interface DocumentTemplate {
  id: string;
  type: "letter" | "contract";
  lang: "ko" | "en";
  title: string;
  /** Document body HTML with {{token}} placeholders. Sanitized at save time. */
  body_html: string;
  /** Provenance only, e.g. "계약서_2026.docx". The file itself is not stored. */
  source_filename: string;
  updated_at: string;
  updated_by_email: string;
}

export interface DocumentTemplateUpsert {
  type: "letter" | "contract";
  lang: "ko" | "en";
  title: string;
  body_html: string;
  source_filename?: string;
  updated_by_email?: string;
}

export interface ReviewInsert {
  invite_id: string;
  guest_name: string;
  country: string | null;
  room_type: string;
  score: number;
  title: string | null;
  positive: string | null;
  negative: string | null;
  basic_categories: ReviewCategoryScoreRow[];
  additional_categories: ReviewCategoryScoreRow[];
}
