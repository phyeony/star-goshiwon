// Meta signs every webhook POST with the app secret:
//   X-Hub-Signature-256: sha256=<hex HMAC-SHA256 of the raw body>
// Web Crypto only, so it runs the same in Workers and in Node tests.

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Compares every character, so the time taken doesn't reveal how much matched.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signBody(rawBody: string, appSecret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return `sha256=${toHex(await crypto.subtle.sign("HMAC", key, enc.encode(rawBody)))}`;
}

export async function verifyMetaSignature(
  rawBody: string,
  header: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!header || !appSecret) return false;
  const expected = await signBody(rawBody, appSecret);
  return timingSafeEqual(header.trim().toLowerCase(), expected);
}
