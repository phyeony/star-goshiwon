import { siteConfig } from "./site-data";
import { formatUSD, formatApproxKRW } from "./pricing";

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
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
  <div style="background-color: #ffffff; padding: 20px 24px 8px; border: 1px solid #e5e7eb; border-bottom: none; border-radius: 12px 12px 0 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="left" style="border-collapse: collapse;">
      <tr>
        <td style="color: #0b1f4d; font-weight: 700; font-size: 26px; line-height: 1; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          Star Goshiwon
        </td>
      </tr>
      <tr>
        <td style="padding-top: 0px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td width="50%" valign="middle" style="width: 50%; padding: 0;">
                <div style="border-top: 1px solid rgba(74,95,184,0.6); font-size: 0; line-height: 0; height: 1px;">&nbsp;</div>
              </td>
              <td valign="middle" align="center" style="padding: 0 6px; color: #4a5fb8; font-size: 13px; font-weight: 500; white-space: nowrap; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center;">
                Seoul Goshiwon
              </td>
              <td width="50%" valign="middle" style="width: 50%; padding: 0;">
                <div style="border-top: 1px solid rgba(74,95,184,0.6); font-size: 0; line-height: 0; height: 1px;">&nbsp;</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <div style="clear: both;"></div>
  </div>

  <div style="background-color: #ffffff; padding: 8px 24px 24px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px; margin-top: 0;">Hi ${data.guest_name},</p>
    <p style="margin-top: 16px; font-size: 16px;">Thank you for your booking request! We have received it and will review availability shortly.</p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h2 style="font-size: 16px; margin: 0 0 12px; color: #374151;">Request Summary</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 6px 0; color: #6b7280;">Room</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.room_name}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Check-in</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.check_in_date}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Check-out</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.check_out_date}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Guests</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.guest_count}</td></tr>
        ${data.bedding_prepaid ? `<tr><td style="padding: 6px 0; color: #6b7280;">Bedding set</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">$15 prepaid</td></tr>` : ""}
        <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 10px 0 6px; color: #6b7280; font-weight: 600;">Estimated Total</td><td style="padding: 10px 0 6px; text-align: right; font-weight: 700; font-size: 16px;">${formatTotal(data.estimated_total)}</td></tr>
      </table>
      ${data.notes ? `<p style="margin: 12px 0 0; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;"><strong>Your message:</strong> ${data.notes}</p>` : ""}
    </div>

    <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>Important:</strong> This is a request, not a confirmed booking. We will review availability and respond via email within ${siteConfig.responseTime}.</p>
    </div>

    <p style="font-size: 16px;">If you have any questions, reply to this email or reach us on WhatsApp.</p>

    <p style="font-size: 16px; margin-top: 24px;">
      Best regards,<br />
      <strong>Seoul Goshiwon by Star Goshiwon</strong><br />
      <span style="color: #6b7280;">${siteConfig.address}</span><br />
      <a href="mailto:${siteConfig.email}" style="color: #4f46e5;">${siteConfig.email}</a>
    </p>
  </div>

  <div style="background-color: #f9fafb; padding: 16px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">Seoul Goshiwon by Star Goshiwon &middot; Dongjak-gu, Seoul</p>
  </div>
</div>`.trim();
}

export function buildGuestConfirmationText(data: BookingEmailData) {
  return `Hi ${data.guest_name},

Thank you for your booking request at Seoul Goshiwon by Star Goshiwon!

Request Summary:
- Room: ${data.room_name}
- Check-in: ${data.check_in_date}
- Check-out: ${data.check_out_date}
- Guests: ${data.guest_count}${data.bedding_prepaid ? `\n- Bedding set: $15 prepaid` : ""}
- Estimated Total: ${formatTotal(data.estimated_total)}
${data.notes ? `- Your message: ${data.notes}` : ""}

IMPORTANT: This is a request, not a confirmed booking.
We will review availability and contact you via email within ${siteConfig.responseTime}.

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
    ${data.bedding_prepaid ? `<tr><td style="padding: 6px 0; color: #6b7280;">침구 세트</td><td style="padding: 6px 0;">$15 선결제</td></tr>` : ""}
    <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 10px 0 6px; color: #6b7280;">예상 금액</td><td style="padding: 10px 0 6px; font-weight: 700; font-size: 16px;">${formatTotal(data.estimated_total)}</td></tr>
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
인원: ${data.guest_count}명${data.bedding_prepaid ? `\n침구 세트: $15 선결제` : ""}
예상 금액: ${formatTotal(data.estimated_total)}
${data.notes ? `고객 메시지: ${data.notes}` : ""}

확인하기: ${siteConfig.url}/admin/requests`;

  await sendEmail(adminEmail, subject, text, html);
}

async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
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
        from: fromAddress.name
          ? `${fromAddress.name} <${fromAddress.email}>`
          : fromAddress.email,
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
        from: fromAddress,
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
