import { expect, test, type APIRequestContext } from "@playwright/test";

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

async function fixture(
  request: APIRequestContext,
  data: Record<string, unknown>
) {
  const res = await request.post("/api/test/document-fixture", { data });
  expect(res.ok()).toBeTruthy();
  return res.json();
}

async function createBooking(request: APIRequestContext) {
  return (await fixture(request, { action: "create-booking" })) as {
    id: string;
    guestEmail: string;
  };
}

async function sendDocument(
  request: APIRequestContext,
  data: Record<string, unknown>
) {
  return (await fixture(request, { action: "send", ...data })) as {
    status: string;
    emailSendId?: string;
    to?: string;
    subject?: string;
  };
}

const form = {
  passportNumber: "M99887766",
  nationality: "United States",
  dateOfBirth: "1995-03-14",
  homeAddress: "1 Main St, Springfield, USA",
  specialTerms: "",
  issueDate: "2026-08-04",
};

test.afterEach(async ({ request }) => {
  // Templates are global state — never leave one behind for the next test.
  await fixture(request, {
    action: "clear-template",
    type: "contract",
    lang: "ko",
  });
});

test("admin sends the built-in Korean residence letter to the guest", async ({
  request,
}) => {
  await clearEmailOutbox(request);
  const booking = await createBooking(request);

  const result = await sendDocument(request, {
    requestId: booking.id,
    type: "letter",
    lang: "ko",
    form,
  });

  expect(result.status).toBe("sent");
  expect(result.emailSendId).toBeTruthy(); // audit row written
  expect(result.to).toBe(booking.guestEmail);

  const email = await findEmail(request, "체류(숙소) 확인서");
  expect(email.html).toContain("M99887766");
  expect(email.html).toContain("Playwright Document Guest");
  expect(email.html).toContain("2026년 6월 1일");
  expect(email.html).toContain("사업자등록번호");
  expect(email.html).toContain("PDF로 저장");
});

test("admin sends the built-in English accommodation agreement", async ({
  request,
}) => {
  await clearEmailOutbox(request);
  const booking = await createBooking(request);

  const result = await sendDocument(request, {
    requestId: booking.id,
    type: "contract",
    lang: "en",
    form: { ...form, specialTerms: "Key returned at check-out." },
  });
  expect(result.status).toBe("sent");

  const email = await findEmail(request, "Accommodation Agreement");
  expect(email.html).toContain("Key returned at check-out.");
  expect(email.html).toContain("not a residential lease");
  // The agreement must never be framed as a Korean residential lease.
  expect(email.html).not.toContain("임대차계약서");
});

test("admin sends the payment receipt that immigration asks for", async ({
  request,
}) => {
  await clearEmailOutbox(request);
  const booking = await createBooking(request);

  const result = await sendDocument(request, {
    requestId: booking.id,
    type: "receipt",
    lang: "ko",
    form,
  });
  expect(result.status).toBe("sent");

  const email = await findEmail(request, "숙박료 영수증");
  // What makes a receipt usable as 체류지 payment proof: the address, the
  // period, and the guest's name.
  expect(email.html).toContain("Playwright Document Guest");
  expect(email.html).toContain("최초입실일");
  expect(email.html).toContain("사업자등록번호");
  expect(email.html).toContain("PayPal");
  // The rows must sum back to the charged total, not read as deposit-on-top.
  expect(email.html).toContain("결제 총액");
});

test("the bilingual letter prints both languages on one document", async ({
  request,
}) => {
  await clearEmailOutbox(request);
  const booking = await createBooking(request);

  const result = await sendDocument(request, {
    requestId: booking.id,
    type: "letter",
    lang: "bi",
    form,
  });
  expect(result.status).toBe("sent");

  const email = await findEmail(request, "체류(숙소) 확인서");
  expect(email.html).toContain("성명 / Name");
  expect(email.html).toContain("여권번호 / Passport number");
  // Both statements, so an officer reading either language gets the full text.
  expect(email.html).toContain("확인합니다");
  expect(email.html).toContain("This is to certify");
});

test("the letter tells the guest which attachments must go with it", async ({
  request,
}) => {
  await clearEmailOutbox(request);
  const booking = await createBooking(request);

  await sendDocument(request, {
    requestId: booking.id,
    type: "letter",
    lang: "ko",
    form,
  });

  // 출입국 returns the letter when it arrives without the other two documents.
  const email = await findEmail(request, "체류(숙소) 확인서");
  expect(email.html).toContain("사업자등록증 사본");
  expect(email.html).toContain("숙박료 영수증");
});

test("an uploaded template replaces the document, and deleting it restores the built-in one", async ({
  request,
}) => {
  const booking = await createBooking(request);

  await fixture(request, {
    action: "set-template",
    type: "contract",
    lang: "ko",
    title: "우리 숙소 계약서",
    bodyHtml:
      "<h2>제1조</h2><p>이용자 {{guest_name}} (여권 {{passport_number}})</p><p>객실 {{room_name}} / {{period}}</p>",
  });

  await clearEmailOutbox(request);
  const sent = await sendDocument(request, {
    requestId: booking.id,
    type: "contract",
    lang: "ko",
    form,
  });
  expect(sent.status).toBe("sent");

  const custom = await findEmail(request, "우리 숙소 계약서");
  expect(custom.html).toContain("제1조");
  expect(custom.html).toContain("이용자 Playwright Document Guest");
  expect(custom.html).toContain("여권 M99887766");
  expect(custom.html).not.toContain("{{");
  // The built-in contract's clause list is gone — this is the uploaded form.
  expect(custom.html).not.toContain("이용 규칙");

  await fixture(request, {
    action: "clear-template",
    type: "contract",
    lang: "ko",
  });

  await clearEmailOutbox(request);
  await sendDocument(request, {
    requestId: booking.id,
    type: "contract",
    lang: "ko",
    form,
  });

  const builtIn = await findEmail(request, "숙소 이용 계약서");
  expect(builtIn.html).toContain("주택임대차보호법");
});

test("sending a document for an unknown booking reports not_found", async ({
  request,
}) => {
  const result = await sendDocument(request, {
    requestId: "00000000-0000-0000-0000-000000000000",
    type: "letter",
    lang: "ko",
    form,
  });
  expect(result.status).toBe("not_found");
});
