import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { siteConfig } from "./site-data";
import {
  createPaymentOrder,
  cancelDirectRoomUnitBlocksForRequest,
  confirmDirectRoomUnitBlockForRequest,
  ensureTentativeRoomUnitBlockForRequest,
  getActivePaymentOrderForRequest,
  getBookingRequestById,
  getBookingRequestByPaymentOrderId,
  getPaymentOrderByProviderOrderId,
  supersedeActivePaymentOrders,
  updateBookingRequest,
  updatePaymentOrder,
  updatePaymentOrderByProviderOrderId,
} from "./queries";
import { calculateEstimate, getUsdPrices, DEPOSIT_USD } from "./pricing";
import type { BookingRequestWithRoom, PaymentOrder } from "./types";
import {
  capturePayPalOrder,
  createPayPalOrder,
  getCaptureId,
  getPayPalOrder,
  refundPayPalCapture,
  type PayPalOrder,
} from "./paypal";
import {
  sendDepositRefundEmail,
  sendPaymentConfirmedEmail,
  sendPaymentLinkEmail,
} from "./email";

export const PAYMENT_LINK_TTL_HOURS = 48;
const PAYMENT_TOKEN_BYTES = 32;

function getRoomName(request: BookingRequestWithRoom) {
  return request.rooms?.name || request.room_slug;
}

function getPaymentEmailData(
  request: BookingRequestWithRoom,
  extra: { payment_url: string; payment_expires_at: string }
) {
  return {
    guest_name: request.guest_name,
    guest_email: request.guest_email,
    room_name: getRoomName(request),
    check_in_date: request.check_in_date,
    check_out_date: request.check_out_date,
    guest_count: request.guest_count,
    estimated_total: request.estimated_total,
    ...extra,
  };
}

function getSiteBaseUrl() {
  return siteConfig.url.replace(/\/$/, "");
}

function createPaymentToken() {
  return randomBytes(PAYMENT_TOKEN_BYTES).toString("base64url");
}

function hashPaymentToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isValidPaymentToken(
  request: BookingRequestWithRoom,
  token?: string | null
) {
  if (!request.payment_token_hash || !token) return false;
  const expected = Buffer.from(request.payment_token_hash, "hex");
  const actual = Buffer.from(hashPaymentToken(token), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function getBookingRequestByPaymentToken(
  requestId: string,
  token?: string | null
) {
  const request = await getBookingRequestById(requestId);
  if (!request || !isValidPaymentToken(request, token)) return null;
  return request;
}

export async function issuePaymentTokenForRequest(requestId: string) {
  const token = createPaymentToken();
  await updateBookingRequest(requestId, {
    payment_token_hash: hashPaymentToken(token),
    payment_token_created_at: new Date().toISOString(),
  });
  return token;
}

export function getPaymentReviewUrl(requestId: string, paymentToken?: string) {
  const url = new URL(`${getSiteBaseUrl()}/booking-payment/pay`);
  url.searchParams.set("request_id", requestId);
  if (paymentToken) url.searchParams.set("payment_token", paymentToken);
  return url.toString();
}

export function getPaymentStartUrl(requestId: string, paymentToken?: string) {
  const url = new URL(`${getSiteBaseUrl()}/booking-payment/start`);
  url.searchParams.set("request_id", requestId);
  if (paymentToken) url.searchParams.set("payment_token", paymentToken);
  return url.toString();
}

export function isPaymentExpired(request: BookingRequestWithRoom, now = new Date()) {
  return Boolean(
    request.payment_status === "pending" &&
      request.payment_expires_at &&
      new Date(request.payment_expires_at).getTime() <= now.getTime()
  );
}

export async function markPaymentExpired(request: BookingRequestWithRoom) {
  if (!isPaymentExpired(request)) return request;

  const activeOrder = await getActivePaymentOrderForRequest(request.id);
  if (activeOrder) {
    await updatePaymentOrder(activeOrder.id, {
      status: "expired",
      is_active: false,
      error: "Payment link expired",
    });
  }

  await updateBookingRequest(request.id, {
    status: "expired",
    payment_status: "expired",
    payment_error: "Payment link expired",
  });
  await cancelDirectRoomUnitBlocksForRequest(request.id);

  const updated = await getBookingRequestById(request.id);
  if (!updated) throw new Error("Updated booking request not found");
  return updated;
}

function buildCreatePaymentRequestId(requestId: string, now: Date) {
  return `crt-${requestId.slice(0, 8)}-${now.getTime().toString(36)}`;
}

async function createOrderForRequest(
  request: BookingRequestWithRoom,
  paymentToken: string,
  now = new Date()
) {
  const estimate = recalculateStoredEstimate(request);
  const baseUrl = getSiteBaseUrl();
  const returnUrl = `${baseUrl}/booking-payment/return?request_id=${request.id}`;
  const cancelUrl = `${baseUrl}/booking-payment/cancel?request_id=${request.id}&payment_token=${encodeURIComponent(paymentToken)}`;

  const order = await createPayPalOrder({
    requestId: request.id,
    guestEmail: request.guest_email,
    roomName: getRoomName(request),
    amountUsd: estimate.total,
    returnUrl,
    cancelUrl,
    idempotencyKey: buildCreatePaymentRequestId(request.id, now),
  });

  await supersedeActivePaymentOrders(request.id);
  await createPaymentOrder({
    booking_request_id: request.id,
    provider: "paypal",
    provider_order_id: order.orderId,
    status: "created",
    approval_url: order.approvalUrl,
    amount: estimate.total,
    currency: "USD",
    raw_status: order.raw.status || "CREATED",
    is_active: true,
  });

  await updateBookingRequest(request.id, {
    estimated_total: estimate.total,
    payment_provider: "paypal",
    payment_order_id: order.orderId,
    payment_capture_id: null,
    payment_approval_url: order.approvalUrl,
    payment_amount: estimate.total,
    payment_currency: "USD",
    payment_created_at: now.toISOString(),
    payment_paid_at: null,
    payment_error: "",
  });

  return order;
}

function isReusablePaymentOrder(order: PaymentOrder) {
  return (
    order.is_active &&
    (order.status === "created" || order.status === "approved") &&
    Boolean(order.approval_url)
  );
}

async function verifyReusablePaymentOrder(
  request: BookingRequestWithRoom,
  paymentOrder: PaymentOrder,
  paymentToken: string
) {
  const order = await getPayPalOrder(paymentOrder.provider_order_id);
  const captureId = getCaptureId(order);

  if (order.status === "CREATED" || order.status === "APPROVED") {
    await updatePaymentOrder(paymentOrder.id, {
      status: order.status === "APPROVED" ? "approved" : "created",
      raw_status: order.status,
      error: "",
    });
    return paymentOrder.approval_url;
  }

  if (order.status === "COMPLETED" || captureId) {
    await markPaymentPaid(request, order, captureId, paymentOrder);
    return getPaymentReviewUrl(request.id, paymentToken);
  }

  await updatePaymentOrder(paymentOrder.id, {
    status: "failed",
    is_active: false,
    raw_status: order.status,
    error: `PayPal order is ${order.status}`,
  });
  return null;
}

function getConfirmedEmailData(request: BookingRequestWithRoom) {
  return {
    guest_name: request.guest_name,
    guest_email: request.guest_email,
    room_name: getRoomName(request),
    check_in_date: request.check_in_date,
    check_out_date: request.check_out_date,
    guest_count: request.guest_count,
    estimated_total: request.estimated_total,
  };
}

export function recalculateStoredEstimate(request: BookingRequestWithRoom) {
  return calculateEstimate(
    getUsdPrices(request.room_slug),
    request.check_in_date,
    request.check_out_date,
    { beddingPrepaid: request.bedding_prepaid }
  );
}

/**
 * Approve a booking and ensure an active PayPal order exists, but do NOT send
 * the templated payment-link email. Returns the updated request plus its
 * payment review URL so the caller can send their own composed email.
 */
export async function approveAndCreatePaymentOrder(
  requestId: string,
  options: { regenerate?: boolean } = {}
) {
  const request = await getBookingRequestById(requestId);
  if (!request) throw new Error("Booking request not found");
  if (request.payment_status === "paid") {
    throw new Error("This booking has already been paid");
  }
  await ensureTentativeRoomUnitBlockForRequest(request);

  const now = new Date();
  const existingLinkIsActive =
    request.payment_status === "pending" &&
    request.payment_expires_at &&
    new Date(request.payment_expires_at) > now;

  if (existingLinkIsActive && !options.regenerate) {
    await supersedeActivePaymentOrders(request.id);
    const paymentToken = await issuePaymentTokenForRequest(request.id);
    const updated = await getBookingRequestById(request.id);
    if (!updated) throw new Error("Updated booking request not found");
    return {
      request: updated,
      paymentUrl: getPaymentReviewUrl(request.id, paymentToken),
      reused: true,
    };
  }

  const expiresAt = new Date(
    now.getTime() + PAYMENT_LINK_TTL_HOURS * 60 * 60 * 1000
  ).toISOString();
  const estimate = recalculateStoredEstimate(request);
  const paymentToken = createPaymentToken();
  await supersedeActivePaymentOrders(request.id);

  await updateBookingRequest(request.id, {
    status: "approved",
    estimated_total: estimate.total,
    payment_status: "pending",
    payment_provider: "paypal",
    payment_order_id: null,
    payment_capture_id: null,
    payment_approval_url: null,
    payment_amount: estimate.total,
    payment_currency: "USD",
    payment_created_at: null,
    payment_paid_at: null,
    payment_expires_at: expiresAt,
    payment_token_hash: hashPaymentToken(paymentToken),
    payment_token_created_at: now.toISOString(),
    payment_error: "",
  });

  const updated = await getBookingRequestById(request.id);
  if (!updated) throw new Error("Updated booking request not found");

  return {
    request: updated,
    paymentUrl: getPaymentReviewUrl(updated.id, paymentToken),
    reused: false,
  };
}

export async function approveAndSendPaymentLink(
  requestId: string,
  options: { regenerate?: boolean } = {}
) {
  const request = await getBookingRequestById(requestId);
  if (!request) throw new Error("Booking request not found");
  if (request.payment_status === "paid") {
    throw new Error("This booking has already been paid");
  }
  await ensureTentativeRoomUnitBlockForRequest(request);

  const now = new Date();
  const existingLinkIsActive =
    request.payment_status === "pending" &&
    request.payment_expires_at &&
    new Date(request.payment_expires_at) > now;

  if (existingLinkIsActive && !options.regenerate) {
    await supersedeActivePaymentOrders(request.id);
    const paymentToken = await issuePaymentTokenForRequest(request.id);
    const updated = await getBookingRequestById(request.id);
    if (!updated) throw new Error("Updated booking request not found");
    await sendPaymentLinkEmail(
      getPaymentEmailData(updated, {
        payment_url: getPaymentReviewUrl(updated.id, paymentToken),
        payment_expires_at: updated.payment_expires_at!,
      })
    );
    return {
      request: updated,
      approvalUrl: getPaymentStartUrl(updated.id, paymentToken),
      reused: true,
    };
  }

  const expiresAt = new Date(
    now.getTime() + PAYMENT_LINK_TTL_HOURS * 60 * 60 * 1000
  ).toISOString();
  const estimate = recalculateStoredEstimate(request);
  const paymentToken = createPaymentToken();
  await supersedeActivePaymentOrders(request.id);

  await updateBookingRequest(request.id, {
    status: "approved",
    estimated_total: estimate.total,
    payment_status: "pending",
    payment_provider: "paypal",
    payment_order_id: null,
    payment_capture_id: null,
    payment_approval_url: null,
    payment_amount: estimate.total,
    payment_currency: "USD",
    payment_created_at: null,
    payment_paid_at: null,
    payment_expires_at: expiresAt,
    payment_token_hash: hashPaymentToken(paymentToken),
    payment_token_created_at: now.toISOString(),
    payment_error: "",
  });

  const updated = await getBookingRequestById(request.id);
  if (!updated) throw new Error("Updated booking request not found");

  await sendPaymentLinkEmail(
    getPaymentEmailData(updated, {
      payment_url: getPaymentReviewUrl(updated.id, paymentToken),
      payment_expires_at: expiresAt,
    })
  );

  return { request: updated, approvalUrl: getPaymentStartUrl(updated.id, paymentToken), reused: false };
}

export async function startBookingPayment(requestId: string, paymentToken?: string | null) {
  const request = await getBookingRequestById(requestId);
  if (!request) throw new Error("Booking request not found");
  if (!isValidPaymentToken(request, paymentToken)) {
    throw new Error("Invalid payment link");
  }
  if (request.payment_status === "paid") {
    return { status: "paid" as const, redirectUrl: getPaymentReviewUrl(request.id, paymentToken!) };
  }
  if (isPaymentExpired(request)) {
    await markPaymentExpired(request);
    throw new Error("This payment link has expired");
  }
  if (request.payment_status !== "pending") {
    throw new Error("This booking is not ready for payment");
  }

  const activeOrder = await getActivePaymentOrderForRequest(request.id);
  if (activeOrder && isReusablePaymentOrder(activeOrder)) {
    const approvalUrl = await verifyReusablePaymentOrder(request, activeOrder, paymentToken!);
    if (approvalUrl) {
      return { status: "started" as const, redirectUrl: approvalUrl };
    }
  }

  const order = await createOrderForRequest(request, paymentToken!);
  return { status: "started" as const, redirectUrl: order.approvalUrl };
}

async function markPaymentPaid(
  request: BookingRequestWithRoom,
  order: PayPalOrder,
  captureId: string | null,
  paymentOrder?: PaymentOrder | null
) {
  if (request.payment_status === "paid") {
    if (paymentOrder && captureId) {
      await updatePaymentOrder(paymentOrder.id, {
        status: "duplicate_paid",
        capture_id: captureId,
        paid_at: new Date().toISOString(),
        is_active: false,
        requires_refund: true,
        raw_status: order.status,
        error: "Duplicate payment captured after booking was already paid",
      });
    }
    return request;
  }

  await updateBookingRequest(request.id, {
    status: "confirmed",
    payment_status: "paid",
    payment_provider: "paypal",
    payment_order_id: order.id || request.payment_order_id,
    payment_capture_id: captureId,
    payment_paid_at: new Date().toISOString(),
    payment_error: "",
  });
  await confirmDirectRoomUnitBlockForRequest(request.id);

  if (paymentOrder) {
    await updatePaymentOrder(paymentOrder.id, {
      status: "paid",
      capture_id: captureId,
      paid_at: new Date().toISOString(),
      is_active: false,
      raw_status: order.status,
      error: "",
    });
  }

  const updated = await getBookingRequestById(request.id);
  if (!updated) throw new Error("Updated booking request not found");
  await sendPaymentConfirmedEmail(getConfirmedEmailData(updated));
  return updated;
}

export async function captureApprovedBookingPayment(input: {
  requestId?: string | null;
  orderId: string;
}) {
  let paymentOrder = await getPaymentOrderByProviderOrderId(input.orderId);
  let request = paymentOrder
    ? await getBookingRequestById(paymentOrder.booking_request_id)
    : input.requestId
      ? await getBookingRequestById(input.requestId)
      : await getBookingRequestByPaymentOrderId(input.orderId);

  if (!request) throw new Error("Booking request not found for PayPal order");
  if (paymentOrder && paymentOrder.booking_request_id !== request.id) {
    throw new Error("PayPal order does not match this booking request");
  }
  if (!paymentOrder && request.payment_order_id === input.orderId) {
    paymentOrder = await createPaymentOrder({
      booking_request_id: request.id,
      provider: "paypal",
      provider_order_id: input.orderId,
      status: "approved",
      approval_url: request.payment_approval_url || "",
      amount: request.payment_amount || request.estimated_total,
      currency: request.payment_currency || "USD",
      is_active: true,
    });
  }
  if (request.payment_status === "paid") return request;
  if (isPaymentExpired(request)) {
    await markPaymentExpired(request);
    throw new Error("This payment link has expired");
  }

  let order = await getPayPalOrder(input.orderId);
  if (order.status === "APPROVED") {
    if (paymentOrder) {
      await updatePaymentOrder(paymentOrder.id, {
        status: "approved",
        raw_status: order.status,
      });
    }
    order = await capturePayPalOrder(input.orderId, request.id);
  }

  const captureId = getCaptureId(order);
  if (order.status === "COMPLETED" || captureId) {
    return markPaymentPaid(request, order, captureId, paymentOrder);
  }

  if (paymentOrder) {
    await updatePaymentOrder(paymentOrder.id, {
      status: "failed",
      is_active: false,
      raw_status: order.status,
      error: `PayPal order is ${order.status}`,
    });
  }
  await updateBookingRequest(request.id, {
    payment_status: "failed",
    payment_error: `PayPal order is ${order.status}`,
  });
  throw new Error(`PayPal order is ${order.status}`);
}

export async function markPaymentFailedByOrderId(
  orderId: string,
  message: string
) {
  const paymentOrder = await getPaymentOrderByProviderOrderId(orderId);
  const request = paymentOrder
    ? await getBookingRequestById(paymentOrder.booking_request_id)
    : await getBookingRequestByPaymentOrderId(orderId);
  if (!request) return null;

  if (paymentOrder) {
    await updatePaymentOrder(paymentOrder.id, {
      status: "failed",
      is_active: false,
      error: message,
    });
  }
  if (request.payment_status === "paid") return request;

  return updateBookingRequest(request.id, {
    payment_status: "failed",
    payment_error: message,
  });
}

export async function markPaymentPaidByOrderId(orderId: string) {
  let paymentOrder = await getPaymentOrderByProviderOrderId(orderId);
  const request = paymentOrder
    ? await getBookingRequestById(paymentOrder.booking_request_id)
    : await getBookingRequestByPaymentOrderId(orderId);
  if (!request) return null;

  const order = await getPayPalOrder(orderId);
  if (!paymentOrder && request.payment_order_id === orderId) {
    paymentOrder = await createPaymentOrder({
      booking_request_id: request.id,
      provider: "paypal",
      provider_order_id: orderId,
      status: "paid",
      approval_url: request.payment_approval_url || "",
      amount: request.payment_amount || request.estimated_total,
      currency: request.payment_currency || "USD",
      is_active: false,
    });
  }
  return markPaymentPaid(request, order, getCaptureId(order), paymentOrder);
}

export const DEFAULT_DEPOSIT_REFUND_USD = DEPOSIT_USD;

/**
 * Refund all or part of a paid booking via PayPal — defaults to the security
 * deposit. A partial refund keeps the booking 'paid'; once the cumulative
 * refunded amount reaches the amount paid, payment_status flips to 'refunded'.
 */
export async function refundBookingDeposit(input: {
  requestId: string;
  amountUsd?: number;
}) {
  const request = await getBookingRequestById(input.requestId);
  if (!request) throw new Error("Booking request not found");
  if (request.payment_status !== "paid") {
    throw new Error("Only a paid booking can be refunded");
  }

  const captureId = request.payment_capture_id;
  if (!captureId) {
    throw new Error("No PayPal capture is on file for this booking");
  }

  const amount = Math.round(input.amountUsd ?? DEPOSIT_USD);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Refund amount must be greater than 0");
  }

  const paidAmount = request.payment_amount ?? request.estimated_total;
  const alreadyRefunded = request.refund_amount ?? 0;
  if (alreadyRefunded + amount > paidAmount) {
    throw new Error(
      `Refund of $${amount} exceeds the remaining balance ($${paidAmount - alreadyRefunded})`
    );
  }

  const newRefundTotal = alreadyRefunded + amount;
  const refund = await refundPayPalCapture(captureId, {
    amountUsd: amount,
    currency: request.payment_currency ?? "USD",
    noteToPayer: "Security deposit refund — Seoul Goshiwon",
    // Stable per (booking, cumulative amount) so an accidental retry is
    // idempotent rather than double-refunding.
    idempotencyKey: `ref-${request.id.slice(0, 8)}-${newRefundTotal}`,
    invoiceId: `refund-${request.id.slice(0, 8)}-${newRefundTotal}`,
  });

  const fullyRefunded = newRefundTotal >= paidAmount;
  await updateBookingRequest(request.id, {
    refund_amount: newRefundTotal,
    refunded_at: new Date().toISOString(),
    refund_id: refund.id,
    ...(fullyRefunded ? { payment_status: "refunded" as const } : {}),
  });

  await sendDepositRefundEmail({
    guest_name: request.guest_name,
    guest_email: request.guest_email,
    room_name: getRoomName(request),
    refund_amount: amount,
    is_deposit_refund: !fullyRefunded,
  });

  const updated = await getBookingRequestById(request.id);
  if (!updated) throw new Error("Updated booking request not found");
  return { request: updated, refundId: refund.id, fullyRefunded };
}
