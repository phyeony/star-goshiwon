import { siteConfig } from "./site-data";
import {
  getBookingRequestById,
  getBookingRequestByPaymentOrderId,
  updateBookingRequest,
} from "./queries";
import { calculateEstimate, getUsdPrices } from "./pricing";
import type { BookingRequestWithRoom } from "./types";
import {
  capturePayPalOrder,
  createPayPalOrder,
  getCaptureId,
  getPayPalOrder,
  type PayPalOrder,
} from "./paypal";
import { sendPaymentConfirmedEmail, sendPaymentLinkEmail } from "./email";

const PAYMENT_LINK_TTL_HOURS = 48;

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

export function getPaymentReviewUrl(requestId: string) {
  return `${getSiteBaseUrl()}/booking-payment/pay?request_id=${requestId}`;
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

  const now = new Date();
  const existingLinkIsActive =
    request.payment_status === "pending" &&
    request.payment_approval_url &&
    request.payment_expires_at &&
    new Date(request.payment_expires_at) > now;

  if (existingLinkIsActive && !options.regenerate) {
    return {
      request,
      paymentUrl: getPaymentReviewUrl(request.id),
      reused: true,
    };
  }

  const estimate = recalculateStoredEstimate(request);
  const expiresAt = new Date(
    now.getTime() + PAYMENT_LINK_TTL_HOURS * 60 * 60 * 1000
  ).toISOString();
  const baseUrl = getSiteBaseUrl();
  const returnUrl = `${baseUrl}/booking-payment/return?request_id=${request.id}`;
  const cancelUrl = `${baseUrl}/booking-payment/cancel?request_id=${request.id}`;

  const order = await createPayPalOrder({
    requestId: request.id,
    guestEmail: request.guest_email,
    roomName: getRoomName(request),
    amountUsd: estimate.total,
    returnUrl,
    cancelUrl,
  });

  await updateBookingRequest(request.id, {
    status: "approved",
    estimated_total: estimate.total,
    payment_status: "pending",
    payment_provider: "paypal",
    payment_order_id: order.orderId,
    payment_capture_id: null,
    payment_approval_url: order.approvalUrl,
    payment_amount: estimate.total,
    payment_currency: "USD",
    payment_created_at: now.toISOString(),
    payment_paid_at: null,
    payment_expires_at: expiresAt,
    payment_error: "",
  });

  const updated = await getBookingRequestById(request.id);
  if (!updated) throw new Error("Updated booking request not found");

  return {
    request: updated,
    paymentUrl: getPaymentReviewUrl(updated.id),
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

  const now = new Date();
  const existingLinkIsActive =
    request.payment_status === "pending" &&
    request.payment_approval_url &&
    request.payment_expires_at &&
    new Date(request.payment_expires_at) > now;

  if (existingLinkIsActive && !options.regenerate) {
    await sendPaymentLinkEmail(
      getPaymentEmailData(request, {
        payment_url: getPaymentReviewUrl(request.id),
        payment_expires_at: request.payment_expires_at!,
      })
    );
    return {
      request,
      approvalUrl: request.payment_approval_url!,
      reused: true,
    };
  }

  const estimate = recalculateStoredEstimate(request);
  const expiresAt = new Date(
    now.getTime() + PAYMENT_LINK_TTL_HOURS * 60 * 60 * 1000
  ).toISOString();
  const baseUrl = getSiteBaseUrl();
  const returnUrl = `${baseUrl}/booking-payment/return?request_id=${request.id}`;
  const cancelUrl = `${baseUrl}/booking-payment/cancel?request_id=${request.id}`;

  const order = await createPayPalOrder({
    requestId: request.id,
    guestEmail: request.guest_email,
    roomName: getRoomName(request),
    amountUsd: estimate.total,
    returnUrl,
    cancelUrl,
  });

  await updateBookingRequest(request.id, {
    status: "approved",
    estimated_total: estimate.total,
    payment_status: "pending",
    payment_provider: "paypal",
    payment_order_id: order.orderId,
    payment_capture_id: null,
    payment_approval_url: order.approvalUrl,
    payment_amount: estimate.total,
    payment_currency: "USD",
    payment_created_at: now.toISOString(),
    payment_paid_at: null,
    payment_expires_at: expiresAt,
    payment_error: "",
  });

  const updated = await getBookingRequestById(request.id);
  if (!updated) throw new Error("Updated booking request not found");

  await sendPaymentLinkEmail(
    getPaymentEmailData(updated, {
      payment_url: getPaymentReviewUrl(updated.id),
      payment_expires_at: expiresAt,
    })
  );

  return { request: updated, approvalUrl: order.approvalUrl, reused: false };
}

async function markPaymentPaid(
  request: BookingRequestWithRoom,
  order: PayPalOrder,
  captureId: string | null
) {
  if (request.payment_status === "paid") return request;

  await updateBookingRequest(request.id, {
    status: "confirmed",
    payment_status: "paid",
    payment_provider: "paypal",
    payment_order_id: order.id || request.payment_order_id,
    payment_capture_id: captureId,
    payment_paid_at: new Date().toISOString(),
    payment_error: "",
  });

  const updated = await getBookingRequestById(request.id);
  if (!updated) throw new Error("Updated booking request not found");
  await sendPaymentConfirmedEmail(getConfirmedEmailData(updated));
  return updated;
}

export async function captureApprovedBookingPayment(input: {
  requestId?: string | null;
  orderId: string;
}) {
  const request = input.requestId
    ? await getBookingRequestById(input.requestId)
    : await getBookingRequestByPaymentOrderId(input.orderId);

  if (!request) throw new Error("Booking request not found for PayPal order");
  if (request.payment_order_id && request.payment_order_id !== input.orderId) {
    throw new Error("PayPal order does not match this booking request");
  }
  if (request.payment_status === "paid") return request;

  let order = await getPayPalOrder(input.orderId);
  if (order.status === "APPROVED") {
    order = await capturePayPalOrder(input.orderId, request.id);
  }

  const captureId = getCaptureId(order);
  if (order.status === "COMPLETED" || captureId) {
    return markPaymentPaid(request, order, captureId);
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
  const request = await getBookingRequestByPaymentOrderId(orderId);
  if (!request || request.payment_status === "paid") return null;

  return updateBookingRequest(request.id, {
    payment_status: "failed",
    payment_error: message,
  });
}

export async function markPaymentPaidByOrderId(orderId: string) {
  const request = await getBookingRequestByPaymentOrderId(orderId);
  if (!request) return null;
  if (request.payment_status === "paid") return request;

  const order = await getPayPalOrder(orderId);
  return markPaymentPaid(request, order, getCaptureId(order));
}
