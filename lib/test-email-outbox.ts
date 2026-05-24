export interface TestEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
  sentAt: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __goshiwonTestEmailOutbox: TestEmail[] | undefined;
}

function requireTestMode() {
  if (process.env.E2E_TEST_MODE !== "true") {
    throw new Error("Test email outbox is only available in E2E test mode");
  }
}

export function storeTestEmail(email: Omit<TestEmail, "sentAt">) {
  requireTestMode();
  globalThis.__goshiwonTestEmailOutbox ??= [];
  globalThis.__goshiwonTestEmailOutbox.push({
    ...email,
    sentAt: new Date().toISOString(),
  });
}

export function getTestEmails() {
  requireTestMode();
  return globalThis.__goshiwonTestEmailOutbox ?? [];
}

export function clearTestEmails() {
  requireTestMode();
  globalThis.__goshiwonTestEmailOutbox = [];
}
