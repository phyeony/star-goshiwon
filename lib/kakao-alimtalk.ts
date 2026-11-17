/**
 * KakaoTalk 알림톡 via Sendon (센드온).
 * API: POST https://api.sendon.io/v2/messages/kakao/alim-talk
 * Auth: Basic base64(SENDON_ID:SENDON_API_KEY). Sendon only accepts calls from
 * IPs on the account's whitelist (마이페이지 > API KEY).
 *
 * Templates are approved by Kakao and referenced by the template ID Sendon
 * shows. Buttons and fallback text live on the template itself.
 */
import { formatManwon } from "./ko-site";

const SENDON_ALIMTALK_URL = "https://api.sendon.io/v2/messages/kakao/alim-talk";

export type AlimtalkTemplate =
  | "ko_booking_received_v1"
  | "ko_booking_confirmed_v1"
  | "ko_monthly_rent_due_v1";

/** Env var holding the Sendon template ID for each template code. */
const templateEnv: Record<AlimtalkTemplate, string> = {
  ko_booking_received_v1: "SENDON_TEMPLATE_BOOKING_RECEIVED",
  ko_booking_confirmed_v1: "SENDON_TEMPLATE_BOOKING_CONFIRMED",
  ko_monthly_rent_due_v1: "SENDON_TEMPLATE_MONTHLY_RENT_DUE",
};

export type AlimtalkResult =
  | { ok: true; groupId: string | null; to: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped?: false; code: number | null; message: string };

/** Test hook: calls made while E2E_TEST_MODE is on are recorded here instead of sent. */
export const alimtalkTestOutbox: { template: AlimtalkTemplate; to: string; variables: Record<string, string> }[] = [];

/** "010-1234-5678" -> "01012345678" (Sendon wants digits only). */
export function toSendonPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** "2026-12-01" -> "2026년 12월 1일" */
export function formatKoDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

/** Variables for ko_booking_received_v1. Keys must match the approved template exactly. */
export function bookingReceivedVariables(input: {
  guest_name: string;
  room_name: string;
  move_in_date: string;
  stay_months: number;
  monthly_rate_krw: number | null;
}): Record<string, string> {
  return {
    "#{이름}": input.guest_name,
    "#{방이름}": input.room_name,
    "#{입실일}": formatKoDate(input.move_in_date),
    "#{기간}": String(input.stay_months),
    "#{월이용료}": input.monthly_rate_krw != null ? formatManwon(input.monthly_rate_krw) : "문의",
  };
}

export async function sendAlimtalk(
  template: AlimtalkTemplate,
  phone: string,
  variables: Record<string, string>,
  env: Record<string, string | undefined> = process.env,
): Promise<AlimtalkResult> {
  let to = toSendonPhone(phone);

  if (env.E2E_TEST_MODE === "true") {
    alimtalkTestOutbox.push({ template, to, variables });
    return { ok: false, skipped: true, reason: "E2E_TEST_MODE" };
  }

  const id = env.SENDON_ID;
  const apiKey = env.SENDON_API_KEY;
  const profileId = env.SENDON_PROFILE_ID;
  const templateId = env[templateEnv[template]];
  if (!id || !apiKey || !profileId || !templateId) {
    return { ok: false, skipped: true, reason: "Sendon env vars not set" };
  }

  // Local dev and staging: send every 알림톡 to the tester's phone, never a guest's.
  const isNonProd = env.NODE_ENV === "development" || env.STAGING === "true";
  if (isNonProd) {
    if (!env.ALIMTALK_DEV_PHONE_OVERRIDE) {
      return { ok: false, skipped: true, reason: "non-prod without ALIMTALK_DEV_PHONE_OVERRIDE" };
    }
    to = toSendonPhone(env.ALIMTALK_DEV_PHONE_OVERRIDE);
  }

  const res = await fetch(SENDON_ALIMTALK_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${id}:${apiKey}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sendProfileId: profileId,
      templateId,
      to: [{ phone: to, variables }],
      // ALIMTALK_FALLBACK=template sends the SMS text saved on the template
      // when KakaoTalk delivery fails. Off by default: it errors if the
      // template has no fallback text.
      fallback: { fallbackType: env.ALIMTALK_FALLBACK === "template" ? "TEMPLATE" : "NONE" },
    }),
  });

  // Sendon answers HTTP 200 and puts the real status in body.code.
  let body: { code?: number; message?: string; data?: { groupId?: string } } = {};
  try {
    body = await res.json();
  } catch {
    // fall through with an empty body
  }
  const code = typeof body.code === "number" ? body.code : res.status;
  if (res.ok && code === 200) {
    return { ok: true, groupId: body.data?.groupId ?? null, to };
  }
  return { ok: false, code, message: body.message ?? `HTTP ${res.status}` };
}
