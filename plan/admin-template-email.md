# Admin Dashboard: Send Template Email to Guest

## Context

Today the admin can manage booking requests at `/admin/requests/[id]` but the only way to email a guest is a `mailto:` link in `components/admin/request-actions.tsx:113` — it opens the admin's local mail client with a hardcoded subject and one prefilled line. There are no reusable response templates, no preview, no audit trail, and no protection on the admin surface (the current `middleware.ts` 404s every `/api/admin/*` call, leaving status mutations broken in prod and the `/admin` pages publicly reachable).

This change adds in-app composing: the admin picks one of four prebuilt templates (Approved / Declined / Awaiting more info / Generic follow-up) on the request detail page, sees the email previewed with the booking's data interpolated, edits subject/body, and sends. Sends go through the existing SMTP path in `lib/email.ts` (which already routes to `DEV_EMAIL_OVERRIDE` in dev/staging). At the same time we replace the placeholder middleware with real Supabase-Auth-backed admin login, so this feature ships behind a working authn gate.

## Decisions

- **Auth:** Supabase Auth via `@supabase/ssr`, magic-link sign-in, email allowlist driven by the existing `ADMIN_EMAIL` env var (extended to comma-separated). Supabase is already in the stack; magic links avoid password UX. Service-role client (`lib/supabase.ts`) stays as-is for queries; new SSR clients are auth-only — no RLS work in this task.
- **Templates:** Pure functions of `BookingRequestWithRoom`, English (guests are foreigners), in a new `lib/admin-email-templates.ts`. Safe to import client-side for live preview.
- **Editing:** Admin edits **plain text** (subject + body). Server wraps text in branded HTML chrome. No rich-text editor.
- **Preview:** Client-side, in a sandboxed `<iframe srcDoc>` so the email's inline styles don't pollute the admin page.
- **Send API contract:** Client POSTs already-rendered `{ subject, text, templateId? }`. Server wraps text → html and sends. The API doesn't re-render templates, so admin edits are honored verbatim. `templateId` is logged-only.
- **Audit trail:** Append `\n[YYYY-MM-DD] Sent email "<subject>" by <admin email>` to `admin_notes` on success. No new table.
- **Reuse over rebuild:** Export the existing private `sendEmail` from `lib/email.ts`. Extract the header/footer chrome from `buildGuestConfirmationHtml` into a shared `wrapEmailHtml` helper so both flows share styling.

## Implementation

### Step 1 — Auth foundation (blocks Steps 4–5)

**Install:** `@supabase/ssr`. **New env:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`. `ADMIN_EMAIL` becomes comma-tolerant. Add `${NEXT_PUBLIC_SITE_URL}/auth/callback` to Supabase → Auth → Redirect URLs.

**Create:**
- `lib/admin-auth.ts` — `parseAdminAllowlist(): string[]`, `isAdminEmail(email): boolean`.
- `lib/supabase-server.ts` — `createSupabaseServerClient()` using `createServerClient` + `next/headers` cookies; `getAdminUserOrNull()` returns user iff `isAdminEmail(user.email)`.
- `lib/supabase-browser.ts` — `createSupabaseBrowserClient()`.
- `app/admin/login/page.tsx` — server component, renders `<LoginForm />`.
- `components/admin/login-form.tsx` — client; calls `signInWithOtp({ email, options: { emailRedirectTo: ${origin}/auth/callback } })`; "check your inbox" state.
- `app/auth/callback/route.ts` — `GET`; `exchangeCodeForSession(code)`; if email not allowlisted → sign out + redirect to `/admin/login?error=forbidden`; else redirect to `?next=` or `/admin`.

**Modify:**
- `middleware.ts` — replace 404. New matcher `["/admin/:path*", "/api/admin/:path*"]` excluding `/admin/login` and `/auth/callback`. Use the official `@supabase/ssr` middleware recipe (cookies set on both request and response). Unauth → `/admin/*` redirects to `/admin/login?next=…`; `/api/admin/*` returns 401. Do **not** import `lib/email.ts` (would pull `nodemailer`/`worker-mailer` into the edge bundle).
- `app/admin/layout.tsx` — render real shell; optional belt-and-suspenders `getAdminUserOrNull()` redirect.

**Cloudflare note:** Declare `export const runtime = "nodejs"` on `/auth/callback` and `/api/admin/*` routes for cookie-chunking semantics.

### Step 2 — Refactor `lib/email.ts` for reuse (parallel with Step 1)

- Change `async function sendEmail(...)` → `export async function sendEmail(...)` (signature unchanged).
- Extract header/footer chrome into a new `lib/email-html.ts` (sibling module to keep client bundles free of `nodemailer`):
  - `wrapEmailHtml(bodyHtml: string, opts?: { preheader?: string }): string`
  - `textToEmailHtml(text: string): string` — escapes HTML, `\n\n` → `<p>`, `\n` → `<br />`, autolinks URLs and emails.
- Refactor `buildGuestConfirmationHtml` to call `wrapEmailHtml(innerContent)` so styling stays single-sourced. Re-export both helpers from `lib/email.ts` for convenience.

### Step 3 — Template module

**Create** `lib/admin-email-templates.ts`:

```ts
export type AdminEmailTemplateId = "approved" | "declined" | "more_info" | "follow_up";

export interface AdminEmailTemplate {
  id: AdminEmailTemplateId;
  label: string;
  description: string;
  buildSubject(req: BookingRequestWithRoom): string;
  buildText(req: BookingRequestWithRoom): string;
}

export const ADMIN_EMAIL_TEMPLATES: AdminEmailTemplate[];
export function getTemplate(id: AdminEmailTemplateId): AdminEmailTemplate;
```

Variables interpolated from `BookingRequestWithRoom`: `guest_name`, `rooms?.name ?? room_slug`, `check_in_date`, `check_out_date`, `guest_count`, `formatUSD(estimated_total)`, plus `siteConfig.email/url/responseTime`. Templates:

1. **`approved`** — confirms availability, payment instructions (PayPal + total + deposit), check-in logistics teaser.
2. **`declined`** — apology, suggest alternative dates, link back to `/rooms`.
3. **`more_info`** — bulleted ask for passport scan, exact arrival, visa status.
4. **`follow_up`** — short prefilled greeting + booking reference; mostly empty for the admin to fill in.

### Step 4 — Send API endpoint

**Create** `app/api/admin/requests/[id]/send-email/route.ts`:

```ts
export const runtime = "nodejs";
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> })
```

Flow:
1. `getAdminUserOrNull()` → 401 if missing.
2. Zod-validate body: `{ subject: string(1..200), text: string(1..10000), templateId?: AdminEmailTemplateId }`.
3. `getBookingRequestById(id)` from `lib/queries.ts` → 404 if missing.
4. `const html = wrapEmailHtml(textToEmailHtml(text))`.
5. `await sendEmail(req.guest_email, subject, text, html)`.
6. Append audit line to `admin_notes`; persist via existing update path used by `app/api/admin/requests/[id]/route.ts`.
7. Return `{ ok: true }`. Errors → 500 `{ error: "send_failed" }`, do not swallow.

### Step 5 — UI composer

**Create** `components/admin/email-composer.tsx` (client). Props: `{ request: BookingRequestWithRoom }`.

Layout (sits in the sidebar **below** existing `<RequestActions>`, in its own card):
- Header "Email Guest" with `request.guest_email` shown.
- Template `<select>` from `ADMIN_EMAIL_TEMPLATES`. Selecting overwrites `subject`/`text`; if admin already typed edits, `window.confirm` first.
- Subject `<input>`.
- Body `<textarea rows={14}>`.
- Toggle "Show preview" → `<iframe srcDoc={wrapEmailHtml(textToEmailHtml(text))} sandbox="" style="height:500px">`.
- "Send to {email}" primary button. POST `/api/admin/requests/{id}/send-email` with `{ subject, text, templateId }`. On 200: success banner + `router.refresh()` (surfaces appended audit line). On error: red banner + retry.

**Modify** `components/admin/request-actions.tsx` — delete the `mailto` anchor (lines 52–57, 111–117) and `mailtoSubject`/`mailtoBody` consts. Keep "Copy Summary".

**Modify** `app/admin/requests/[id]/page.tsx` — render `<EmailComposer request={request} />` directly under `<RequestActions />` in the sidebar `<div>`; both share the sticky column.

## Critical files

- `middleware.ts` — replaced
- `lib/email.ts` — export `sendEmail`, refactor to use `wrapEmailHtml`
- `lib/email-html.ts` (new) — `wrapEmailHtml`, `textToEmailHtml`
- `lib/admin-auth.ts` (new), `lib/supabase-server.ts` (new), `lib/supabase-browser.ts` (new)
- `lib/admin-email-templates.ts` (new)
- `app/admin/login/page.tsx` (new), `components/admin/login-form.tsx` (new)
- `app/auth/callback/route.ts` (new)
- `app/api/admin/requests/[id]/send-email/route.ts` (new)
- `components/admin/email-composer.tsx` (new)
- `components/admin/request-actions.tsx` — drop mailto block
- `app/admin/requests/[id]/page.tsx` — mount composer
- `app/admin/layout.tsx` — real shell

## Sequencing

Steps 1, 2, 3 can run in parallel. Step 4 depends on 1+2+3. Step 5 depends on 3+4 (and 2 for client-side preview helpers).

## Verification

1. `npm run dev`. Visit `/admin/requests` unauthenticated → redirect to `/admin/login`. Curl `/api/admin/requests/x` → 401.
2. Sign in with allowlisted email; magic-link mail arrives at `DEV_EMAIL_OVERRIDE` (subject prefixed `[DEV → real-admin@…]`); clicking lands on `/admin`.
3. Sign in with a non-allowlisted email → callback rejects with visible error.
4. Open a real request → pick each of 4 templates; subject/body populate; switching after edits prompts confirm.
5. Toggle preview → iframe renders branded shell wrapping the text; URLs/emails autolink.
6. Send → success banner, page refreshes, `admin_notes` shows new audit line, override mailbox receives the email.
7. `npm run preview` (opennextjs-cloudflare): repeat sign-in + send to confirm worker-runtime cookies and the `worker-mailer` send path both work.
8. Confirm `middleware.ts` does not transitively import `lib/email.ts` (would break edge bundle).
