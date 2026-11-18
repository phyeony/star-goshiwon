# WhatsApp Agent Implementation Plan

> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the WhatsApp auto-reply agent described in `plan/whatsapp-agent.md`:
safe questions answered instantly in English, everything else handed silently to the
manager with a Korean summary on `/admin/whatsapp`.

**Spec:** `plan/whatsapp-agent.md` (approved; decisions through 2026-11-18 in its §7).

**Architecture:** Pure, unit-tested core in `lib/whatsapp-agent/` (knowledge pack,
tools with injected deps, decision engine, LLM adapters behind an `LlmClient`
interface). Thin I/O shells around it: webhook route, Cloudflare Queue consumer in a
custom `worker.ts`, Graph API sender, Supabase queries, admin page. **Code decides
send vs. draft; the model only classifies and drafts.**

**Tech stack:** Next.js App Router on Cloudflare via @opennextjs/cloudflare, Supabase
(service client), zod, vitest, Playwright. LLM providers called with plain `fetch`.

## Global constraints

- **pnpm only.** Tests: `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm test:e2e`.
- **No new dependencies** (LLM + Graph API via `fetch`; zod for structured output).
- Unit tests live under `lib/**/*.test.ts` (vitest `include`).
- Guest-facing copy English; admin copy Korean.
- Migrations: apply to supabase-dev when written; to prod only right before deploy.
  Mirror every migration in `supabase/schema.sql`. RLS: service role only.
- Claude never reads `.env*` files. Every new env key is added to `.env.example`
  and defined (even empty) in `.env.staging`.
- Real guest chats never enter the repo un-anonymised.

---

## Phase 1 — agent core + eval (spec build step 1)

Tasks 1–7 need nothing from the user. Task 8 needs the chat export (action 1) and
API keys (action 3) to *run*; the harness and adversarial cases can be written first.

### Task 1: `lib/policies-data.ts` + policies page renders from it

**Files:** create `lib/policies-data.ts`, `lib/policies-data.test.ts`; modify
`app/policies/page.tsx`.

- [ ] Capture the current rendered `/policies` text (dev server, `curl | html-to-text`
      via a small script in the scratchpad) as the baseline.
- [ ] Define `PolicySection = { id; title; blocks: PolicyBlock[] }` where
      `PolicyBlock` is `p | ul | ol` of inline runs (`text | strong | link`).
      Export `buildPolicySections({ discountPct, responseTime, stayTimes })`.
- [ ] Move the 15 sections from JSX into data, keeping wording byte-for-byte.
- [ ] Page maps sections → existing `Section` component; `sections` nav list is
      derived from the data (removes the duplicated id/label list).
- [ ] Export `policiesPlainText(sections)` for the knowledge pack.
- [ ] Test: every section has id/title/≥1 block; plain text contains the dynamic
      discount and stay times. Re-render and diff against the baseline: no change.
- KO page (`app/policies/ko`) is out of scope (agent is English only).

### Task 2: FAQ viewing fix

- [ ] `lib/site-data.ts` `buildFaqs`: "Can I see the room before booking?" →
      "Yes — viewings are by appointment. Message us on WhatsApp to arrange a time."
      (drop the walk-in line).
- [ ] Grep for other "walk-in" copy (guides, KO pages) and list findings; change only
      English guest copy that contradicts the appointment rule.

### Task 3: Knowledge pack — `lib/whatsapp-agent/knowledge.ts`

- [ ] `buildKnowledgePack({ rooms, faqs, policies, guides, approvedQas })` →
      deterministic string with stable section headers (cache-friendly: static
      content first, nothing time-dependent).
- [ ] Includes: siteConfig (name, address, map links, response time), stayTimes,
      amenities, nearbyLocations, room types with nightly rate / long-stay discount
      (via `roomTier`), deposit, bedding fee, min stay, FAQs, policies plain text,
      guide bodies (stripped markdown, pricing tokens filled), approved Q&As.
- [ ] Excludes room-unit names/numbers and any admin data.
- [ ] `lib/whatsapp-agent/approved-qas.ts`: empty typed array for now (filled in Task 8).
- [ ] Tests: deterministic for same input; contains men-only rule, deposit, check-in
      time; never contains a unit name passed in fixtures.

### Task 4: Types + decision engine — `lib/whatsapp-agent/{types,decide}.ts`

- [ ] Types: `Category`, `MenOnlyState`, `BotState`, `Mode`, `AgentOutput` (zod schema:
      `reply, category, men_only_signal, needs_human, reason_ko, summary_ko,
      guest_message_ko`), `WhatsAppSettings`, `Decision`.
- [ ] `nextMenOnlyState(state, signal)`: asked+confirmed→confirmed,
      asked+declined→not_eligible, none→unchanged; first contact → asked.
- [ ] `decide({ mode, settings, botState, menOnlyState, isFirstContact,
      agentOutput, availabilityFull, linkedBooking })` →
      `{ outcome: 'sent'|'draft'|'skipped', markRead, reply, newMenOnlyState,
      newBotState }`. Rules exactly as spec §1.1–1.3:
  - auto-send iff `mode=live && category switch on && !needs_human &&
    bot_state=active && men_only_state≠not_eligible` and category is auto-send.
  - `availability` + full → draft.
  - first contact + non-safe question → send check-only reply, `markRead=false`,
    question drafted.
  - `not_eligible` → skipped (decline already sent); `off` → skipped, no draft;
    `paused_by_manager` → draft.
  - declined signal → send configured decline text, set `not_eligible`.
  - shadow → draft, `markRead=false`.
- [ ] Confirmed-guest mode (spec §1.6): when `linkedBooking.status='confirmed'`, the
      auto-send allow-list is `location` + `rules`, plus
      `pricing` only when the quote tool ran with room + dates; all other categories →
      draft; never a booking link; no men-only check. Table-driven tests incl.
      "extension price" and "wifi broken" from a confirmed guest → draft.
- [ ] `ensureMenOnlyCheck(reply, state)`: appends the check while `asked`/first.
- [ ] `stripBookingLinkIfLinked` / no link or booking steps until `confirmed`.
- [ ] Table-driven tests for every row in spec §1.1 and §1.2, batching (one
      handoff part → whole turn draft), shadow never marks read.

### Task 5: Read-only tools — `lib/whatsapp-agent/tools.ts`

- [ ] Deps injected (`{ getRooms, getRoomUnitAvailability, siteUrl, now }`) so tests
      need no DB.
- [ ] `get_quote(room, check_in, check_out)` → `calculateEstimate` with the room's
      tier; validates min stay (7 nights) and past dates; returns USD + approx KRW.
- [ ] `check_availability(check_in, check_out)` → `{ room_type, free_count }[]`
      using `isRoomUnitAvailableForBooking`; no unit names.
- [ ] `booking_link(room?, check_in?, check_out?)` → `/request-to-book?...`
      (check query param names in `app/request-to-book/page.tsx`).
- [ ] Tool JSON schemas exported for the adapters.
- [ ] Tests: quote equals `calculateEstimate`; 28-night discount; availability counts
      with overlapping blocks; output never includes `name` of a unit.

### Task 6: `LlmClient` + adapters — `lib/whatsapp-agent/llm/`

- [ ] `LlmClient.run({ system, messages, tools, maxToolRounds }) →
      { output: unknown, usage, latencyMs }`. Structured output via a final
      `respond` tool whose input schema is `AgentOutput`.
- [ ] `anthropic.ts` (Messages API, `cache_control` on system/knowledge block),
      `workers-ai.ts` (REST `accounts/{id}/ai/run/{model}`), `openai-compatible.ts`
      (base URL + key: OpenAI, OpenRouter, Gemini OpenAI endpoint).
- [ ] `createLlmClient(config, env)` factory; provider/model from settings.
- [ ] Tests with mocked `fetch`: tool round-trip, `respond` parsing, HTTP error →
      throws typed error, max-rounds guard.

### Task 7: Agent — `lib/whatsapp-agent/agent.ts`

- [ ] System prompt (voice + content rules §1.4, injection resistance, categories,
      men-only instructions keyed on state, linked-booking line), then knowledge pack.
- [ ] `runAgent({ llm, tools, conversation, pendingMessages, linkedBooking,
      menOnlyState })` → `AgentOutput`; zod-validate; invalid/timeout →
      `{ needs_human: true, category: 'other' }` (never sends).
- [ ] Post-check in code: reject replies containing a price not produced by a tool
      call or the knowledge pack, payment links, or unit names → force handoff.
- [ ] Tests with a fake `LlmClient`.

### Task 8: Eval — `pnpm eval:whatsapp`

- [ ] `scripts/eval-whatsapp.ts` (tsx) + `eval/whatsapp/cases.json`; script
      `"eval:whatsapp": "dotenv -e .env.local -- tsx scripts/eval-whatsapp.ts"`.
- [ ] Case shape: messages, state, linked booking, fixture rooms/availability,
      expectations (category, handoff, must/mustn't contain, price check).
- [ ] Write adversarial cases now (injection, discount fishing, unlinked "is my
      booking confirmed?", women enquiring, groups, mixed safe+handoff, unknown).
- [ ] **Needs user:** chat export → anonymise outside the repo → real-chat cases +
      draft Q&A list (KO + EN) for approval → `approved-qas.ts`.
- [ ] **Needs user:** API keys in `.env.local`. Run all candidates; report pass rate
      per category, cost / 100 conversations, p50/p95 latency; recommend a model.

## Phase 2 — booking form WhatsApp fields (spec step 2)

### Task 9
- [ ] Migration `2026-10-xx-booking-whatsapp.sql`: `booking_requests.whatsapp_number
      text`, `whatsapp_opt_in boolean not null default false`.
- [ ] `lib/whatsapp-agent/phone.ts`: `normalizeE164(input, defaultCountry='KR')`
      (no new dep; handles `+`, `00`, spaces/dashes, leading `0` for KR) + tests.
- [ ] `lib/validation.ts`: optional `whatsapp_number` (valid E.164 after normalising),
      `whatsapp_opt_in` boolean; opt-in requires a number.
- [ ] `components/request-form.tsx`: field + checkbox ("Message me on WhatsApp about
      this request — <site name>"); API route stores normalised number.
- [ ] e2e: submit with/without number.

## Phase 3 — webhook, queue, sending on staging (spec step 3)

### Task 10: Tables
- [ ] Migration: `whatsapp_conversations`, `whatsapp_messages`, `whatsapp_settings`
      (single row, seeded `mode='off'`) per spec §2.5; indexes on `wa_phone`,
      `wa_message_id` (unique), `(conversation_id, created_at)`.
- [ ] `lib/whatsapp-queries.ts` service-client wrappers + types in `lib/types.ts`.

### Task 11: Worker entry
- [ ] `worker.ts` re-exporting OpenNext `fetch` + `queue` + `scheduled`; wrangler
      `main` → `worker.ts`; queue producer/consumer bindings + cron for prod and
      staging (separate queue names). Verify `pnpm preview` still serves the site.

### Task 12: Webhook `/api/whatsapp/webhook`
- [ ] GET verify handshake; POST HMAC-SHA256 `X-Hub-Signature-256` with
      constant-time compare (Web Crypto) — unit tested with a known vector.
- [ ] Parse messages/statuses/echoes; upsert conversation; insert message (dedupe on
      `wa_message_id`); manager echo → `paused_by_manager`; media → type only;
      enqueue `{ conversationId }`; 200 fast.

### Task 13: Queue consumer + sender
- [ ] Load conversation + unanswered guest messages (batch) → linked booking by phone
      → `runAgent` → `decide` → Graph API send → insert outbound row → mark read.
      Failure → draft with error, no read. Idempotent on re-delivery.
- [ ] `lib/whatsapp-agent/graph.ts`: `sendText`, `sendTemplate`, `markRead` + tests
      (ordering: send fails ⇒ markRead never called).
- [ ] Booking-submit hook: opt-in → utility template + linked conversation
      (`men_only_state='asked'`). Template sending gated until approved (Task 16).
- [ ] Retention cron: delete conversations idle 12 months (query unit tested).
- [ ] Local: signed fake payloads via curl script `scripts/wa-fake-webhook.ts`.
- [ ] **Needs user:** Meta app, test number, secrets in staging (actions 5–6).

## Phase 4 — coexistence check (spec step 4, user)
- [ ] User starts Embedded Signup on the +82 number; record the result in the spec.

## Phase 5 — admin page (spec step 5)

### Task 14: `/admin/whatsapp`
- [ ] Nav entry next to 인박스. List (badges: 답변 대기, 마감–대상 아님, 봇 일시정지/꺼짐,
      linked booking). Conversation view: messages + Korean translation, summary,
      handoff reason, suggested reply with 복사 and ✓/✗, send button only in live,
      name-match hint confirm, bot resume/off.
- [ ] Settings: mode, per-category switches, ✓/✗ counts per category.
- [ ] `/api/admin/whatsapp/*` routes with `getAdminUserOrNull()`.
- [ ] e2e with fixture conversations.

## Phase 6–7 — template, shadow, go-live
- [ ] Task 15: write booking-received template text; user submits it.
- [ ] Task 16: connect real number in `shadow`; review drafts with the manager.
- [ ] Task 17: per-category live switch after ~20 ✓ with zero factual errors,
      men-only first.

---

## Phase 1 as built (2026-11-18)

- Policies: `components/policies-content.tsx` (shared by the page and the knowledge
  pack via `lib/whatsapp-agent/policies-text.ts`) instead of `lib/policies-data.ts`.
- Two JSON calls per turn, no tool-calling: understanding → code computes quote and
  availability → reply → guard → `decide()`.
- `lib/whatsapp-agent/llm.ts`: one OpenAI-compatible client covers OpenAI, Gemini,
  OpenRouter, Workers AI. Anthropic adapter deferred.
- Eval: `scripts/whatsapp-eval/` (cases from the anonymised chats plus tricky cases),
  run with `pnpm eval:whatsapp [--provider X --model Y --effort low --only a,b]`.
  Results go to `scripts/whatsapp-eval/results/` (git-ignored).
- Phase 6–7: no shadow mode; go live once the eval passes.
