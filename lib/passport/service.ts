// Passport photo lifecycle: link → upload (encrypted) → manager views and
// marks checked → deleted on check-out day (or 7 days after a request ends).
// Every view and change is written to passport_photo_log.

import { getSupabaseServiceClient } from "@/lib/supabase";
import { getBookingRequestById, updateBookingRequest } from "@/lib/queries";
import { sendEmail } from "@/lib/email";
import { siteConfig } from "@/lib/site-data";
import type { BookingRequestWithRoom } from "@/lib/types";
import { decrypt, encrypt, passportKey } from "./crypto";
import { canUpload, deleteReason, ENDED_STATUSES, type DeleteReason } from "./retention";
import { getPassportBucket } from "./storage";
import { createPassportToken, hashPassportToken, isValidPassportToken, passportLinkUrl } from "./token";

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export interface PassportPhoto {
  id: string;
  booking_request_id: string;
  object_key: string;
  iv: string;
  content_type: string;
  size_bytes: number;
  consent_at: string;
  uploaded_at: string;
  deleted_at: string | null;
  delete_reason: string | null;
}

export interface PassportLogEntry {
  action: string;
  actor: string;
  at: string;
}

type LogAction = "upload" | "view" | "checked" | "delete" | "auto_delete" | "link_created" | "link_sent";

const db = () => getSupabaseServiceClient();

function must<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data;
}

export async function logPassport(requestId: string, photoId: string | null, action: LogAction, actor: string) {
  must(await db().from("passport_photo_log").insert({ booking_request_id: requestId, photo_id: photoId, action, actor }));
}

export async function getActivePhoto(requestId: string): Promise<PassportPhoto | null> {
  const rows = must(
    await db()
      .from("passport_photos")
      .select("*")
      .eq("booking_request_id", requestId)
      .is("deleted_at", null)
      .order("uploaded_at", { ascending: false })
      .limit(1),
  ) as PassportPhoto[] | null;
  return rows?.[0] ?? null;
}

/** The latest photo row, deleted or not: shows that a check happened. */
export async function getLatestPhoto(requestId: string): Promise<PassportPhoto | null> {
  const rows = must(
    await db()
      .from("passport_photos")
      .select("*")
      .eq("booking_request_id", requestId)
      .order("uploaded_at", { ascending: false })
      .limit(1),
  ) as PassportPhoto[] | null;
  return rows?.[0] ?? null;
}

export async function getPassportLog(requestId: string, limit = 20): Promise<PassportLogEntry[]> {
  return (must(
    await db()
      .from("passport_photo_log")
      .select("action, actor, at")
      .eq("booking_request_id", requestId)
      .order("at", { ascending: false })
      .limit(limit),
  ) ?? []) as PassportLogEntry[];
}

/** Issues a new upload link (the previous one stops working). */
export async function createPassportLink(requestId: string, actor: string): Promise<string> {
  const token = createPassportToken();
  await updateBookingRequest(requestId, {
    passport_token_hash: hashPassportToken(token),
    passport_token_created_at: new Date().toISOString(),
  });
  await logPassport(requestId, null, "link_created", actor);
  return passportLinkUrl(siteConfig.url, requestId, token);
}

export type LinkCheck =
  | { ok: true; request: BookingRequestWithRoom }
  | { ok: false; reason: "invalid" | "closed" };

/** Validates a guest's link. "closed": the request ended or check-out passed. */
export async function checkPassportLink(requestId: string | undefined, token: string | undefined, now = new Date()): Promise<LinkCheck> {
  if (!requestId || !token || !/^[0-9a-f-]{36}$/i.test(requestId)) return { ok: false, reason: "invalid" };
  const request = await getBookingRequestById(requestId);
  if (!request || !isValidPassportToken(request.passport_token_hash, token)) return { ok: false, reason: "invalid" };
  if (!canUpload(request, now)) return { ok: false, reason: "closed" };
  return { ok: true, request };
}

export type UploadResult = { ok: true } | { ok: false; error: "invalid_link" | "link_closed" | "bad_file" | "too_large" | "no_consent" };

export async function uploadPassportPhoto(args: {
  requestId: string | undefined;
  token: string | undefined;
  consent: boolean;
  file: { type: string; size: number; arrayBuffer(): Promise<ArrayBuffer> } | null;
}): Promise<UploadResult> {
  const link = await checkPassportLink(args.requestId, args.token);
  if (!link.ok) return { ok: false, error: link.reason === "invalid" ? "invalid_link" : "link_closed" };
  if (!args.consent) return { ok: false, error: "no_consent" };
  if (!args.file || !ALLOWED_TYPES.includes(args.file.type)) return { ok: false, error: "bad_file" };
  if (args.file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "too_large" };

  const request = link.request;
  const plain = await args.file.arrayBuffer();
  const { data, iv } = await encrypt(await passportKey(), plain);
  const objectKey = `${crypto.randomUUID()}.bin`; // no names or ids in the key
  const bucket = await getPassportBucket();
  await bucket.put(objectKey, data, { httpMetadata: { contentType: "application/octet-stream" } });

  const now = new Date().toISOString();
  let inserted: { id: string };
  try {
    inserted = must(
      await db()
        .from("passport_photos")
        .insert({
          booking_request_id: request.id,
          object_key: objectKey,
          iv,
          content_type: args.file.type,
          size_bytes: plain.byteLength,
          consent_at: now,
          uploaded_at: now,
        })
        .select("id")
        .single(),
    ) as { id: string };
  } catch (e) {
    await bucket.delete(objectKey).catch(() => {});
    throw e;
  }

  // A new upload replaces any earlier photo, and needs checking again.
  const older = (must(
    await db()
      .from("passport_photos")
      .select("*")
      .eq("booking_request_id", request.id)
      .is("deleted_at", null)
      .neq("id", inserted.id),
  ) ?? []) as PassportPhoto[];
  for (const p of older) await removePhoto(p, "replaced");
  if (request.passport_checked_at) await updateBookingRequest(request.id, { passport_checked_at: null });

  await logPassport(request.id, inserted.id, "upload", "guest");
  await notifyManager(request).catch((e) => console.error("passport: admin email failed", e));
  return { ok: true };
}

async function notifyManager(request: BookingRequestWithRoom) {
  const to = process.env.ADMIN_EMAIL || siteConfig.email;
  const link = `${siteConfig.url}/admin/requests/${request.id}`;
  const subject = `여권 사진 도착 - ${request.guest_name}님`;
  const text = `${request.guest_name}님이 여권 사진을 올렸습니다.\n체크인 ${request.check_in_date} · 체크아웃 ${request.check_out_date}\n\n확인하기: ${link}\n\n사진은 이메일에 첨부되지 않습니다. 관리자 페이지에서만 볼 수 있습니다.`;
  await sendEmail(to, subject, text);
}

/** Decrypts the active photo for the admin page, and logs the view. */
export async function readPassportPhoto(requestId: string, actor: string): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  const photo = await getActivePhoto(requestId);
  if (!photo) return null;
  const obj = await (await getPassportBucket()).get(photo.object_key);
  if (!obj) return null;
  const bytes = await decrypt(await passportKey(), await obj.arrayBuffer(), photo.iv);
  await logPassport(requestId, photo.id, "view", actor);
  return { bytes, contentType: photo.content_type };
}

export async function markPassportChecked(requestId: string, actor: string) {
  const photo = await getActivePhoto(requestId);
  await updateBookingRequest(requestId, { passport_checked_at: new Date().toISOString() });
  await logPassport(requestId, photo?.id ?? null, "checked", actor);
}

async function removePhoto(photo: PassportPhoto, reason: string) {
  await (await getPassportBucket()).delete(photo.object_key);
  must(
    await db()
      .from("passport_photos")
      .update({ deleted_at: new Date().toISOString(), delete_reason: reason })
      .eq("id", photo.id),
  );
}

/** Manager's "delete now". */
export async function deletePassportPhoto(requestId: string, actor: string): Promise<boolean> {
  const photo = await getActivePhoto(requestId);
  if (!photo) return false;
  await removePhoto(photo, "manager");
  await logPassport(requestId, photo.id, "delete", actor);
  return true;
}

/** Daily job: deletes every photo whose request reached its delete date. */
export async function cleanupPassportPhotos(now = new Date()): Promise<{ deleted: number; reasons: Record<DeleteReason, number> }> {
  const active = (must(
    await db()
      .from("passport_photos")
      .select("*, booking_requests(status, check_out_date, updated_at, status_changed_at)")
      .is("deleted_at", null),
  ) ?? []) as (PassportPhoto & {
    booking_requests: { status: (typeof ENDED_STATUSES)[number] | string; check_out_date: string; updated_at: string; status_changed_at: string | null } | null;
  })[];

  const reasons: Record<DeleteReason, number> = { checked_out: 0, request_ended: 0 };
  let deleted = 0;
  for (const photo of active) {
    const r = photo.booking_requests;
    // A photo whose request vanished is deleted too.
    const reason = r ? deleteReason(r as Parameters<typeof deleteReason>[0], now) : "request_ended";
    if (!reason) continue;
    try {
      await removePhoto(photo, reason);
      await logPassport(photo.booking_request_id, photo.id, "auto_delete", `system:${reason}`);
      reasons[reason]++;
      deleted++;
    } catch (e) {
      console.error("passport cleanup: delete failed", photo.id, e);
    }
  }
  return { deleted, reasons };
}
