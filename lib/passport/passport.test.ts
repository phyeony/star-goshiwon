import { describe, expect, it } from "vitest";
import { bytesToB64, decrypt, encrypt, importKey } from "./crypto";
import { verificationMessage } from "./messages";
import { canUpload, deleteReason, seoulToday } from "./retention";
import { createPassportToken, hashPassportToken, isValidPassportToken, passportLinkUrl } from "./token";

const KEY = bytesToB64(new Uint8Array(32).map((_, i) => i));

describe("passport retention", () => {
  // 2026-12-15 03:00 UTC = 12:00 KST, when the daily job runs.
  const now = new Date("2026-12-15T03:00:00Z");

  it("uses the Seoul date", () => {
    expect(seoulToday(new Date("2026-12-14T15:30:00Z"))).toBe("2026-12-15");
    expect(seoulToday(new Date("2026-12-14T14:30:00Z"))).toBe("2026-12-14");
  });

  it("deletes on the check-out day, whatever the status", () => {
    expect(deleteReason({ status: "confirmed", check_out_date: "2026-12-15", updated_at: "2026-11-01T00:00:00Z" }, now)).toBe("checked_out");
    expect(deleteReason({ status: "new", check_out_date: "2026-12-10", updated_at: "2026-11-01T00:00:00Z" }, now)).toBe("checked_out");
  });

  it("keeps it during the stay", () => {
    expect(deleteReason({ status: "confirmed", check_out_date: "2026-12-16", updated_at: "2026-11-01T00:00:00Z" }, now)).toBeNull();
  });

  it("deletes 7 days after a request is declined, expired or closed", () => {
    const base = { check_out_date: "2027-01-31" };
    expect(deleteReason({ ...base, status: "declined", updated_at: "2026-12-08T03:00:00Z" }, now)).toBe("request_ended");
    expect(deleteReason({ ...base, status: "expired", updated_at: "2026-12-09T00:00:00Z" }, now)).toBeNull();
    expect(deleteReason({ ...base, status: "closed", updated_at: "2026-12-01T00:00:00Z" }, now)).toBe("request_ended");
    expect(deleteReason({ ...base, status: "approved", updated_at: "2026-11-01T00:00:00Z" }, now)).toBeNull();
  });

  it("only takes uploads for live requests before check-out", () => {
    expect(canUpload({ status: "approved", check_out_date: "2026-12-16" }, now)).toBe(true);
    expect(canUpload({ status: "approved", check_out_date: "2026-12-15" }, now)).toBe(false);
    expect(canUpload({ status: "declined", check_out_date: "2027-01-01" }, now)).toBe(false);
  });
});

describe("passport encryption", () => {
  it("round-trips and uses a fresh IV each time", async () => {
    const key = await importKey(KEY);
    const plain = new TextEncoder().encode("photo bytes").buffer as ArrayBuffer;
    const a = await encrypt(key, plain);
    const b = await encrypt(key, plain);
    expect(a.iv).not.toBe(b.iv);
    expect(new Uint8Array(a.data)).not.toEqual(new Uint8Array(plain));
    expect(new TextDecoder().decode(await decrypt(key, a.data, a.iv))).toBe("photo bytes");
  });

  it("rejects a tampered file or wrong key", async () => {
    const key = await importKey(KEY);
    const { data, iv } = await encrypt(key, new Uint8Array([1, 2, 3]).buffer as ArrayBuffer);
    const bad = new Uint8Array(data);
    bad[0] ^= 1;
    await expect(decrypt(key, bad.buffer, iv)).rejects.toThrow();
    const other = await importKey(bytesToB64(new Uint8Array(32).fill(7)));
    await expect(decrypt(other, data, iv)).rejects.toThrow();
  });

  it("refuses a missing or short key", async () => {
    await expect(importKey(undefined)).rejects.toThrow(/32 bytes/);
    await expect(importKey(bytesToB64(new Uint8Array(16)))).rejects.toThrow(/32 bytes/);
  });
});

describe("passport link token", () => {
  it("validates only the current token", () => {
    const t = createPassportToken();
    const hash = hashPassportToken(t);
    expect(isValidPassportToken(hash, t)).toBe(true);
    expect(isValidPassportToken(hash, createPassportToken())).toBe(false);
    expect(isValidPassportToken(null, t)).toBe(false);
    expect(isValidPassportToken(hash, "")).toBe(false);
  });

  it("builds the /verify link", () => {
    expect(passportLinkUrl("https://goshiwonseoul.com/", "abc", "tok")).toBe("https://goshiwonseoul.com/verify?r=abc&t=tok");
  });
});

describe("WhatsApp verification message", () => {
  it("never asks for ID in the chat (WhatsApp policy)", () => {
    const text = verificationMessage("https://goshiwonseoul.com/verify?r=1&t=2");
    expect(text).toContain("https://goshiwonseoul.com/verify?r=1&t=2");
    expect(text).not.toMatch(/passport|\bID\b|identity|document/i);
  });
});
