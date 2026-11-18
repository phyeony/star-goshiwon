// Turns Meta's webhook body into the few events the agent cares about.
// Shape: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
//
//   field "messages"           → guest messages (value.messages) and delivery
//                                 statuses (value.statuses, ignored here)
//   field "smb_message_echoes" → messages the manager sent from the WhatsApp
//                                 Business app (coexistence)

export interface GuestMessageEvent {
  kind: "guest_message";
  phoneNumberId: string;
  waPhone: string; // digits only
  profileName: string;
  waMessageId: string;
  sentAt: Date;
  messageType: string;
  body: string;
}

export interface ManagerEchoEvent {
  kind: "manager_echo";
  phoneNumberId: string;
  waPhone: string; // the guest the manager wrote to
  waMessageId: string;
  sentAt: Date;
  messageType: string;
  body: string;
}

export type WhatsAppEvent = GuestMessageEvent | ManagerEchoEvent;

type Json = Record<string, unknown>;

const obj = (v: unknown): Json => (v && typeof v === "object" ? (v as Json) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

// Reactions, read receipts and system notices don't need an answer.
const IGNORED_TYPES = new Set(["reaction", "system", "unsupported", "ephemeral", "request_welcome"]);

export function messageBody(m: Json): string {
  const type = str(m.type);
  switch (type) {
    case "text":
      return str(obj(m.text).body);
    case "button":
      return str(obj(m.button).text);
    case "interactive": {
      const i = obj(m.interactive);
      return str(obj(i.button_reply).title) || str(obj(i.list_reply).title);
    }
    case "location": {
      const l = obj(m.location);
      return [str(l.name), str(l.address)].filter(Boolean).join(", ");
    }
    default:
      // image / video / document captions; audio and stickers have none.
      return str(obj(m[type]).caption);
  }
}

function toDate(ts: unknown): Date {
  const n = Number(ts);
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000) : new Date();
}

export function parseWebhook(body: unknown): WhatsAppEvent[] {
  const events: WhatsAppEvent[] = [];
  for (const entry of arr(obj(body).entry)) {
    for (const change of arr(obj(entry).changes)) {
      const field = str(obj(change).field);
      const value = obj(obj(change).value);
      const phoneNumberId = str(obj(value.metadata).phone_number_id);

      if (field === "messages") {
        const names = new Map<string, string>();
        for (const c of arr(value.contacts)) {
          names.set(str(obj(c).wa_id), str(obj(obj(c).profile).name));
        }
        for (const raw of arr(value.messages)) {
          const m = obj(raw);
          const type = str(m.type);
          const from = str(m.from);
          if (!from || !str(m.id) || IGNORED_TYPES.has(type)) continue;
          events.push({
            kind: "guest_message",
            phoneNumberId,
            waPhone: from,
            profileName: names.get(from) ?? "",
            waMessageId: str(m.id),
            sentAt: toDate(m.timestamp),
            messageType: type || "unknown",
            body: messageBody(m),
          });
        }
      } else if (field === "smb_message_echoes") {
        for (const raw of arr(value.message_echoes)) {
          const m = obj(raw);
          const type = str(m.type);
          if (!str(m.to) || !str(m.id) || IGNORED_TYPES.has(type)) continue;
          events.push({
            kind: "manager_echo",
            phoneNumberId,
            waPhone: str(m.to),
            waMessageId: str(m.id),
            sentAt: toDate(m.timestamp),
            messageType: type || "unknown",
            body: messageBody(m),
          });
        }
      }
    }
  }
  return events;
}
