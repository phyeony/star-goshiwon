import { describe, expect, it, vi } from "vitest";
import {
  BOOKING_RECEIVED_TEMPLATE_TEXT,
  bookingReceivedParams,
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

  it("sends to the number without + and records the chat against the booking", async () => {
    const deps: BookingReceivedDeps = {
      templateName: "booking_received",
      language: "en",
      send: vi.fn(async () => "wamid.T"),
      record: vi.fn(async () => {}),
    };
    const now = new Date("2026-11-19T08:00:00Z");
    await sendBookingReceived(deps, input, now);
    expect(deps.send).toHaveBeenCalledWith("447700900123", {
      name: "booking_received",
      language: "en",
      bodyParams: ["Alex", "Economy Room", "1 Dec 2026", "15 Dec 2026"],
    });
    expect(deps.record).toHaveBeenCalledWith({
      waPhone: "447700900123",
      bookingId: "b1",
      waMessageId: "wamid.T",
      body: expect.stringContaining("Hi Alex"),
      sentAt: now,
    });
  });

  it("does not record a chat when Meta refuses the send", async () => {
    const record = vi.fn();
    const deps: BookingReceivedDeps = {
      templateName: "t",
      language: "en",
      send: async () => {
        throw new Error("HTTP 400");
      },
      record,
    };
    await expect(sendBookingReceived(deps, input)).rejects.toThrow("HTTP 400");
    expect(record).not.toHaveBeenCalled();
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
