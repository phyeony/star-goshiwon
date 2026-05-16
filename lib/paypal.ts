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
}): Promise<{ orderId: string; approvalUrl: string; raw: PayPalOrder }> {
  const token = await getAccessToken();
  const amount = input.amountUsd.toFixed(2);

  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `create-${input.requestId}-${input.amountUsd}`,
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
  const token = await getAccessToken();
  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `capture-${requestId}-${orderId}`,
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

export function getCaptureId(order: PayPalOrder): string | null {
  for (const unit of order.purchase_units ?? []) {
    for (const capture of unit.payments?.captures ?? []) {
      if (capture.status === "COMPLETED" || capture.status === "PENDING") {
        return capture.id;
      }
    }
  }
  return null;
}
