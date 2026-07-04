import { Buffer } from "node:buffer";

type PayPalEnv = "sandbox" | "live";

export interface PayPalOrder {
  id: string;
  status: string;
  links?: { href: string; rel: string; method: string }[];
  purchase_units?: {
    payments?: {
      captures?: {
        id: string;
        status: string;
      }[];
    };
  }[];
}

export interface PayPalWebhookVerificationBody {
  auth_algo: string | null;
  cert_url: string | null;
  transmission_id: string | null;
  transmission_sig: string | null;
  transmission_time: string | null;
  webhook_event: unknown;
}

type FakePayPalOrder = PayPalOrder & {
  returnUrl?: string;
  cancelUrl?: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __goshiwonFakePayPalOrders:
    | Map<string, FakePayPalOrder>
    | undefined;
  // eslint-disable-next-line no-var
  var __goshiwonFakePayPalNextId: number | undefined;
}

function isFakePayPalMode() {
  return process.env.E2E_TEST_MODE === "true" && process.env.PAYPAL_FAKE === "true";
}

function getFakePayPalOrders() {
  globalThis.__goshiwonFakePayPalOrders ??= new Map();
  return globalThis.__goshiwonFakePayPalOrders;
}

function nextFakePayPalOrderId() {
  globalThis.__goshiwonFakePayPalNextId ??= 1;
  const next = globalThis.__goshiwonFakePayPalNextId++;
  return `FAKE-PAYPAL-${Date.now().toString(36)}-${String(next).padStart(4, "0")}`;
}

function getPayPalEnv(): PayPalEnv {
  return process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
}

function getBaseUrl() {
  return getPayPalEnv() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function requirePayPalConfig() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are not configured");
  }

  return { clientId, clientSecret };
}

async function getAccessToken() {
  const { clientId, clientSecret } = requirePayPalConfig();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("PayPal auth response missing token");
  return data.access_token;
}

export async function createPayPalOrder(input: {
  requestId: string;
  guestEmail: string;
  roomName: string;
  amountUsd: number;
  returnUrl: string;
  cancelUrl: string;
  idempotencyKey: string;
}): Promise<{ orderId: string; approvalUrl: string; raw: PayPalOrder }> {
  if (isFakePayPalMode()) {
    const orderId = nextFakePayPalOrderId();
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "http://127.0.0.1:3100";
    const approvalUrl =
      `${baseUrl}/test/paypal/approve?token=${encodeURIComponent(orderId)}` +
      `&return_url=${encodeURIComponent(input.returnUrl)}` +
      `&cancel_url=${encodeURIComponent(input.cancelUrl)}`;
    const raw: FakePayPalOrder = {
      id: orderId,
      status: "CREATED",
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
      links: [{ rel: "payer-action", href: approvalUrl, method: "GET" }],
    };
    getFakePayPalOrders().set(orderId, raw);
    return { orderId, approvalUrl, raw };
  }

  const token = await getAccessToken();
  const amount = input.amountUsd.toFixed(2);

  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": input.idempotencyKey,
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.requestId,
          custom_id: input.requestId,
          description: `${input.roomName} booking prepayment`,
          amount: {
            currency_code: "USD",
            value: amount,
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
            brand_name: "Star Goshiwon",
            locale: "en-US",
            landing_page: "NO_PREFERENCE",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
          },
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`PayPal order create failed: ${res.status} ${await res.text()}`);
  }

  const raw = (await res.json()) as PayPalOrder;
  const approvalUrl = raw.links?.find((link) => link.rel === "payer-action")?.href
    ?? raw.links?.find((link) => link.rel === "approve")?.href;

  if (!raw.id || !approvalUrl) {
    throw new Error("PayPal order response missing approval URL");
  }

  return { orderId: raw.id, approvalUrl, raw };
}

export async function getPayPalOrder(orderId: string): Promise<PayPalOrder> {
  if (isFakePayPalMode()) {
    const order = getFakePayPalOrders().get(orderId);
    if (!order) throw new Error(`Fake PayPal order not found: ${orderId}`);
    return order;
  }

  const token = await getAccessToken();
  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`PayPal order fetch failed: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as PayPalOrder;
}

export async function capturePayPalOrder(orderId: string, requestId: string): Promise<PayPalOrder> {
  if (isFakePayPalMode()) {
    const order = getFakePayPalOrders().get(orderId);
    if (!order) throw new Error(`Fake PayPal order not found: ${orderId}`);
    const completed: FakePayPalOrder = {
      ...order,
      status: "COMPLETED",
      purchase_units: [
        {
          payments: {
            captures: [{ id: `FAKE-CAPTURE-${orderId}`, status: "COMPLETED" }],
          },
        },
      ],
    };
    getFakePayPalOrders().set(orderId, completed);
    return completed;
  }

  const token = await getAccessToken();
  const requestKey = `cap-${requestId.slice(0, 8)}-${orderId.slice(-12)}`;
  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": requestKey,
      Prefer: "return=representation",
    },
    body: "{}",
  });

  if (!res.ok) {
    throw new Error(`PayPal order capture failed: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as PayPalOrder;
}

export async function verifyPayPalWebhook(body: PayPalWebhookVerificationBody) {
  if (isFakePayPalMode()) return true;

  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) throw new Error("PAYPAL_WEBHOOK_ID is not configured");

  const token = await getAccessToken();
  const res = await fetch(`${getBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: body.auth_algo,
      cert_url: body.cert_url,
      transmission_id: body.transmission_id,
      transmission_sig: body.transmission_sig,
      transmission_time: body.transmission_time,
      webhook_id: webhookId,
      webhook_event: body.webhook_event,
    }),
  });

  if (!res.ok) {
    throw new Error(`PayPal webhook verify failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}

export function approveFakePayPalOrder(orderId: string) {
  if (!isFakePayPalMode()) {
    throw new Error("Fake PayPal mode is not enabled");
  }
  const orders = getFakePayPalOrders();
  const order = orders.get(orderId);
  if (!order) throw new Error(`Fake PayPal order not found: ${orderId}`);
  orders.set(orderId, { ...order, status: "APPROVED" });
}

export interface PayPalRefund {
  id: string;
  status: string;
}

/**
 * Refund a captured PayPal payment, in full or in part. Omit amountUsd for a
 * full refund. Note: per PayPal's post-2019 policy, the original seller fee is
 * not returned, and a pro-rated share of the fixed fee is retained on partial
 * refunds — the guest still receives the full refunded amount.
 */
export async function refundPayPalCapture(
  captureId: string,
  input: {
    amountUsd?: number;
    currency?: string;
    noteToPayer?: string;
    invoiceId?: string;
    idempotencyKey: string;
  }
): Promise<PayPalRefund> {
  if (isFakePayPalMode()) {
    return { id: `FAKE-REFUND-${captureId}`, status: "COMPLETED" };
  }

  const token = await getAccessToken();
  const body: Record<string, unknown> = {};
  if (typeof input.amountUsd === "number") {
    body.amount = {
      value: input.amountUsd.toFixed(2),
      currency_code: input.currency ?? "USD",
    };
  }
  if (input.noteToPayer) body.note_to_payer = input.noteToPayer;
  if (input.invoiceId) body.invoice_id = input.invoiceId;

  const res = await fetch(
    `${getBaseUrl()}/v2/payments/captures/${captureId}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": input.idempotencyKey,
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    throw new Error(`PayPal refund failed: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as PayPalRefund;
}

export function getCaptureId(order: PayPalOrder): string | null {
  for (const unit of order.purchase_units ?? []) {
    for (const capture of unit.payments?.captures ?? []) {
      if (capture.status === "COMPLETED") {
        return capture.id;
      }
    }
  }
  return null;
}
