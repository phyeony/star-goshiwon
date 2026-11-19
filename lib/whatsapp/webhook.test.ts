import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { markRead, sendText } from "./graph";
import { parseWebhook } from "./payload";
import { consumeBatch, type QueueMessage } from "./queue-consumer";
import { signBody, verifyMetaSignature } from "./signature";

const guestPayload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "WABA",
      changes: [
        {
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: { display_phone_number: "15550001111", phone_number_id: "PNID" },
            contacts: [{ profile: { name: "Alex" }, wa_id: "447700900123" }],
            messages: [
              { from: "447700900123", id: "wamid.1", timestamp: "1763450000", type: "text", text: { body: "Hi, price for December?" } },
              { from: "447700900123", id: "wamid.2", timestamp: "1763450005", type: "image", image: { id: "m1", caption: "this room?" } },
              { from: "447700900123", id: "wamid.3", timestamp: "1763450006", type: "audio", audio: { id: "m2" } },
              { from: "447700900123", id: "wamid.4", timestamp: "1763450007", type: "reaction", reaction: { message_id: "x", emoji: "👍" } },
            ],
          },
        },
        {
          field: "messages",
          value: { metadata: { phone_number_id: "PNID" }, statuses: [{ id: "wamid.out", status: "read" }] },
        },
        {
          field: "smb_message_echoes",
          value: {
            metadata: { phone_number_id: "PNID" },
            message_echoes: [
              { from: "15550001111", to: "447700900123", id: "wamid.echo", timestamp: "1763450100", type: "text", text: { body: "I'll check for you" } },
            ],
          },
        },
      ],
    },
  ],
};

describe("parseWebhook", () => {
  const events = parseWebhook(guestPayload);

  it("keeps guest messages with their name, type and text; skips reactions and statuses", () => {
    const guest = events.filter((e) => e.kind === "guest_message");
    expect(guest.map((e) => [e.waMessageId, e.messageType, e.body])).toEqual([
      ["wamid.1", "text", "Hi, price for December?"],
      ["wamid.2", "image", "this room?"],
      ["wamid.3", "audio", ""],
    ]);
    expect(guest[0]).toMatchObject({ waPhone: "447700900123", profileName: "Alex", phoneNumberId: "PNID" });
    expect(guest[0].sentAt.toISOString()).toBe(new Date(1763450000 * 1000).toISOString());
  });

  it("turns app messages into manager echoes addressed to the guest", () => {
    const echo = events.find((e) => e.kind === "manager_echo");
    expect(echo).toMatchObject({ waPhone: "447700900123", waMessageId: "wamid.echo", body: "I'll check for you" });
  });

  it("ignores garbage", () => {
    expect(parseWebhook(null)).toEqual([]);
    expect(parseWebhook({ entry: [{ changes: [{ field: "messages", value: { messages: [{}] } }] }] })).toEqual([]);
  });
});

describe("signature", () => {
  const body = JSON.stringify(guestPayload);

  it("matches Node's HMAC-SHA256", async () => {
    const node = `sha256=${createHmac("sha256", "s3cret").update(body).digest("hex")}`;
    expect(await signBody(body, "s3cret")).toBe(node);
  });

  it("accepts the right signature and rejects anything else", async () => {
    const good = await signBody(body, "s3cret");
    expect(await verifyMetaSignature(body, good, "s3cret")).toBe(true);
    expect(await verifyMetaSignature(body, good, "other")).toBe(false);
    expect(await verifyMetaSignature(`${body} `, good, "s3cret")).toBe(false);
    expect(await verifyMetaSignature(body, null, "s3cret")).toBe(false);
    expect(await verifyMetaSignature(body, good, "")).toBe(false);
  });
});

describe("graph", () => {
  it("sends text to the phone number's messages endpoint and returns the id", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ messages: [{ id: "wamid.out" }] })));
    const id = await sendText({ accessToken: "T", phoneNumberId: "PNID", fetchImpl }, "4477", "Hello");
    expect(id).toBe("wamid.out");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/graph\.facebook\.com\/v\d+\.\d+\/PNID\/messages$/);
    expect(JSON.parse(init.body as string)).toMatchObject({ to: "4477", type: "text", text: { body: "Hello" } });
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer T");
  });

  it("throws on HTTP errors", async () => {
    const fetchImpl = vi.fn(async () => new Response("bad", { status: 400 }));
    await expect(sendText({ accessToken: "T", phoneNumberId: "P", fetchImpl }, "1", "x")).rejects.toThrow(/HTTP 400/);
    await expect(markRead({ accessToken: "T", phoneNumberId: "P", fetchImpl }, "w")).rejects.toThrow(/HTTP 400/);
  });
});

describe("queue consumer", () => {
  const msg = (body: unknown) => {
    const m = { body, ack: vi.fn(), retry: vi.fn() };
    return m as typeof m & QueueMessage;
  };

  it("acks finished runs, retries busy or still-typing chats, retries failures later", async () => {
    const done = msg({ conversationId: "a" });
    const busy = msg({ conversationId: "b" });
    const typing = msg({ conversationId: "c" });
    const broken = msg({ conversationId: "d" });
    const junk = msg({});
    const status: Record<string, string> = { a: "done", b: "busy", c: "waiting_for_more" };
    await consumeBatch([done, busy, typing, broken, junk], async (id) => {
      if (id === "d") throw new Error("boom");
      return { status: status[id] };
    });
    expect(done.ack).toHaveBeenCalled();
    expect(busy.retry).toHaveBeenCalledWith({ delaySeconds: 30 });
    expect(typing.retry).toHaveBeenCalledWith({ delaySeconds: 20 });
    expect(broken.retry).toHaveBeenCalledWith({ delaySeconds: 60 });
    expect(junk.ack).toHaveBeenCalled();
  });
});
