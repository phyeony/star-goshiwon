// Sends a signed fake WhatsApp message to the webhook, as Meta would.
//
//   pnpm wa:fake "How much is the economy room for December?"
//   pnpm wa:fake "I'll check" --echo          # as if the manager replied from the app
//   pnpm wa:fake "hi" --from 447700900123 --url https://staging.goshiwonseoul.com/api/whatsapp/webhook
//
// Signs with WHATSAPP_APP_SECRET from .env.local. Locally (`pnpm dev`) there
// is no queue, so the agent runs ~35 s later in the background; the result
// lands in whatsapp_agent_runs. Sending to a fake number fails at Meta, which
// is recorded as send_error.
import { signBody } from "@/lib/whatsapp/signature";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const text = process.argv.slice(2).find((a, i, all) => !a.startsWith("--") && !all[i - 1]?.startsWith("--"));
  if (!text) throw new Error('usage: pnpm wa:fake "message" [--from 447700900123] [--echo] [--url …]');
  const from = arg("from") ?? "447700900123";
  const url = arg("url") ?? "http://localhost:3000/api/whatsapp/webhook";
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) throw new Error("WHATSAPP_APP_SECRET is not set in .env.local");
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "TEST";
  const id = `wamid.fake.${Date.now()}`;
  const timestamp = String(Math.floor(Date.now() / 1000));

  const value = process.argv.includes("--echo")
    ? {
        field: "smb_message_echoes",
        value: {
          metadata: { phone_number_id: phoneNumberId },
          message_echoes: [{ from: "business", to: from, id, timestamp, type: "text", text: { body: text } }],
        },
      }
    : {
        field: "messages",
        value: {
          messaging_product: "whatsapp",
          metadata: { phone_number_id: phoneNumberId },
          contacts: [{ profile: { name: "Test Guest" }, wa_id: from }],
          messages: [{ from, id, timestamp, type: "text", text: { body: text } }],
        },
      };
  const body = JSON.stringify({ object: "whatsapp_business_account", entry: [{ id: "WABA", changes: [value] }] });

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-hub-signature-256": await signBody(body, secret) },
    body,
  });
  console.log(res.status, await res.text());
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
