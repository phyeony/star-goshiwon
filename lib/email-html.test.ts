import { describe, expect, it } from "vitest";
import { textToEmailHtml } from "./email-html";

describe("textToEmailHtml", () => {
  it("renders a standalone payment review URL as a CTA button", () => {
    const url =
      "https://staging.goshiwonseoul.com/booking-payment/pay?request_id=a207cce0-8fe7-48ad-8503-ca82237a2d82";

    const html = textToEmailHtml(`Please pay here:\n\n${url}\n\nThank you.`);

    expect(html).toContain(`href="${url}"`);
    expect(html).toContain(">Review and pay securely</a>");
    expect(html).not.toContain(`text-decoration: underline;">${url}</a>`);
  });
});
