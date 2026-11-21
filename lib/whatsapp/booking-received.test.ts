import { describe, expect, it, vi } from "vitest";
import {
  BOOKING_RECEIVED_TEMPLATE_TEXT,
  BOOKING_RECEIVED_TEXTS,
  bookingReceivedParams,
  planBookingReceived,
  templateNameFor,
  formatStayDate,
  renderBookingReceived,
  sendBookingReceived,
  type BookingReceivedDeps,
} from "./booking-received";
import { sendTemplate } from "./graph";

const input = {
  bookingId: "b1",
  guestName: "  Alex   Kim ",
  roomName: "Economy Room",
  checkIn: "2026-12-01",
  checkOut: "2026-12-15",
  whatsappNumber: "+447700900123",
};

describe("booking-received template", () => {
  it("fills first name, room and dates", () => {
    expect(bookingReceivedParams(input)).toEqual(["Alex", "Economy Room", "1 Dec 2026", "15 Dec 2026"]);
    expect(formatStayDate("nope")).toBe("nope");
  });

  it("keeps parameters free of newlines and long space runs, which Meta rejects", () => {
    const [name, room] = bookingReceivedParams({ ...input, guestName: "Al\nex", roomName: "A\t\tB     C" });
    expect(name).toBe("Al");
    expect(room).toBe("A B C");
  });

  it("renders the text the guest receives", () => {
    const text = renderBookingReceived(bookingReceivedParams(input));
    expect(text).toContain("Hi Alex, thanks for your booking request at Star Goshiwon!");
    expect(text).toContain("Economy Room, 1 Dec 2026 to 15 Dec 2026");
    expect(text).not.toMatch(/\{\{\d\}\}/);
    expect(BOOKING_RECEIVED_TEMPLATE_TEXT.match(/\{\{\d\}\}/g)).toHaveLength(4);
  });

  function makeDeps(chat: Awaited<ReturnType<BookingReceivedDeps["chatSoFar"]>> = null): BookingReceivedDeps {
    return {
      templateName: "booking_received",
      language: "en",
      chatSoFar: vi.fn(async () => chat),
      send: vi.fn(async () => "wamid.T"),
      sendText: vi.fn(async () => "wamid.X"),
      record: vi.fn(async () => {}),
    };
  }
  const now = new Date("2026-11-19T08:00:00Z");

  it("sends the full template to a guest who never wrote, and records the chat against the booking", async () => {
    const deps = makeDeps();
    await sendBookingReceived(deps, input, now);
    expect(deps.chatSoFar).toHaveBeenCalledWith("447700900123");
    expect(deps.send).toHaveBeenCalledWith("447700900123", {
      name: "booking_received",
      language: "en",
      bodyParams: ["Alex", "Economy Room", "1 Dec 2026", "15 Dec 2026"],
    });
    expect(deps.sendText).not.toHaveBeenCalled();
    expect(deps.record).toHaveBeenCalledWith({
      waPhone: "447700900123",
      bookingId: "b1",
      waMessageId: "wamid.T",
      body: expect.stringContaining("Hi Alex"),
      messageType: "template",
      asksMenOnly: true,
      sentAt: now,
    });
  });

  it("leaves out what the chat already covers", async () => {
    const deps = makeDeps({ menOnlyState: "confirmed", sentPhotoOrFile: true, lastGuestMessageAt: "2026-11-10T08:00:00Z" });
    await sendBookingReceived(deps, input, now);
    expect(deps.send).toHaveBeenCalledWith("447700900123", expect.objectContaining({ name: "booking_received_basic" }));
    const body = (deps.record as ReturnType<typeof vi.fn>).mock.calls[0][0].body as string;
    expect(body).not.toContain("passport");
    expect(body).not.toContain("men only");
    expect((deps.record as ReturnType<typeof vi.fn>).mock.calls[0][0].asksMenOnly).toBe(false);
  });

  it("sends a normal text inside the guest's 24-hour window", async () => {
    const deps = makeDeps({ menOnlyState: "asked", sentPhotoOrFile: true, lastGuestMessageAt: "2026-11-19T07:00:00Z" });
    await sendBookingReceived(deps, input, now);
    expect(deps.send).not.toHaveBeenCalled();
    expect(deps.sendText).toHaveBeenCalledWith("447700900123", renderBookingReceived(bookingReceivedParams(input), "no_passport"));
    expect(deps.record).toHaveBeenCalledWith(expect.objectContaining({ messageType: "text", waMessageId: "wamid.X" }));
  });

  it("sends nothing to a guest the men-only rule already ruled out", async () => {
    const deps = makeDeps({ menOnlyState: "not_eligible", sentPhotoOrFile: false, lastGuestMessageAt: null });
    expect(await sendBookingReceived(deps, input, now)).toEqual({ send: false, reason: "not_eligible" });
    expect(deps.send).not.toHaveBeenCalled();
    expect(deps.sendText).not.toHaveBeenCalled();
    expect(deps.record).not.toHaveBeenCalled();
  });

  it("picks the variant from passport and men-only state", () => {
    const chat = (menOnlyState: "unasked" | "confirmed", sentPhotoOrFile: boolean) => ({
      menOnlyState,
      sentPhotoOrFile,
      lastGuestMessageAt: null,
    });
    const variant = (p: ReturnType<typeof planBookingReceived>) => (p.send ? p.variant : null);
    expect(variant(planBookingReceived(chat("unasked", false), now))).toBe("full");
    expect(variant(planBookingReceived(chat("unasked", true), now))).toBe("no_passport");
    expect(variant(planBookingReceived(chat("confirmed", false), now))).toBe("no_men_only");
    expect(variant(planBookingReceived(chat("confirmed", true), now))).toBe("basic");
    // Just under 24 h is too close to the edge: template.
    const late = { ...chat("unasked", false), lastGuestMessageAt: "2026-11-18T08:05:00Z" };
    expect(planBookingReceived(late, now)).toMatchObject({ as: "template" });
    expect(templateNameFor("booking_received", "no_men_only")).toBe("booking_received_no_men_only");
    for (const text of Object.values(BOOKING_RECEIVED_TEXTS)) expect(text.match(/\{\{\d\}\}/g)).toHaveLength(4);
  });

  it("does not record a chat when Meta refuses the send", async () => {
    const deps = makeDeps();
    deps.send = async () => {
      throw new Error("HTTP 400");
    };
    await expect(sendBookingReceived(deps, input)).rejects.toThrow("HTTP 400");
    expect(deps.record).not.toHaveBeenCalled();
  });

  it("posts Meta's template shape", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ messages: [{ id: "wamid.X" }] })));
    const id = await sendTemplate({ accessToken: "t", phoneNumberId: "P", fetchImpl }, "447700900123", {
      name: "booking_received",
      language: "en",
      bodyParams: ["Alex", "Economy Room"],
    });
    expect(id).toBe("wamid.X");
    const body = JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body).toMatchObject({
      to: "447700900123",
      type: "template",
      template: {
        name: "booking_received",
        language: { code: "en" },
        components: [{ type: "body", parameters: [{ type: "text", text: "Alex" }, { type: "text", text: "Economy Room" }] }],
      },
    });
  });
});
