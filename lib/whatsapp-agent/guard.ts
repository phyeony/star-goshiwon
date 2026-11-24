// Last check on a drafted reply before code may send it. Anything found here
// turns the turn into a handoff; the draft is still shown to the manager.

export interface GuardContext {
  // Every money amount the reply may mention, as plain numbers (USD and KRW).
  allowedAmounts: number[];
  // URLs the reply may contain. Empty = no links at all.
  allowedUrls: string[];
  // Strings that must never appear (room numbers, codes).
  forbidden: string[];
}

const MAX_LENGTH = 1200;

// $1,234 / US$12 / USD 12.50 / ₩100,000 / 100,000 KRW / 100,000 won / 10만원
const MONEY =
  /(?:US\$|\$|USD\s?|₩|KRW\s?)\s?(\d[\d,]*(?:\.\d+)?)|(\d[\d,]*(?:\.\d+)?)\s?(?:USD|KRW|won|원|dollars?)\b|(\d+(?:\.\d+)?)\s?만\s?원/gi;
const URL = /https?:\/\/[^\s)>\]]+/gi;
const ID_DOCUMENT =
  /\bpassports?\b|\bid cards?\b|\bnational id\b|\bidentity (?:card|document)s?\b|\b(?:photo|picture|copy|scan) of (?:your|the|an?) (?:id|visa)\b|여권|신분증/i;

function toNumber(raw: string): number {
  return Number(raw.replace(/,/g, ""));
}

export function findAmounts(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(MONEY)) {
    if (m[1] ?? m[2]) out.push(toNumber((m[1] ?? m[2])!));
    else if (m[3]) out.push(Math.round(Number(m[3]) * 10_000));
  }
  return out;
}

export function checkReply(reply: string, ctx: GuardContext): string[] {
  const problems: string[] = [];
  const text = reply.trim();
  if (!text) problems.push("empty reply");
  if (text.length > MAX_LENGTH) problems.push("reply too long");

  const allowed = new Set(ctx.allowedAmounts.map((n) => Math.round(n * 100)));
  for (const amount of findAmounts(text)) {
    if (!allowed.has(Math.round(amount * 100))) {
      problems.push(`amount not from the site or the price calculator: ${amount}`);
    }
  }

  const urls = ctx.allowedUrls.map((u) => u.replace(/\/$/, ""));
  for (const m of text.matchAll(URL)) {
    const url = m[0].replace(/[.,!?]+$/, "").replace(/\/$/, "");
    if (!urls.includes(url)) problems.push(`link not allowed: ${url}`);
  }
  if (/paypal\.(com|me)/i.test(text)) problems.push("payment link");

  for (const s of ctx.forbidden) {
    if (s && new RegExp(`(^|[^\\d])${escapeRegExp(s)}([^\\d]|$)`, "i").test(text)) {
      problems.push(`forbidden text: ${s}`);
    }
  }
  if (/\bas an ai\b/i.test(text)) problems.push("'as an AI' phrasing");
  // WhatsApp's Business Messaging Policy: never ask people to share ID on
  // WhatsApp. Identity checks go through a secure link on the website.
  if (ID_DOCUMENT.test(text)) problems.push("mentions ID documents");
  return problems;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
