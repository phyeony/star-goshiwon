import { afterEach, describe, expect, it, vi } from "vitest";
import { bookingReceivedVariables, formatKoDate, sendAlimtalk, toSendonPhone } from "./kakao-alimtalk";

const env = {
  NODE_ENV: "production",
  SENDON_ID: "star",
  SENDON_API_KEY: "key",
  SENDON_PROFILE_ID: "profile",
  SENDON_TEMPLATE_BOOKING_RECEIVED: "tpl-1",
};

afterEach(() => vi.unstubAllGlobals());

describe("kakao alimtalk", () => {
  it("formats inputs the way Sendon and the template expect", () => {
    expect(toSendonPhone("010-1234-5678")).toBe("01012345678");
    expect(formatKoDate("2026-12-01")).toBe("2026년 12월 1일");
    expect(
      bookingReceivedVariables({
        guest_name: "홍길동",
        room_name: "일반실",
        move_in_date: "2026-12-01",
        stay_months: 3,
        monthly_rate_krw: 300000,
      }),
    ).toEqual({
      "#{이름}": "홍길동",
      "#{방이름}": "일반실",
      "#{입실일}": "2026년 12월 1일",
      "#{기간}": "3",
      "#{월이용료}": "30만원",
    });
  });

  it("posts to Sendon with Basic auth and reads body.code", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 200, message: "성공", data: { groupId: "g1" } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const r = await sendAlimtalk("ko_booking_received_v1", "010-1234-5678", { "#{이름}": "a" }, env);
    expect(r).toEqual({ ok: true, groupId: "g1", to: "01012345678" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.sendon.io/v2/messages/kakao/alim-talk");
    expect(init.headers.Authorization).toBe(`Basic ${btoa("star:key")}`);
    expect(JSON.parse(init.body)).toMatchObject({
      sendProfileId: "profile",
      templateId: "tpl-1",
      to: [{ phone: "01012345678", variables: { "#{이름}": "a" } }],
      fallback: { fallbackType: "NONE" },
    });
  });

  it("reports an error code even when HTTP is 200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 401, message: "허가되지 않은 IP" }))));
    const r = await sendAlimtalk("ko_booking_received_v1", "01012345678", {}, env);
    expect(r).toEqual({ ok: false, code: 401, message: "허가되지 않은 IP" });
  });

  it("skips when not configured, and redirects to the override phone outside prod", async () => {
    expect(await sendAlimtalk("ko_booking_received_v1", "01012345678", {}, {})).toMatchObject({ skipped: true });
    expect(
      await sendAlimtalk("ko_booking_received_v1", "01012345678", {}, { ...env, NODE_ENV: "development" }),
    ).toMatchObject({ skipped: true });
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 200, data: { groupId: "g" } })));
    vi.stubGlobal("fetch", fetchMock);
    const r = await sendAlimtalk("ko_booking_received_v1", "01012345678", {}, {
      ...env,
      STAGING: "true",
      ALIMTALK_DEV_PHONE_OVERRIDE: "010-9999-8888",
    });
    expect(r).toMatchObject({ ok: true, to: "01099998888" });
  });
});
