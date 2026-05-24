import { siteConfig } from "./site-data";
import {
  formatUSD,
  formatApproxKRW,
  DEPOSIT_USD,
  type PricingBreakdown,
} from "./pricing";
import { wrapEmailHtml } from "./email-html";
import { storeTestEmail } from "./test-email-outbox";

export { wrapEmailHtml, textToEmailHtml } from "./email-html";

interface BookingEmailData {
  guest_name: string;
  guest_email: string;
  room_name: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  estimated_total: number;
  bedding_prepaid: boolean;
  notes: string;
  breakdown: PricingBreakdown;
}

interface PaymentLinkEmailData {
  guest_name: string;
  guest_email: string;
  room_name: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  estimated_total: number;
  payment_url: string;
  payment_expires_at: string;
}

function renderRateRowsHtml(b: PricingBreakdown) {
  const rows: string[] = [];
  if (b.weeks > 0) {
    rows.push(
      `<tr><td style="padding: 6px 0; color: #6b7280;">${formatUSD(b.weeklyRate)} × ${b.weeks} week${b.weeks > 1 ? "s" : ""}</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${formatUSD(b.weeklySubtotal)}</td></tr>`
    );
  }
  if (b.days > 0) {
    rows.push(
      `<tr><td style="padding: 6px 0; color: #6b7280;">${formatUSD(b.dailyRate)} × ${b.days} day${b.days > 1 ? "s" : ""}</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${formatUSD(b.dailySubtotal)}</td></tr>`
    );
  }
  if (b.discountApplied) {
    rows.push(
      `<tr><td style="padding: 6px 0; color: #15803d;">Long-stay discount (15%)</td><td style="padding: 6px 0; text-align: right; font-weight: 600; color: #15803d;">−${formatUSD(b.discount)}</td></tr>`
    );
  }
  return rows.join("");
}

function renderRateLinesText(b: PricingBreakdown, currencyLabel?: string) {
  const lines: string[] = [];
  if (b.weeks > 0) {
    lines.push(
      `- ${formatUSD(b.weeklyRate)} × ${b.weeks} week${b.weeks > 1 ? "s" : ""}: ${formatUSD(b.weeklySubtotal)}`
    );
  }
  if (b.days > 0) {
    lines.push(
      `- ${formatUSD(b.dailyRate)} × ${b.days} day${b.days > 1 ? "s" : ""}: ${formatUSD(b.dailySubtotal)}`
    );
  }
  if (b.discountApplied) {
    lines.push(`- ${currencyLabel ?? "Long-stay discount (15%)"}: −${formatUSD(b.discount)}`);
  }
  return lines.join("\n");
}

function renderRateRowsHtmlKo(b: PricingBreakdown) {
  const rows: string[] = [];
  if (b.weeks > 0) {
    rows.push(
      `<tr><td style="padding: 6px 0; color: #6b7280;">${formatUSD(b.weeklyRate)} × ${b.weeks}주</td><td style="padding: 6px 0; font-weight: 600;">${formatUSD(b.weeklySubtotal)}</td></tr>`
    );
  }
  if (b.days > 0) {
    rows.push(
      `<tr><td style="padding: 6px 0; color: #6b7280;">${formatUSD(b.dailyRate)} × ${b.days}일</td><td style="padding: 6px 0; font-weight: 600;">${formatUSD(b.dailySubtotal)}</td></tr>`
    );
  }
  if (b.discountApplied) {
    rows.push(
      `<tr><td style="padding: 6px 0; color: #15803d;">장기 숙박 할인 (15%)</td><td style="padding: 6px 0; font-weight: 600; color: #15803d;">−${formatUSD(b.discount)}</td></tr>`
    );
  }
  return rows.join("");
}

function renderRateLinesTextKo(b: PricingBreakdown) {
  const lines: string[] = [];
  if (b.weeks > 0) {
    lines.push(`- ${formatUSD(b.weeklyRate)} × ${b.weeks}주: ${formatUSD(b.weeklySubtotal)}`);
  }
  if (b.days > 0) {
    lines.push(`- ${formatUSD(b.dailyRate)} × ${b.days}일: ${formatUSD(b.dailySubtotal)}`);
  }
  if (b.discountApplied) {
    lines.push(`- 장기 숙박 할인 (15%): −${formatUSD(b.discount)}`);
  }
  return lines.join("\n");
}

function formatTotal(amount: number) {
  return `${formatUSD(amount)} (${formatApproxKRW(amount)})`;
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "465");
  const username = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;

  if (!host || !username || !password) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    credentials: { username, password },
    authType: "plain" as const,
  };
}

function parseFromAddress(): { name?: string; email: string } {
  const raw = process.env.FROM_EMAIL;
  if (raw) {
    const match = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
    if (match) return { name: match[1] || undefined, email: match[2] };
    return { email: raw };
  }
  return { name: "Seoul Goshiwon By Star Goshiwon", email: siteConfig.email };
}

const fromAddress = parseFromAddress();
const adminEmail =
  process.env.ADMIN_EMAIL || "stargoshiwon.seoul@gmail.com";

export function buildGuestConfirmationHtml(data: BookingEmailData) {
  const inner = `
    <p style="font-size: 16px; margin-top: 0;">Hi ${data.guest_name},</p>
    <p style="margin-top: 16px; font-size: 16px;">Thank you for your booking request! We have received it and will review availability shortly.</p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h2 style="font-size: 16px; margin: 0 0 12px; color: #374151;">Request Summary</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 6px 0; color: #6b7280;">Room</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.room_name}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Check-in</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.check_in_date}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Check-out</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.check_out_date}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Guests</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.guest_count}</td></tr>
        <tr><td colspan="2" style="padding: 8px 0 0;"><div style="border-top: 1px solid #e5e7eb;"></div></td></tr>
        ${renderRateRowsHtml(data.breakdown)}
        ${data.bedding_prepaid ? `<tr><td style="padding: 6px 0; color: #6b7280;">Bedding set</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">$15 prepaid</td></tr>` : ""}
        <tr><td style="padding: 6px 0; color: #6b7280;">Refundable deposit</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${formatUSD(DEPOSIT_USD)} prepaid</td></tr>
        <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 10px 0 6px; color: #6b7280; font-weight: 600;">Total to prepay</td><td style="padding: 10px 0 6px; text-align: right; font-weight: 700; font-size: 16px;">${formatTotal(data.estimated_total)}</td></tr>
      </table>
      <p style="margin: 8px 0 0; font-size: 12px; color: #6b7280;">The ${formatUSD(DEPOSIT_USD)} deposit is refunded via PayPal at the end of your stay if the room is left undamaged.</p>
      ${data.notes ? `<p style="margin: 12px 0 0; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;"><strong>Your message:</strong> ${data.notes}</p>` : ""}
    </div>

    <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>Important:</strong> This is a request, not a confirmed booking. We will review availability and respond via email within ${siteConfig.responseTime}.</p>
    </div>

    <p style="margin: 16px 0; font-size: 13px; color: #6b7280;">By submitting this request and completing the PayPal payment, you reaffirm the <a href="${siteConfig.url}/policies" style="color: #4f46e5;">booking &amp; house policies</a>, including the men-only restriction, 7-day minimum stay, and cancellation terms.</p>

    <p style="font-size: 16px;">If you have any questions, reply to this email or reach us on WhatsApp.</p>

    <p style="font-size: 16px; margin-top: 24px;">
      Best regards,<br />
      <strong>Seoul Goshiwon by Star Goshiwon</strong><br />
      <span style="color: #6b7280;">${siteConfig.address}</span><br />
      <a href="mailto:${siteConfig.email}" style="color: #4f46e5;">${siteConfig.email}</a>
    </p>`;

  return wrapEmailHtml(inner);
}

export function buildGuestConfirmationText(data: BookingEmailData) {
  return `Hi ${data.guest_name},

Thank you for your booking request at Seoul Goshiwon by Star Goshiwon!

Request Summary:
- Room: ${data.room_name}
- Check-in: ${data.check_in_date}
- Check-out: ${data.check_out_date}
- Guests: ${data.guest_count}

Price breakdown:
${renderRateLinesText(data.breakdown)}${data.bedding_prepaid ? `\n- Bedding set: $15 prepaid` : ""}
- Refundable deposit: ${formatUSD(DEPOSIT_USD)} prepaid (refunded via PayPal at end of stay)
- Total to prepay: ${formatTotal(data.estimated_total)}
${data.notes ? `\n- Your message: ${data.notes}` : ""}

IMPORTANT: This is a request, not a confirmed booking.
We will review availability and contact you via email within ${siteConfig.responseTime}.

By submitting this request and completing the PayPal payment, you reaffirm the booking & house policies (men-only, 7-day minimum, cancellation terms): ${siteConfig.url}/policies

If you have any questions, reply to this email or reach us on WhatsApp.

Best regards,
Seoul Goshiwon by Star Goshiwon
${siteConfig.email}`;
}

export async function sendGuestConfirmation(data: BookingEmailData) {
  const subject =
    "Your booking request has been received — Seoul Goshiwon by Star Goshiwon";
  const html = buildGuestConfirmationHtml(data);
  const text = buildGuestConfirmationText(data);
  await sendEmail(data.guest_email, subject, text, html);
}

export async function sendAdminNotification(data: BookingEmailData) {
  const subject = `새로운 예약 요청 - ${data.guest_name}님`;

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; color: #1f2937;">
  <h2 style="margin: 0 0 16px;">새로운 예약 요청</h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    <tr><td style="padding: 6px 0; color: #6b7280;">고객명</td><td style="padding: 6px 0; font-weight: 600;">${data.guest_name}</td></tr>
    <tr><td style="padding: 6px 0; color: #6b7280;">이메일</td><td style="padding: 6px 0;"><a href="mailto:${data.guest_email}">${data.guest_email}</a></td></tr>
    <tr><td style="padding: 6px 0; color: #6b7280;">객실</td><td style="padding: 6px 0; font-weight: 600;">${data.room_name}</td></tr>
    <tr><td style="padding: 6px 0; color: #6b7280;">체크인</td><td style="padding: 6px 0;">${data.check_in_date}</td></tr>
    <tr><td style="padding: 6px 0; color: #6b7280;">체크아웃</td><td style="padding: 6px 0;">${data.check_out_date}</td></tr>
    <tr><td style="padding: 6px 0; color: #6b7280;">인원</td><td style="padding: 6px 0;">${data.guest_count}명</td></tr>
    <tr><td colspan="2" style="padding: 8px 0 0;"><div style="border-top: 1px solid #e5e7eb;"></div></td></tr>
    ${renderRateRowsHtmlKo(data.breakdown)}
    ${data.bedding_prepaid ? `<tr><td style="padding: 6px 0; color: #6b7280;">침구 세트</td><td style="padding: 6px 0;">$15 선결제</td></tr>` : ""}
    <tr><td style="padding: 6px 0; color: #6b7280;">보증금 (환불)</td><td style="padding: 6px 0;">${formatUSD(DEPOSIT_USD)} 선결제</td></tr>
    <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 10px 0 6px; color: #6b7280;">총 선결제 금액</td><td style="padding: 10px 0 6px; font-weight: 700; font-size: 16px;">${formatTotal(data.estimated_total)}</td></tr>
  </table>
  ${data.notes ? `<p style="margin: 16px 0 0; padding: 12px; background: #f9fafb; border-radius: 8px; font-size: 14px;"><strong>고객 메시지:</strong> ${data.notes}</p>` : ""}
  <p style="margin-top: 20px;"><a href="${siteConfig.url}/admin/requests" style="display: inline-block; background: #4f46e5; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">대시보드에서 확인하기</a></p>
</div>`.trim();

  const text = `새로운 예약 요청이 접수되었습니다.

고객명: ${data.guest_name}
이메일: ${data.guest_email}
객실: ${data.room_name}
체크인: ${data.check_in_date}
체크아웃: ${data.check_out_date}
인원: ${data.guest_count}명

요금 내역:
${renderRateLinesTextKo(data.breakdown)}${data.bedding_prepaid ? `\n- 침구 세트: $15 선결제` : ""}
- 보증금 (환불): ${formatUSD(DEPOSIT_USD)} 선결제 (체크아웃 시 PayPal로 환불)
- 총 선결제 금액: ${formatTotal(data.estimated_total)}
${data.notes ? `\n고객 메시지: ${data.notes}` : ""}

확인하기: ${siteConfig.url}/admin/requests`;

  await sendEmail(adminEmail, subject, text, html);
}

export async function sendPaymentLinkEmail(data: PaymentLinkEmailData) {
  const deadline = new Date(data.payment_expires_at).toLocaleString("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const subject =
    "Your booking request is approved — review and pay to confirm";
  const html = wrapEmailHtml(`
    <h1 style="font-size: 22px; margin: 0 0 16px;">Your booking request is approved</h1>
    <p>Hi ${data.guest_name},</p>
    <p>Good news — your request for <strong>${data.room_name}</strong> has been approved. To confirm your booking, please review the details on our website and complete payment before <strong>${deadline}</strong>.</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px;"><strong>Room:</strong> ${data.room_name}</p>
      <p style="margin: 0 0 8px;"><strong>Dates:</strong> ${data.check_in_date} to ${data.check_out_date}</p>
      <p style="margin: 0 0 8px;"><strong>Guests:</strong> ${data.guest_count}</p>
      <p style="margin: 0;"><strong>Total to prepay:</strong> ${formatTotal(data.estimated_total)}</p>
    </div>
    <p style="margin: 24px 0;">
      <a href="${data.payment_url}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 700;">Review and pay securely</a>
    </p>
    <p style="font-size: 13px; color: #6b7280;">This button opens the booking summary on our website first. From there, you can continue to PayPal. PayPal may offer card checkout without a PayPal account, depending on your location, account settings, and PayPal risk checks.</p>
    <p>This booking is not confirmed until payment is completed.</p>
    <p>Best regards,<br /><strong>Seoul Goshiwon by Star Goshiwon</strong></p>
  `);

  const text = `Hi ${data.guest_name},

Your booking request for ${data.room_name} has been approved.

Dates: ${data.check_in_date} to ${data.check_out_date}
Guests: ${data.guest_count}
Total to prepay: ${formatTotal(data.estimated_total)}

Please review your booking details and complete payment before ${deadline} to confirm your booking:
${data.payment_url}

This link opens the booking summary on our website first. From there, you can continue to PayPal. PayPal may offer card checkout without a PayPal account, depending on your location, account settings, and PayPal risk checks.

This booking is not confirmed until payment is completed.

Best regards,
Seoul Goshiwon by Star Goshiwon`;

  await sendEmail(data.guest_email, subject, text, html);
}

export async function sendPaymentConfirmedEmail(
  data: Omit<PaymentLinkEmailData, "payment_url" | "payment_expires_at">
) {
  const subject = "Your booking is confirmed — Seoul Goshiwon by Star Goshiwon";
  const html = wrapEmailHtml(`
    <h1 style="font-size: 22px; margin: 0 0 16px;">Your booking is confirmed</h1>
    <p>Hi ${data.guest_name},</p>
    <p>We have received your payment and your booking is now confirmed.</p>
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px;"><strong>Room:</strong> ${data.room_name}</p>
      <p style="margin: 0 0 8px;"><strong>Dates:</strong> ${data.check_in_date} to ${data.check_out_date}</p>
      <p style="margin: 0 0 8px;"><strong>Guests:</strong> ${data.guest_count}</p>
      <p style="margin: 0;"><strong>Paid:</strong> ${formatTotal(data.estimated_total)}</p>
    </div>
    <p>We will follow up by email with check-in details.</p>
    <p>Best regards,<br /><strong>Seoul Goshiwon by Star Goshiwon</strong></p>
  `);

  const text = `Hi ${data.guest_name},

We have received your payment and your booking is now confirmed.

Room: ${data.room_name}
Dates: ${data.check_in_date} to ${data.check_out_date}
Guests: ${data.guest_count}
Paid: ${formatTotal(data.estimated_total)}

We will follow up by email with check-in details.

Best regards,
Seoul Goshiwon by Star Goshiwon`;

  await Promise.all([
    sendEmail(data.guest_email, subject, text, html),
    sendEmail(
      adminEmail,
      `예약 확정 - ${data.guest_name}님`,
      `결제가 완료되어 예약이 확정되었습니다.

고객명: ${data.guest_name}
이메일: ${data.guest_email}
객실: ${data.room_name}
체크인: ${data.check_in_date}
체크아웃: ${data.check_out_date}
결제 금액: ${formatTotal(data.estimated_total)}

확인하기: ${siteConfig.url}/admin/requests`
    ),
  ]);
}

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  if (process.env.E2E_TEST_MODE === "true") {
    storeTestEmail({ to, subject, text, html: html ?? "" });
    return;
  }

  // In local development and on the staging worker, redirect all outgoing
  // email to DEV_EMAIL_OVERRIDE so booking confirmations and admin
  // notifications can be tested without emailing real guests. Also send
  // FROM the override address so traces stay in the dev mailbox, not the
  // production sender's Sent folder. Tag the subject with the original
  // recipient so the intent is obvious in the inbox.
  let effectiveFrom = fromAddress;
  const isNonProdEnv =
    process.env.NODE_ENV === "development" || process.env.STAGING === "true";
  if (isNonProdEnv && process.env.DEV_EMAIL_OVERRIDE) {
    const originalTo = to;
    to = process.env.DEV_EMAIL_OVERRIDE;
    const tag = process.env.STAGING === "true" ? "STAGING" : "DEV";
    subject = `[${tag} → ${originalTo}] ${subject}`;
    effectiveFrom = { name: `Goshiwon ${tag}`, email: process.env.DEV_EMAIL_OVERRIDE };
  }

  const config = getSmtpConfig();

  if (!config) {
    console.log("=== EMAIL (SMTP not configured) ===");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text}`);
    console.log("=== END EMAIL ===");
    return;
  }

  try {
    if (process.env.NODE_ENV === "development") {
      console.log("[email] calling nodemailer sendMail", { to });
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.default.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.credentials.username,
          pass: config.credentials.password,
        },
      });
      const info = await transport.sendMail({
        from: effectiveFrom.name
          ? `${effectiveFrom.name} <${effectiveFrom.email}>`
          : effectiveFrom.email,
        to,
        subject,
        text,
        html,
      });
      console.log(`Email sent to ${to}: ${info.messageId}`);
    } else {
      console.log("[email] calling WorkerMailer.send", { to });
      // Force the ESM build so esbuild keeps `import ... from "cloudflare:sockets"`
      // as a static import (external). The CJS build uses require() which
      // esbuild rewrites into an ESM-incompatible dynamic-require shim.
      const { WorkerMailer } = await import("worker-mailer/dist/index.mjs");
      await WorkerMailer.send(config, {
        from: effectiveFrom,
        to,
        subject,
        text,
        html,
      });
      console.log(`Email sent to ${to}`);
    }
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
}
