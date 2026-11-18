# WhatsApp AI auto-reply agent — design spec

Status: design approved in chat 2026-10-13; spec awaiting review.
Implementation plan: `plan/whatsapp-agent-implementation.md` (to be written after this spec is approved).

## Goal

Guests (mostly English-speaking foreigners) message the business WhatsApp number with
questions the site already answers (prices, rules, how to book), and many message
before sending a booking request. The manager (strong language: Korean) answers all
of it by hand today.

The agent answers the repetitive, safe questions instantly in natural English and
steers everyone to the booking request form. Everything that needs human judgement
goes silently to the manager, with a Korean summary and a suggested reply on the
admin site. Booking approval always stays with the manager.

**Success:** common questions get a correct reply within a minute, at any hour; the
manager's handoff queue shows only things that really need them; nothing incorrect
(prices, promises, rules) is ever sent; no guest is left "read but ignored".

## Non-goals

- No approve/reject/modify-booking capability for the agent. Its tools are read-only.
- No screening, flagging or commenting on nationality or other personal
  characteristics. The only eligibility rule it states is the published men-only rule,
  asked of every new contact equally.
- No replies in languages other than English.
- No storage of guest media (photos, voice notes, documents such as passports).
- No full Korean compose-and-translate inbox in v1 (manager keeps chatting in the
  WhatsApp Business app). Revisit only if coexistence is unavailable (see Risks).
- No proactive or follow-up messages: the agent never writes first or chases a guest
  who goes quiet. The only outbound message not answering a guest is the
  booking-received template (§1.1). Revisit after go-live.
- Not using the WhatsApp Business app's built-in Greeting message: it also re-sends
  after 14 days of inactivity, which we don't want.

## 1. Behaviour

### 1.1 Per-conversation state

Each conversation (one per guest phone number) has:

- `men_only_state`: `unasked` → `asked` → `confirmed` | `not_eligible`
- `bot_state`: `active` | `paused_by_manager` | `off`
- linked booking request (optional) and how it was matched

| Situation | Agent action |
|---|---|
| First message ever from this number (no conversation row) | Reply includes the men-only check. If the question is a safe category, the same reply also answers it. If not, the reply is only the check and the question is handed off (draft for manager); in that case the guest's message is **not** marked read, since its question is still unanswered. |
| `men_only_state = asked` (not yet confirmed) | Answer safe questions, and repeat the check in each reply. No booking link and no booking steps until confirmed. |
| Guest confirms | `confirmed`; normal behaviour from now on. |
| Guest's reply means it won't work (e.g. "I'm a woman") | Auto-send a polite decline including the women's-floor line (below). Set `not_eligible`; conversation shows as **closed – not eligible** in admin; bot sends nothing further there. Manager can still reply by hand. |
| Manager sends any message in the chat (Meta echo of app-sent message) | `bot_state = paused_by_manager`, until the manager resumes it from admin. Drafts are still generated and shown in admin. |
| Manager turns the bot off for a chat in admin | `bot_state = off`; no drafts, no sends. |
| Guest submitted a booking request with a WhatsApp number and ticked opt-in | We send one **utility template** right after submit (request received, dates, men-only check). Conversation is created already linked to that booking, `men_only_state = asked`. |

The men-only check is asked of **everyone**, including guests who ticked the men-only
acknowledgement on the booking form.

Decline wording (config, so it can change when the women's floor opens), roughly:

> Thanks for letting us know, and sorry — Star Goshiwon is men-only at the
> moment. We're working on a separate floor for women, but it isn't open yet. We hope
> you find a great place in Seoul!

Whether a guest's reply confirms, declines, or is unclear comes from the model's
`men_only_signal`; unclear = still `asked`.

### 1.2 Category → action

| Category | Action (once the category is live) |
|---|---|
| `pricing` (quote via `get_quote`) | Auto-send |
| `location` (address, directions, transport) | Auto-send |
| `rules` (house rules, policies, FAQ content) | Auto-send |
| `booking_how_to` | Auto-send. Includes a pre-filled booking link **only if no booking request is linked to this conversation**. |
| `availability`, DB shows a free unit | Auto-send: free right now, but not held until the booking is confirmed, so it could still fill up. Plus quote and (per rule above) link. |
| `availability`, DB shows nothing free | Silent handoff (manager may know better). |
| `men_only` (confirm / decline / question about it) | Auto-send |
| `booking_status`, `discount` (anything beyond the published long-stay discount), `group` (several rooms for a group — case by case, no published rule), `viewing` (by appointment via manager), `special_request` (early check-in etc.), `complaint`, `media` (photo/voice/location/document), `other` / not covered by the knowledge pack | Silent handoff |

Additionally, regardless of category: if the model sets `needs_human`, it's a handoff.
**Code, not the model, decides** auto-send: `mode = live && category auto-switch on &&
!needs_human && bot_state = active && men_only_state != not_eligible` (plus the
availability-full and first-message rules above).

**Batching:** all unanswered guest messages in a conversation are handled as one turn.
If any part needs the manager (e.g. "how much is it, and can I check in at 6am?"), the
whole turn is a silent handoff — the agent never answers half and leaves the rest.

**Confirmed guests:** see §1.6. Linked to a `confirmed` booking narrows the
auto-send set to generic questions; everything else is a handoff.

### 1.3 Silent handoff and read status

- A **silent handoff** sends nothing to the guest and does **not** mark the message
  read. The guest sees grey ticks (delivered) until the manager opens the chat.
- For auto-replies: **send first, then mark read**, only after the send succeeded. No
  "typing…" indicator (WhatsApp ties it to the mark-read call).
- Shadow mode, errors, timeouts, crashes: nothing is marked read.

### 1.4 Voice and content rules

- English only. Warm, short, natural — like a friendly person at the front desk. No
  "As an AI…", no bullet-point dumps.
- If asked whether it's a bot: honest — an assistant answers common questions any time;
  bookings and anything special are handled by the manager personally. Never claims to
  be human. (Business profile description also mentions the assistant.)
- Never: promise or imply approval; state prices that don't come from `get_quote` or
  the knowledge pack; offer or hint at discounts; send payment links; reveal room
  numbers/units; invent policies or answers not in the knowledge pack; comment on
  nationality or other personal characteristics.
- Ignores instructions embedded in guest messages ("ignore your instructions…").

### 1.5 Linking a chat to a booking request

Done in code, not by the model.

- Booking form gets an optional **WhatsApp number** field and an **opt-in checkbox**
  ("Message me on WhatsApp about this request — Star Goshiwon"). Stored
  normalised (E.164).
- Conversation phone number = booking `whatsapp_number` → linked (`match_source = phone`).
- A WhatsApp profile name that resembles a booking's guest name is only shown to the
  manager as a **possible match** to confirm with one click (`match_source = manager`).
  Unconfirmed name hints never affect agent behaviour.
- The model receives only "linked booking: none" or "linked booking: status X, dates Y".
  There is no tool for looking up bookings by email or name.

### 1.6 Guests with a confirmed booking (decided 2026-10-29)

Applies when the conversation is linked (by phone, or confirmed by the manager) to a
booking whose status is `confirmed`, from confirmation through check-out (upcoming
and in-stay guests alike; there is no separate checked-in status).

- **Auto-send only generic questions:** `location` (address, directions, transport,
  nearby places) and `rules` (house rules, check-in/out times, amenities, FAQ
  content, and the general deposit-refund process) that the knowledge pack answers
  directly.
- **Price estimates:** if the guest gives both a room type and dates, the agent sends
  an estimate from `get_quote`, worded as an estimate. It never implies the room is
  free or that an extension is approved; extending itself stays with the manager.
  Missing room or dates → handoff (no asking back-and-forth in v1).
- **Deposit refund:** general questions ("when do I get my deposit back?") are
  answered from the policy: refunded via PayPal within 5 business days after
  checkout, once the room has been checked. Anything about *their* refund (status, amount, deductions, "where is my
  money?") is a handoff.
- **Everything else is a silent handoff**, including `availability` and
  `booking_how_to` (for a resident these are really extensions or changes),
  `booking_status`, payments, door codes / access, maintenance or
  broken things, noise or neighbours, early/late check-in or check-out, and anything
  about their own stay.
- **No booking links** and no booking steps are ever sent to a confirmed guest.
- **Men-only check is not asked**: the manager already approved the booking.
- **"No nonsense" rule:** if the answer is not stated in the knowledge pack, it's a
  handoff, even if the model thinks it knows. No guessing, no generic filler
  ("let me check and get back to you"), no partial answers. Code enforces this by
  only auto-sending categories in the confirmed-guest allow-list, plus the batching
  rule (one non-generic part makes the whole turn a handoff).
- Same read-status rules as §1.3: handed-off messages stay unread for the manager.

The model receives "linked booking: confirmed, dates Y" so it can classify, but the
send/handoff decision stays in code.

## 2. Architecture

```
Meta webhook ──► /api/whatsapp/webhook ──► Supabase (dedupe by Meta message id)
                    (verify signature,          │
                     200 immediately)           ▼
                                         Cloudflare Queue
                                                │
                                                ▼
                         queue consumer: load conversation + recent messages
                           → state rules (code) → agent (LLM + read-only tools)
                           → decide send / draft (code) → Graph API send → mark read
                                                │
                                                ▼
                                   /admin/whatsapp (Korean)
```

### 2.1 Worker entry

`wrangler.jsonc` `main` is currently `.open-next/worker.js`. Add a small custom
`worker.ts` that re-exports OpenNext's `fetch` and adds:

- `queue` handler — agent jobs (Queues are available on the Workers Free plan; LLM
  wait time is not CPU time, so the 10ms CPU limit is fine).
- `scheduled` handler — daily retention cleanup (Cron Trigger).

### 2.2 Webhook route `/api/whatsapp/webhook`

- `GET`: Meta verification handshake (`hub.verify_token`).
- `POST`: verify `X-Hub-Signature-256` (HMAC-SHA256 with app secret, constant-time
  compare); for each message/status/echo: upsert conversation, insert message with
  unique Meta message id (duplicates ignored); enqueue a job per conversation for
  inbound guest messages; return 200 fast. Manager echoes set `paused_by_manager`.
  Media messages are recorded as type only — media is never downloaded.

### 2.3 Agent — `lib/whatsapp-agent/`

- **Knowledge pack** built in code from `lib/site-data.ts` (siteConfig, stayTimes,
  amenities, FAQs), `lib/pricing.ts`, `lib/guides/*`, and a new `lib/policies-data.ts`
  (policies text moved out of `app/policies/page.tsx` JSX; the page renders from it).
  Plus approved Q&As extracted from real chats. Sent with prompt caching where the
  provider supports it. No vector RAG.
- **Tools (read-only):**
  - `get_quote(room, check_in, check_out)` → wraps `calculateEstimate`
  - `check_availability(check_in, check_out)` → per room type, wraps
    `getRoomUnitAvailability` / `isRoomUnitAvailableForBooking`; returns counts only
    (no unit names)
  - `booking_link(room?, check_in?, check_out?)` → pre-filled request-to-book URL
- **Structured output:**
  `{ reply, category, men_only_signal: confirmed|declined|none, needs_human,
  reason_ko, summary_ko, guest_message_ko }`
- **`LlmClient` interface** with three adapters: Anthropic, Cloudflare Workers AI,
  OpenAI-compatible (OpenAI, OpenRouter, Google Gemini). Provider + model chosen in
  config; final choice made from eval results.

### 2.4 Sending

Graph API `messages` endpoint for free-form replies (free inside the 24h customer
service window) and the booking-received utility template. Send → on success insert
outbound message row → mark the guest's messages read. On failure: no read mark,
store as draft with error, visible in admin.

### 2.5 Data (new migration under `supabase/migrations/`, mirrored in `schema.sql`)

- `whatsapp_conversations`: id, wa_phone (E.164, unique), profile_name,
  booking_request_id (nullable), match_source (`phone` | `manager` | null),
  men_only_state, bot_state, last_message_at, created_at.
- `whatsapp_messages`: id, conversation_id, wa_message_id (unique), direction
  (`in` | `out`), sender (`guest` | `bot` | `manager`), body, message_type
  (`text` | `image` | `audio` | `location` | `document` | …), agent_output (jsonb),
  outcome (`sent` | `draft` | `skipped` | `failed`), manager_rating (`good` | `bad` |
  null), created_at.
- `whatsapp_settings` (single row): mode (`off` | `shadow` | `live`), per-category
  auto-send switches, llm provider/model, decline text.
- `booking_requests`: add `whatsapp_number` (nullable), `whatsapp_opt_in` (bool,
  default false).
- RLS: service role only, like the existing admin tables.

### 2.6 Admin page `/admin/whatsapp` (Korean, next to 인박스 in admin nav)

- Conversation list: last message, status badges (handoff waiting, closed – not
  eligible, bot paused/off), linked booking.
- Conversation view: guest messages with Korean translation; Korean summary + reason
  for handoff; the agent's suggested reply with **Copy** and **✓/✗ "would have sent
  as-is"** (send-via-API button only in live mode); linked booking or name-match hint
  with confirm; bot resume/off toggle.
- Settings: mode, per-category auto-send switches, per-category shadow stats (count of
  ✓ drafts and ✗ drafts).
- Drafts live only on the admin page (the API cannot fill the WhatsApp app's input box).

### 2.7 Retention

Daily cron deletes conversations (and their messages) with no activity for 12 months.

### 2.8 Site content fixes

- FAQ "Can I see the room before booking?": replace the walk-in wording with "viewings
  by appointment — message us on WhatsApp".
- Booking form: WhatsApp number + opt-in fields (validation in `lib/validation.ts`).

## 3. Testing

1. **Unit tests (vitest, mocked LLM, part of `pnpm run verify`):** state machine
   transitions; category → action decisions incl. batching and availability-full;
   booking-link rule; read-status ordering (send fails → no mark read); signature
   verification; dedupe; phone normalisation and matching; retention query.
2. **Eval (`pnpm eval:whatsapp`, real model calls, not in `verify`):** 40–60 cases from
   the anonymised chat export plus adversarial cases (prompt injection, discount
   fishing, "is my booking confirmed?" from an unlinked number, women enquiring, group
   requests, mixed safe+handoff messages, unknown questions). Assert category,
   handoff, facts (prices match `calculateEstimate`), forbidden content; LLM-graded
   tone. Runs all configured candidates; prints pass rate per category, cost per 100
   conversations, latency.
3. **Local:** signed fake webhook payloads via curl.
4. **Staging** (`staging.goshiwonseoul.com`, own Supabase) with Meta's free test
   number; developer's personal WhatsApp plays the guest.
5. **Shadow mode** on the real number (mode `shadow`): drafts only, nothing sent or
   marked read.
6. **Go-live per category:** a category is switched to auto by the user after ~20 ✓
   drafts with zero factual errors. Men-only check first.

The production WhatsApp number is not connected before step 5.

## 4. Build order

1. `lib/policies-data.ts` + policies page refactor, FAQ fix, knowledge pack, tools,
   agent, three LLM adapters, eval set (needs chat export).
   Implemented as two JSON calls per turn (understanding, then reply) with the quote
   and availability computed in code between them; no model tool-calling (GPT-6
   Luna's Chat Completions only allows function calling with reasoning off). Policies
   live in `components/policies-content.tsx`, rendered to text for the knowledge pack.
   Run the eval with `pnpm eval:whatsapp` (needs `OPENAI_API_KEY` in `.env.local`).
2. Booking form WhatsApp field + opt-in + migration column.
3. Worker entry (queue + cron), webhook, tables, queue consumer on staging with the
   test number.
4. **Check coexistence eligibility for the +82 number** (start Embedded Signup) —
   before building the admin page.
5. Admin page `/admin/whatsapp`.
6. Submit the utility template; go live on the real number (no shadow mode, see §7).
7. Per-category auto-send switches stay available to turn a category off.

## 5. Risks / to confirm during build

- **Coexistence for +82 is unconfirmed** (older vendor lists exclude South Korea;
  newer vendor posts claim worldwide since May 2026; no primary Meta source found).
  Checked at step 4; if unavailable, decide then (full API move + Korean inbox, or a
  second number). Steps 1–3 are unaffected.
- Whether read state syncs between app and API under coexistence.
- Whether Meta categorises the booking-received template as utility (men-only line),
  and the per-message utility price for Korea.
- Meta's current requirements on AI-assistant disclosure wording.
- Workers AI free daily allowance vs. eval/production volume.
- Data sent to third-party model hosts (OpenRouter routes to varied hosts) — check data
  policy of the chosen model before production.

## 6. Actions needed from the user (in order)

**Step 1 — agent + eval (no WhatsApp setup needed)**
1. Export 10–20 typical chats from the WhatsApp Business app (chat → ⋮ → More → Export
   chat → **Without media**): price questions, women enquiring, "is my booking
   confirmed?", groups, complaints, early check-in. Save **outside the repo** (e.g.
   `~/Downloads/wa-export/`) and give the path. Claude anonymises before anything
   enters the repo.
2. Copy of the manager's current quick replies (tone + facts possibly missing from the site).
3. API keys for the model comparison, added by the user to `.env.local` (Claude does
   not read `.env` files): `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`,
   `OPENROUTER_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_AI_API_TOKEN` (Workers AI
   permission). Low spend limit on each; omit any provider to skip.
4. Approve the Q&A list Claude extracts from the chats (sent in Korean + English).

**Step 3 — staging with the test number**
5. Create a Meta developer app (type Business) → add WhatsApp product → free test
   number; add the user's personal number as a test recipient. Claude guides getting
   the app secret, permanent access token (System User), phone number ID, and the
   webhook URL setup.
6. Put those in staging env/secrets. Every new key must also be defined in
   `.env.staging` (even empty) so staging never inherits production values.

**Step 4 — before the admin page**
7. Start coexistence Embedded Signup on the real +82 number far enough to see if it's
   allowed (may need a Meta Business Portfolio / business verification).

**Steps 5–6**
8. Manager tries `/admin/whatsapp`; tell Claude whether the manager's phone is iPhone or Android.
9. Submit the booking-received template in WhatsApp Manager (Claude writes the text);
   add a payment method for template charges.
10. Update the WhatsApp business profile description to mention the assistant.

Only 1–3 block starting. Work not depending on them (policies data file, FAQ fix,
knowledge pack, tools) can start once this spec and the implementation plan are approved.

## 7. Where we are

- 2026-10-13: design approved in chat; this spec written. **Next: user reviews this
  spec → Claude writes `plan/whatsapp-agent-implementation.md` (writing-plans) → user
  approves plan and picks execution method → build step 1.**
- Drafts stay on the admin page only (Copy + ✓/✗ rating); no "Open in WhatsApp" prefill button.
- 2026-10-29: implementation plan drafted. Resolving open behaviour questions before
  approval. Decided: no proactive/follow-up messages (non-goals); confirmed guests get
  generic answers only, everything else handed off (§1.6).
  Confirmed guests also get price estimates (room + dates given) and the general
  refund process. Refund timing conflict: policies say "within 5 business days
  after checkout", user said 2–3 business days — to confirm before the knowledge
  pack is built.
  Still open: messages after the 24h customer-service window; business name in guest
  copy ("Seoul Stay Goshiwon" vs site name "Seoul Goshiwon by Star Goshiwon"); the
  user's own remaining questions.
- 2026-11-18: remaining questions settled; Phase 1 built on branch
  `claude/whatsapp-agent`. Decisions:
  - Guest-facing business name: **Star Goshiwon**.
  - Refund timing follows the policy page: within 5 business days after checkout.
  - **No shadow mode.** Live as soon as built; the launch gate is the eval passing.
    Per-category switches stay. Drafts are made only for handoffs.
  - Same-day / next-day check-in: handoff.
  - Stays under 7 nights: the agent says no (minimum 7 nights).
  - Korean messages: handoff. Cash, bank transfer, paying in parts, prices from other
    sites: handoff.
  - Passport photo: the agent asks for it on WhatsApp after a booking request.
  - Manager-only facts (late checkout fee, key/towel fees, smoking fine, etc.) may be
    answered; they live in `lib/whatsapp-agent/facts.ts`.
  - Women: decline only, no alternative places suggested.
  - Residence confirmation for a confirmed guest: the agent replies that it is being
    prepared and the filled document waits on the admin page; the manager sends it
    with one tap.
  - Phone number: shared with the manager via coexistence (Business app + Cloud API).
  - Viewings are by appointment (FAQ and contact page fixed).
  - Models: compared across providers; first tests on the cheapest (OpenAI GPT-6
    Luna), switchable by setting. Chinese models only through non-Chinese hosts.
    Gemini needs a paid key for live use. Anthropic adapter deferred (needs the SDK).
  **Next: user runs `pnpm eval:whatsapp` and shares the summary.**
