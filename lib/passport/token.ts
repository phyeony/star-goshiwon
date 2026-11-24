// The guest's upload link carries a random token; only its SHA-256 hash is
// stored on the booking request. Creating a new link replaces the old one.

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createPassportToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashPassportToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isValidPassportToken(hash: string | null | undefined, token: string | null | undefined): boolean {
  if (!hash || !token) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(hashPassportToken(token), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function passportLinkUrl(baseUrl: string, requestId: string, token: string): string {
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/verify`);
  url.searchParams.set("r", requestId);
  url.searchParams.set("t", token);
  return url.toString();
}
