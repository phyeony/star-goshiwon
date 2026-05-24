export function replacePaymentReviewUrls(
  input: string,
  requestId: string,
  paymentUrl: string
) {
  const escapedRequestId = requestId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const reviewUrlRe = new RegExp(
    `https?:\\/\\/[^\\s<>"']+\\/booking-payment\\/pay\\?request_id=${escapedRequestId}(?:&payment_token=[^\\s<>"']+)?`,
    "g"
  );
  return input.replace(reviewUrlRe, paymentUrl);
}
