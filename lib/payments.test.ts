import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  BookingRequestWithRoom,
  BookingRequestUpdate,
  PaymentOrder,
  PaymentOrderInsert,
  PaymentOrderUpdate,
} from "./types";

const state = vi.hoisted(() => ({
  booking: null as BookingRequestWithRoom | null,
  paymentOrders: [] as PaymentOrder[],
  paypalOrders: new Map<string, any>(),
  nextPayPalId: 1,
  sentConfirmedEmails: 0,
  cancelledRoomBlocks: [] as string[],
  confirmedRoomBlocks: [] as string[],
}));

vi.mock("./queries", () => ({
  getBookingRequestById: vi.fn(async (id: string) =>
    state.booking?.id === id ? state.booking : null
  ),
  getBookingRequestByPaymentOrderId: vi.fn(async (orderId: string) =>
    state.booking?.payment_order_id === orderId ? state.booking : null
  ),
  updateBookingRequest: vi.fn(async (_id: string, updates: BookingRequestUpdate) => {
    if (!state.booking) throw new Error("missing booking");
    state.booking = { ...state.booking, ...updates };
    return state.booking;
  }),
  createPaymentOrder: vi.fn(async (insert: PaymentOrderInsert) => {
    const now = new Date().toISOString();
    const order: PaymentOrder = {
      id: `po-${state.paymentOrders.length + 1}`,
      booking_request_id: insert.booking_request_id,
      provider: insert.provider ?? "paypal",
      provider_order_id: insert.provider_order_id,
      status: insert.status ?? "created",
      approval_url: insert.approval_url,
      amount: insert.amount,
      currency: insert.currency ?? "USD",
      capture_id: insert.capture_id ?? null,
      is_active: insert.is_active ?? false,
      requires_refund: insert.requires_refund ?? false,
      raw_status: insert.raw_status ?? "",
      error: insert.error ?? "",
      created_at: now,
      updated_at: now,
      paid_at: insert.paid_at ?? null,
    };
    state.paymentOrders.push(order);
    return order;
  }),
  getPaymentOrderByProviderOrderId: vi.fn(async (providerOrderId: string) =>
    state.paymentOrders.find((o) => o.provider_order_id === providerOrderId) ?? null
  ),
  getActivePaymentOrderForRequest: vi.fn(async (bookingRequestId: string) =>
    state.paymentOrders.find(
      (o) => o.booking_request_id === bookingRequestId && o.is_active
    ) ?? null
  ),
  updatePaymentOrder: vi.fn(async (id: string, updates: PaymentOrderUpdate) => {
    const index = state.paymentOrders.findIndex((o) => o.id === id);
    if (index < 0) throw new Error("missing payment order");
    state.paymentOrders[index] = {
      ...state.paymentOrders[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return state.paymentOrders[index];
  }),
  updatePaymentOrderByProviderOrderId: vi.fn(
    async (providerOrderId: string, updates: PaymentOrderUpdate) => {
      const order = state.paymentOrders.find(
        (o) => o.provider_order_id === providerOrderId
      );
      if (!order) return null;
      Object.assign(order, updates, { updated_at: new Date().toISOString() });
      return order;
    }
  ),
  supersedeActivePaymentOrders: vi.fn(async (bookingRequestId: string) => {
    for (const order of state.paymentOrders) {
      if (
        order.booking_request_id === bookingRequestId &&
        order.is_active &&
        (order.status === "created" || order.status === "approved")
      ) {
        order.is_active = false;
        order.status = "superseded";
      }
    }
  }),
  cancelDirectRoomUnitBlocksForRequest: vi.fn(async (bookingRequestId: string) => {
    state.cancelledRoomBlocks.push(bookingRequestId);
  }),
  confirmDirectRoomUnitBlockForRequest: vi.fn(async (bookingRequestId: string) => {
    state.confirmedRoomBlocks.push(bookingRequestId);
  }),
}));

vi.mock("./paypal", () => ({
  createPayPalOrder: vi.fn(async () => {
    const id = `ORDER-${state.nextPayPalId++}`;
    const approvalUrl = `https://paypal.test/checkout/${id}`;
    const raw = { id, status: "CREATED" };
    state.paypalOrders.set(id, raw);
    return { orderId: id, approvalUrl, raw };
  }),
  getPayPalOrder: vi.fn(async (orderId: string) => {
    const order = state.paypalOrders.get(orderId);
    if (!order) throw new Error(`missing paypal order ${orderId}`);
    return order;
  }),
  capturePayPalOrder: vi.fn(async (orderId: string) => {
    const order = completedPayPalOrder(orderId, `CAPTURE-${orderId}`);
    state.paypalOrders.set(orderId, order);
    return order;
  }),
  getCaptureId: vi.fn((order: any) =>
    order.purchase_units?.[0]?.payments?.captures?.find(
      (capture: any) => capture.status === "COMPLETED"
    )?.id ?? null
  ),
}));

vi.mock("./email", () => ({
  sendPaymentConfirmedEmail: vi.fn(async () => {
    state.sentConfirmedEmails += 1;
  }),
  sendPaymentLinkEmail: vi.fn(async () => undefined),
}));

import {
  captureApprovedBookingPayment,
  issuePaymentTokenForRequest,
  markPaymentPaidByOrderId,
  startBookingPayment,
} from "./payments";
import { createPayPalOrder, capturePayPalOrder } from "./paypal";

describe("PayPal payment flow", () => {
  beforeEach(() => {
    state.booking = makeBooking();
    state.paymentOrders = [];
    state.paypalOrders = new Map();
    state.nextPayPalId = 1;
    state.sentConfirmedEmails = 0;
    state.cancelledRoomBlocks = [];
    state.confirmedRoomBlocks = [];
    vi.clearAllMocks();
  });

  it("creates one PayPal order on first start and reuses it on repeated starts", async () => {
    const token = await issuePaymentTokenForRequest("request-1");
    const first = await startBookingPayment("request-1", token);
    const second = await startBookingPayment("request-1", token);

    expect(first.redirectUrl).toBe("https://paypal.test/checkout/ORDER-1");
    expect(second.redirectUrl).toBe(first.redirectUrl);
    expect(createPayPalOrder).toHaveBeenCalledTimes(1);
    expect(state.paymentOrders).toHaveLength(1);
    expect(state.paymentOrders[0].is_active).toBe(true);
  });

  it("expires the booking window instead of creating a PayPal order after the site deadline", async () => {
    state.booking = makeBooking({
      payment_expires_at: new Date(Date.now() - 60_000).toISOString(),
    });
    const token = await issuePaymentTokenForRequest("request-1");

    await expect(startBookingPayment("request-1", token)).rejects.toThrow(
      "This payment link has expired"
    );

    expect(createPayPalOrder).not.toHaveBeenCalled();
    expect(state.booking?.payment_status).toBe("expired");
    expect(state.booking?.status).toBe("expired");
    expect(state.cancelledRoomBlocks).toEqual(["request-1"]);
  });

  it("creates a replacement only when the active PayPal order is unusable", async () => {
    const token = await issuePaymentTokenForRequest("request-1");
    state.paymentOrders.push(makePaymentOrder({ provider_order_id: "ORDER-OLD" }));
    state.paypalOrders.set("ORDER-OLD", { id: "ORDER-OLD", status: "VOIDED" });

    const result = await startBookingPayment("request-1", token);

    expect(result.redirectUrl).toBe("https://paypal.test/checkout/ORDER-1");
    expect(createPayPalOrder).toHaveBeenCalledTimes(1);
    expect(state.paymentOrders).toHaveLength(2);
    expect(state.paymentOrders[0].status).toBe("failed");
    expect(state.paymentOrders[0].is_active).toBe(false);
    expect(state.paymentOrders[1].is_active).toBe(true);
  });

  it("accepts payment from any known PayPal order for the booking, including a superseded order", async () => {
    state.paymentOrders.push(
      makePaymentOrder({
        provider_order_id: "ORDER-OLD",
        status: "superseded",
        is_active: false,
      })
    );
    state.paypalOrders.set(
      "ORDER-OLD",
      completedPayPalOrder("ORDER-OLD", "CAPTURE-OLD")
    );

    await captureApprovedBookingPayment({ orderId: "ORDER-OLD" });

    expect(state.booking?.status).toBe("confirmed");
    expect(state.booking?.payment_status).toBe("paid");
    expect(state.booking?.payment_order_id).toBe("ORDER-OLD");
    expect(state.booking?.payment_capture_id).toBe("CAPTURE-OLD");
    expect(state.paymentOrders[0].status).toBe("paid");
    expect(state.sentConfirmedEmails).toBe(1);
    expect(state.confirmedRoomBlocks).toEqual(["request-1"]);
  });

  it("does not capture another order from the return path after the booking is already paid", async () => {
    state.booking = makeBooking({ status: "confirmed", payment_status: "paid" });
    state.paymentOrders.push(makePaymentOrder({ provider_order_id: "ORDER-2" }));
    state.paypalOrders.set("ORDER-2", { id: "ORDER-2", status: "APPROVED" });

    const result = await captureApprovedBookingPayment({ orderId: "ORDER-2" });

    expect(result.payment_status).toBe("paid");
    expect(capturePayPalOrder).not.toHaveBeenCalled();
    expect(state.sentConfirmedEmails).toBe(0);
  });

  it("flags a duplicate paid webhook for refund review", async () => {
    state.booking = makeBooking({ status: "confirmed", payment_status: "paid" });
    state.paymentOrders.push(makePaymentOrder({ provider_order_id: "ORDER-2" }));
    state.paypalOrders.set(
      "ORDER-2",
      completedPayPalOrder("ORDER-2", "CAPTURE-2")
    );

    await markPaymentPaidByOrderId("ORDER-2");

    expect(state.booking?.payment_status).toBe("paid");
    expect(state.paymentOrders[0].status).toBe("duplicate_paid");
    expect(state.paymentOrders[0].requires_refund).toBe(true);
    expect(state.paymentOrders[0].capture_id).toBe("CAPTURE-2");
    expect(state.sentConfirmedEmails).toBe(0);
  });
});

function makeBooking(
  overrides: Partial<BookingRequestWithRoom> = {}
): BookingRequestWithRoom {
  return {
    id: "request-1",
    guest_name: "Test Guest",
    guest_email: "guest@example.com",
    guest_count: 1,
    room_id: "room-1",
    assigned_room_unit_id: null,
    room_slug: "room-with-private-shower",
    check_in_date: "2026-06-01",
    check_out_date: "2026-06-08",
    estimated_total: 205,
    bedding_prepaid: false,
    payment_status: "pending",
    payment_provider: "paypal",
    payment_order_id: null,
    payment_capture_id: null,
    payment_approval_url: null,
    payment_amount: 205,
    payment_currency: "USD",
    payment_created_at: null,
    payment_paid_at: null,
    payment_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    payment_token_hash: null,
    payment_token_created_at: null,
    payment_error: "",
    notes: "",
    status: "approved",
    admin_notes: "",
    created_at: "2026-05-17T00:00:00.000Z",
    updated_at: "2026-05-17T00:00:00.000Z",
    rooms: { name: "Private Shower Room", slug: "room-with-private-shower" },
    ...overrides,
  };
}

function makePaymentOrder(overrides: Partial<PaymentOrder> = {}): PaymentOrder {
  const now = new Date().toISOString();
  return {
    id: "po-1",
    booking_request_id: "request-1",
    provider: "paypal",
    provider_order_id: "ORDER-1",
    status: "created",
    approval_url: "https://paypal.test/checkout/ORDER-1",
    amount: 205,
    currency: "USD",
    capture_id: null,
    is_active: true,
    requires_refund: false,
    raw_status: "CREATED",
    error: "",
    created_at: now,
    updated_at: now,
    paid_at: null,
    ...overrides,
  };
}

function completedPayPalOrder(orderId: string, captureId: string) {
  return {
    id: orderId,
    status: "COMPLETED",
    purchase_units: [
      {
        payments: {
          captures: [{ id: captureId, status: "COMPLETED" }],
        },
      },
    ],
  };
}
