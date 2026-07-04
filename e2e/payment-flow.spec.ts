import { expect, test, type APIRequestContext } from "@playwright/test";

test("guest can complete payment through fake PayPal", async ({ page, request }) => {
  await clearEmailOutbox(request);
  const fixture = await createPaymentFixture(request, { sendEmail: true });
  const email = await findEmail(request, "Your booking request is approved");
  const emailPayUrl = extractPaymentHref(email.html);

  expect(emailPayUrl).toContain("payment_token=");
  expect(email.to).toContain("@example.com");
  expect(email.html).toContain("Review and pay securely");
  expect(email.html).not.toContain(
    `text-decoration: underline;">${emailPayUrl}</a>`
  );

  await page.goto(emailPayUrl);
  await expect(page.getByRole("heading", { name: "Review and pay securely" })).toBeVisible();
  await page.getByRole("button", { name: "Continue to PayPal" }).click();

  await expect(page.getByRole("heading", { name: "Fake PayPal" })).toBeVisible();
  await expect(page.getByText(/Order FAKE-PAYPAL-/)).toBeVisible();
  await page.getByRole("link", { name: "Approve payment" }).click();

  await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible();
  await expect(page.getByText("Your booking is confirmed.")).toBeVisible();

  await page.goto(fixture.payUrl);
  await expect(page.getByText("This booking is already paid and confirmed.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue to PayPal" })).toHaveCount(0);
});

test("request id alone cannot open the payment review page", async ({
  page,
  request,
}) => {
  const fixture = await createPaymentFixture(request);

  await page.goto(fixture.unsafePayUrl);

  await expect(page.getByRole("heading", { name: "Review and pay securely" })).toHaveCount(0);
});

test("repeated Continue to PayPal clicks reuse the active PayPal order", async ({
  page,
  request,
}) => {
  const fixture = await createPaymentFixture(request);

  await page.goto(fixture.payUrl);
  await page.getByRole("button", { name: "Continue to PayPal" }).click();
  await expect(page.getByRole("heading", { name: "Fake PayPal" })).toBeVisible();
  const firstOrder = await page.getByText(/Order FAKE-PAYPAL-/).textContent();

  await page.goto(fixture.payUrl);
  await page.getByRole("button", { name: "Continue to PayPal" }).click();
  await expect(page.getByRole("heading", { name: "Fake PayPal" })).toBeVisible();
  const secondOrder = await page.getByText(/Order FAKE-PAYPAL-/).textContent();

  expect(secondOrder).toBe(firstOrder);
});

test("expired payment window blocks PayPal start", async ({ page, request }) => {
  const fixture = await createPaymentFixture(request, { expired: true });

  await page.goto(fixture.payUrl);

  await expect(page.getByText("This payment link has expired.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue to PayPal" })).toHaveCount(0);
});

test("guest can cancel fake PayPal and retry from the site link", async ({
  page,
  request,
}) => {
  const fixture = await createPaymentFixture(request);

  await page.goto(fixture.payUrl);
  await page.getByRole("button", { name: "Continue to PayPal" }).click();
  await expect(page.getByRole("heading", { name: "Fake PayPal" })).toBeVisible();
  await page.getByRole("link", { name: "Cancel" }).click();

  await expect(page.getByRole("heading", { name: "Payment cancelled" })).toBeVisible();
  await page.getByRole("link", { name: "Review and try again" }).click();
  await expect(page.getByRole("heading", { name: "Review and pay securely" })).toBeVisible();
});

test("admin can refund the deposit on a paid booking", async ({
  page,
  request,
}) => {
  const fixture = await createPaymentFixture(request);

  // Drive a real fake-PayPal payment so a capture id is stored on the booking.
  await page.goto(fixture.payUrl);
  await page.getByRole("button", { name: "Continue to PayPal" }).click();
  await expect(page.getByRole("heading", { name: "Fake PayPal" })).toBeVisible();
  await page.getByRole("link", { name: "Approve payment" }).click();
  await expect(
    page.getByRole("heading", { name: "Payment received" })
  ).toBeVisible();

  // Refund only the $70 deposit — booking stays paid.
  await clearEmailOutbox(request);
  const partial = await refund(request, fixture.id, 70);
  expect(partial.fully_refunded).toBe(false);
  expect(partial.refund_amount).toBe(70);
  expect(partial.payment_status).toBe("paid");

  const refundEmail = await findEmail(request, "has been refunded");
  expect(refundEmail.html).toContain("security deposit");
  expect(refundEmail.html).toContain("$70");

  // Refunding more than the remaining balance is rejected.
  const overRes = await request.post("/api/test/refund", {
    data: { requestId: fixture.id, amountUsd: 10_000 },
  });
  expect(overRes.ok()).toBeFalsy();
  expect((await overRes.json()).error).toContain("exceeds the remaining balance");

  // Refunding the remaining balance flips the booking to refunded.
  const remaining = 158 - 70; // private-shower 1 week ($88) + deposit ($70)
  const full = await refund(request, fixture.id, remaining);
  expect(full.fully_refunded).toBe(true);
  expect(full.payment_status).toBe("refunded");
  expect(full.refund_amount).toBe(158);
});

async function refund(
  request: APIRequestContext,
  requestId: string,
  amountUsd: number
) {
  const response = await request.post("/api/test/refund", {
    data: { requestId, amountUsd },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as {
    refund_id: string;
    fully_refunded: boolean;
    refund_amount: number;
    payment_status: string;
  };
}

async function createPaymentFixture(
  request: APIRequestContext,
  body: { expired?: boolean; paid?: boolean; sendEmail?: boolean } = {}
) {
  const response = await request.post("/api/test/payment-fixture", {
    data: body,
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as {
    id: string;
    payUrl: string;
    unsafePayUrl: string;
    startUrl: string;
  };
}

async function clearEmailOutbox(request: APIRequestContext) {
  const response = await request.delete("/api/test/email-outbox");
  expect(response.ok()).toBeTruthy();
}

async function findEmail(request: APIRequestContext, subject: string) {
  const response = await request.get("/api/test/email-outbox");
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as {
    emails: { to: string; subject: string; text: string; html: string }[];
  };
  const email = body.emails.find((item) => item.subject.includes(subject));
  expect(email).toBeTruthy();
  return email!;
}

function extractPaymentHref(html: string) {
  const match = html.match(
    /href="([^"]+\/booking-payment\/pay\?request_id=[^"]+)"/
  );
  expect(match?.[1]).toBeTruthy();
  return match![1].replace(/&amp;/g, "&");
}
