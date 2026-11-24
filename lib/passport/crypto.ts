// AES-256-GCM encryption for passport photos at rest (Web Crypto, works in
// the Worker and in Node). The key is PASSPORT_ENCRYPTION_KEY: 32 random
// bytes, base64 (`openssl rand -base64 32`). The IV is stored per photo.

const IV_BYTES = 12;

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export async function importKey(base64Key: string | undefined): Promise<CryptoKey> {
  const raw = base64Key ? b64ToBytes(base64Key.trim()) : new Uint8Array(0);
  if (raw.length !== 32) {
    throw new Error("PASSPORT_ENCRYPTION_KEY must be 32 bytes, base64 (openssl rand -base64 32)");
  }
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encrypt(key: CryptoKey, plain: ArrayBuffer): Promise<{ data: ArrayBuffer; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
  return { data, iv: bytesToB64(iv) };
}

export async function decrypt(key: CryptoKey, data: ArrayBuffer, iv: string): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToBytes(iv) }, key, data);
}

export function passportKey(): Promise<CryptoKey> {
  return importKey(process.env.PASSPORT_ENCRYPTION_KEY);
}
