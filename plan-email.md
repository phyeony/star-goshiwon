# Email Plan — Seoul Goshiwon

## Goal

Send transactional booking emails from Cloudflare Workers (via OpenNext) with
coherent branding across automated messages and admin replies, without paying
for Google Workspace or any email service.

## Current (interim) setup

- SMTP via `worker-mailer` in production (Cloudflare Workers) and `nodemailer`
  in development, selected by `process.env.NODE_ENV` inside `lib/email.ts`.
- Sender: `stargoshiwon.seoul@gmail.com` (Gmail), authenticated via SMTP.
- `@opennextjs/cloudflare` is patched (via `patch-package`) to mark
  `cloudflare:sockets` as external in its server-bundle esbuild pass, because
  OpenNext exposes no config hook for custom externals and worker-mailer
  imports `cloudflare:sockets` internally.

This works, but ties us to Gmail SMTP and requires a node_modules patch.

## Target setup (when ready to migrate off Gmail SMTP)

### 1. Buy a domain

- Register `stargoshiwon.com` (or similar) — ~$12/year.
- All branding and reply addresses live on this domain.

### 2. Automated transactional email via Resend

- Use Resend (free tier: 3k emails/month, 100/day — plenty for a goshiwon).
- Send from `Seoul Goshiwon <noreply@stargoshiwon.com>`.
- Verify the domain in Resend: add their DKIM/SPF DNS records.
- Replace `worker-mailer` calls in `lib/email.ts` with `fetch()` to
  `https://api.resend.com/emails`. No SMTP, no sockets — removes the need
  for the OpenNext patch entirely.
- Store `RESEND_API_KEY` as a Cloudflare secret.

Transactional emails that should go through Resend:
- Booking request confirmation (guest)
- Admin notification of new request
- Approval / rejection from the admin dashboard
- Any future reminders or follow-ups

### 3. Receive inbound mail via Cloudflare Email Routing (free)

- Add MX records for `stargoshiwon.com` pointing at Cloudflare Email Routing.
- Create a routing rule: `hello@stargoshiwon.com` → `stargoshiwon.seoul@gmail.com`.
- Guests who reply to transactional emails land in the existing Gmail inbox.

### 4. Reply as the custom domain via Gmail "Send mail as" (free)

- In Gmail → Settings → Accounts → "Send mail as", add
  `hello@stargoshiwon.com` as an alias.
- Configure it to send via `smtp.gmail.com` using a Google App Password.
- Set it as the default reply address for threads arriving at that alias —
  Gmail auto-picks it when replying, so the admin never has to think about it.

### 5. Email header conventions

On every outgoing transactional email:

```
From:     Seoul Goshiwon <noreply@stargoshiwon.com>
Reply-To: hello@stargoshiwon.com
```

- `From` carries the brand and is DKIM-signed by the sending domain.
- `Reply-To` routes conversations to the monitored alias, which Cloudflare
  forwards to Gmail, where the admin replies using Send-As.
- Guests never see a raw `@gmail.com` address anywhere in the thread.

## What the guest experiences

| Message | From shown to guest |
| --- | --- |
| Booking confirmation | `noreply@stargoshiwon.com` (Resend) |
| Admin approval / rejection via dashboard | `noreply@stargoshiwon.com` (Resend) |
| Manual admin reply (Gmail Send-As) | `hello@stargoshiwon.com` |
| Guest reply | goes to `hello@stargoshiwon.com` → forwarded to Gmail |

Every address the guest sees is on `stargoshiwon.com`. No Gmail address leaks.
All of this is free beyond the domain registration.

## Why not the alternatives

- **MailChannels:** free, no signup, but no dashboard/logs and historically
  flaky policy changes. Email is core to the booking flow — visibility matters.
- **Gmail API via OAuth2:** lets us keep sending from the raw Gmail address,
  but requires a Google Cloud project, OAuth consent flow, refresh token
  rotation, and still looks unprofessional (`@gmail.com` in From).
- **Continuing with SMTP + worker-mailer:** works, but requires patching
  `@opennextjs/cloudflare` and ties us to Gmail's SMTP auth. Acceptable as an
  interim; not the long-term target.

## Migration checklist (future)

- [ ] Register domain
- [ ] Create Resend account, verify domain, add DKIM/SPF records
- [ ] Rewrite `lib/email.ts` `sendEmail` to `fetch` Resend's API
- [ ] Remove `worker-mailer`, `nodemailer`, `@types/nodemailer` from deps
- [ ] Remove the `@opennextjs/cloudflare` patch and uninstall `patch-package`
- [ ] Remove `worker-mailer` from `serverExternalPackages` in `next.config.ts`
- [ ] Enable Cloudflare Email Routing, create `hello@stargoshiwon.com` rule
- [ ] Configure Gmail Send-As for `hello@stargoshiwon.com` (app password)
- [ ] Update `FROM_EMAIL` / `ADMIN_EMAIL` / Reply-To in email templates
- [ ] Verify deliverability with a test send to Gmail, Outlook, Naver, Daum
