import { describe, expect, it } from "vitest";
import { replacePaymentReviewUrls } from "./payment-url-utils";

describe("replacePaymentReviewUrls", () => {
  it("replaces a pre-substituted request-id-only payment URL with the tokenized URL", () => {
    const requestId = "c3ab1fe9-0975-43c8-a25d-a560308abed1";
    const staleUrl = `https://staging.goshiwonseoul.com/booking-payment/pay?request_id=${requestId}`;
    const tokenizedUrl = `${staleUrl}&payment_token=private-token`;

    const text = `Please pay here:\n${staleUrl}\nThanks`;

    expect(replacePaymentReviewUrls(text, requestId, tokenizedUrl)).toBe(
      `Please pay here:\n${tokenizedUrl}\nThanks`
    );
  });

  it("replaces an older tokenized URL when resending a fresh token", () => {
    const requestId = "c3ab1fe9-0975-43c8-a25d-a560308abed1";
    const staleUrl = `https://staging.goshiwonseoul.com/booking-payment/pay?request_id=${requestId}&payment_token=old-token`;
    const tokenizedUrl = `https://staging.goshiwonseoul.com/booking-payment/pay?request_id=${requestId}&payment_token=new-token`;

    expect(replacePaymentReviewUrls(staleUrl, requestId, tokenizedUrl)).toBe(
      tokenizedUrl
    );
  });
});
