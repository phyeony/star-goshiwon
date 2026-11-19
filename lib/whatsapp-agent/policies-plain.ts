import { POLICIES_TEMPLATE } from "./policies-template.generated";

// The /policies text for the live agent, from the pre-rendered copy (see
// policies-text.ts for why). Same output as policiesPlainText(discountPct).
export function policiesText(discountPct: number): string {
  return POLICIES_TEMPLATE.replaceAll("{{DISCOUNT_PCT}}", String(discountPct));
}
