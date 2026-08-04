import { EMPTY_DOCUMENT_FORM, type GuestDocumentForm } from "./types";
import type { BookingRequestWithRoom } from "../types";

// Shared fixtures for the document unit tests. Kept out of *.test.ts so that
// importing them does not re-register another file's suites.
export const fixtureBooking = {
  id: "req-1",
  guest_name: "Jane Traveler",
  guest_email: "jane@example.com",
  guest_count: 1,
  room_id: "room-1",
  assigned_room_unit_id: "unit-1",
  room_slug: "room-with-private-shower",
  check_in_date: "2026-06-01",
  check_out_date: "2026-07-01",
  estimated_total: 700,
  bedding_prepaid: true,
  payment_status: "paid",
  payment_provider: "paypal",
  payment_order_id: null,
  payment_capture_id: null,
  payment_approval_url: null,
  payment_amount: 700,
  payment_currency: "USD",
  payment_created_at: null,
  payment_paid_at: null,
  payment_expires_at: null,
  payment_token_hash: null,
  payment_token_created_at: null,
  payment_error: "",
  refund_amount: 0,
  refunded_at: null,
  refund_id: null,
  notes: "",
  status: "confirmed",
  admin_notes: "",
  created_at: "2026-05-01T00:00:00.000Z",
  updated_at: "2026-05-01T00:00:00.000Z",
  rooms: {
    name: "Room with Private Shower",
    name_ko: "샤워실 있는 방",
    slug: "room-with-private-shower",
    nightly_rate_usd: 21,
    long_stay_discount: 0.15,
  },
  room_units: { name: "301" },
} as BookingRequestWithRoom;

export const fixtureForm: GuestDocumentForm = {
  ...EMPTY_DOCUMENT_FORM,
  passportNumber: "M12345678",
  nationality: "United States",
  dateOfBirth: "1995-03-14",
  homeAddress: "1 Main St, Springfield, USA",
  specialTerms: "",
  issueDate: "2026-08-04",
};
