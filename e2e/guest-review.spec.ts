import { expect, test, type APIRequestContext } from "@playwright/test";

async function createInvite(
  request: APIRequestContext,
  overrides: Record<string, unknown> = {}
) {
  const res = await request.post("/api/test/review-fixture", {
    data: { action: "create-invite", ...overrides },
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as { id: string; token: string; url: string };
}

test("guest submits a review, admin approves, review appears on /reviews", async ({
  page,
  request,
}) => {
  // Unique per run — supabase-dev keeps rows from earlier runs, and duplicate
  // text would trip Playwright's strict-mode locators on /reviews.
  const stamp = Date.now();
  const guestName = `Playwright Reviewer ${stamp}`;
  const positiveText = `Great view from the room. (${stamp})`;
  const invite = await createInvite(request, { guestName });

  await page.goto(invite.url);
  await expect(
    page.getByRole("heading", { name: "How was your stay?" })
  ).toBeVisible();

  // Name arrives pre-filled from the invite.
  await expect(page.getByLabel(/Your name/)).toHaveValue(guestName);

  await page.getByRole("button", { name: "9", exact: true }).click();
  await page.getByRole("button", { name: "Staff: 10 out of 10" }).click();
  await page.getByLabel(/What did you like/).fill(positiveText);
  await page.getByLabel(/Country/).fill("US");
  await page.getByRole("button", { name: "Submit review" }).click();

  await expect(page.getByText("Thank you for your review!")).toBeVisible();

  // The link is single-use.
  await page.goto(invite.url);
  await expect(
    page.getByText("This review link has already been used")
  ).toBeVisible();

  // Pending reviews are not public.
  await page.goto("/reviews");
  await expect(page.getByText(guestName)).toHaveCount(0);

  // Admin approves (via test fixture; the admin UI needs a Supabase login).
  const approve = await request.post("/api/test/review-fixture", {
    data: { action: "set-status", inviteId: invite.id, status: "approved" },
  });
  expect(approve.ok()).toBeTruthy();

  await page.goto("/reviews");
  await expect(page.getByText(new RegExp(guestName))).toBeVisible();
  await expect(page.getByText("Verified direct stay").first()).toBeVisible();
  await expect(page.getByText(positiveText)).toBeVisible();
});

test("a low score requires a comment before submitting", async ({
  page,
  request,
}) => {
  const invite = await createInvite(request);

  await page.goto(invite.url);
  await page.getByRole("button", { name: "2", exact: true }).click();
  await page.getByRole("button", { name: "Submit review" }).click();

  await expect(page.getByText(/please add a short comment/i)).toBeVisible();

  await page.getByLabel(/What could be better/).fill("Room was too noisy.");
  await page.getByRole("button", { name: "Submit review" }).click();
  await expect(page.getByText("Thank you for your review!")).toBeVisible();
});

test("an expired invite link shows the expired notice", async ({
  page,
  request,
}) => {
  const invite = await createInvite(request, { expired: true });

  await page.goto(invite.url);
  await expect(page.getByText("This review link has expired")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit review" })).toHaveCount(
    0
  );
});
