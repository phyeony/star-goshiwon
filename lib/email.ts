import nodemailer from "nodemailer";
import { siteConfig } from "./site-data";
import { formatKRW } from "./pricing";

interface BookingEmailData {
  guest_name: string;
  guest_email: string;
  room_name: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  estimated_total: number;
  notes: string;
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "465");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const fromAddress =
  process.env.FROM_EMAIL || `Stargoshiwon <${siteConfig.email}>`;
const adminEmail =
  process.env.ADMIN_EMAIL || "stargoshiwon.seoul@gmail.com";

export async function sendGuestConfirmation(data: BookingEmailData) {
  const subject =
    "Your booking request has been received — Stargoshiwon";

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
  <div style="background-color: #4f46e5; padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 22px;">Stargoshiwon</h1>
    <p style="color: #c7d2fe; margin: 4px 0 0; font-size: 14px;">Your Comfortable Basecamp in Seoul</p>
  </div>

  <div style="background-color: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px;">Hi ${data.guest_name},</p>
    <p>Thank you for your booking request! We have received it and will review availability shortly.</p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h2 style="font-size: 16px; margin: 0 0 12px; color: #374151;">Request Summary</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 6px 0; color: #6b7280;">Room</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.room_name}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Check-in</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.check_in_date}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Check-out</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.check_out_date}</td></tr>
        <tr><td style="padding: 6px 0; color: #6b7280;">Guests</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${data.guest_count}</td></tr>
        <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 10px 0 6px; color: #6b7280; font-weight: 600;">Estimated Total</td><td style="padding: 10px 0 6px; text-align: right; font-weight: 700; font-size: 16px;">${formatKRW(data.estimated_total)}</td></tr>
      </table>
      ${data.notes ? `<p style="margin: 12px 0 0; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;"><strong>Your message:</strong> ${data.notes}</p>` : ""}
    </div>

    <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e;"><strong>Important:</strong> This is a request, not a confirmed booking. We will review availability and respond via email within ${siteConfig.responseTime}.</p>
    </div>

    <p style="font-size: 14px;">If you have any questions, reply to this email or reach us on WhatsApp.</p>

    <p style="font-size: 14px; margin-top: 24px;">
      Best regards,<br />
      <strong>Stargoshiwon</strong><br />
      <span style="color: #6b7280;">${siteConfig.address}</span><br />
      <a href="mailto:${siteConfig.email}" style="color: #4f46e5;">${siteConfig.email}</a>
    </p>
  </div>

  <div style="background-color: #f9fafb; padding: 16px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">Stargoshiwon &middot; Dongjak-gu, Seoul</p>
  </div>
</div>`.trim();

  const text = `Hi ${data.guest_name},

Thank you for your booking request at Stargoshiwon!

Request Summary:
- Room: ${data.room_name}
- Check-in: ${data.check_in_date}
- Check-out: ${data.check_out_date}
- Guests: ${data.guest_count}
- Estimated Total: ${formatKRW(data.estimated_total)}
${data.notes ? `- Your message: ${data.notes}` : ""}

IMPORTANT: This is a request, not a confirmed booking.
We will review availability and contact you via email within ${siteConfig.responseTime}.

If you have any questions, reply to this email or reach us on WhatsApp.

Best regards,
Stargoshiwon
${siteConfig.email}`;

  await sendEmail(data.guest_email, subject, text, html);
}

export async function sendAdminNotification(data: BookingEmailData) {
  const subject = `New booking request from ${data.guest_name}`;

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; color: #1f2937;">
  <h2 style="margin: 0 0 16px;">New Booking Request</h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    <tr><td style="padding: 6px 0; color: #6b7280;">Guest</td><td style="padding: 6px 0; font-weight: 600;">${data.guest_name}</td></tr>
    <tr><td style="padding: 6px 0; color: #6b7280;">Email</td><td style="padding: 6px 0;"><a href="mailto:${data.guest_email}">${data.guest_email}</a></td></tr>
    <tr><td style="padding: 6px 0; color: #6b7280;">Room</td><td style="padding: 6px 0; font-weight: 600;">${data.room_name}</td></tr>
    <tr><td style="padding: 6px 0; color: #6b7280;">Check-in</td><td style="padding: 6px 0;">${data.check_in_date}</td></tr>
    <tr><td style="padding: 6px 0; color: #6b7280;">Check-out</td><td style="padding: 6px 0;">${data.check_out_date}</td></tr>
    <tr><td style="padding: 6px 0; color: #6b7280;">Guests</td><td style="padding: 6px 0;">${data.guest_count}</td></tr>
    <tr style="border-top: 1px solid #e5e7eb;"><td style="padding: 10px 0 6px; color: #6b7280;">Estimated Total</td><td style="padding: 10px 0 6px; font-weight: 700; font-size: 16px;">${formatKRW(data.estimated_total)}</td></tr>
  </table>
  ${data.notes ? `<p style="margin: 16px 0 0; padding: 12px; background: #f9fafb; border-radius: 8px; font-size: 14px;"><strong>Notes:</strong> ${data.notes}</p>` : ""}
  <p style="margin-top: 20px;"><a href="${siteConfig.url}/admin/requests" style="display: inline-block; background: #4f46e5; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">Review in Dashboard</a></p>
</div>`.trim();

  const text = `New booking request received:

Guest: ${data.guest_name}
Email: ${data.guest_email}
Room: ${data.room_name}
Check-in: ${data.check_in_date}
Check-out: ${data.check_out_date}
Guests: ${data.guest_count}
Estimated Total: ${formatKRW(data.estimated_total)}
${data.notes ? `Notes: ${data.notes}` : ""}

Review: ${siteConfig.url}/admin/requests`;

  await sendEmail(adminEmail, subject, text, html);
}

async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
) {
  const transport = createTransport();

  if (!transport) {
    console.log("=== EMAIL (SMTP not configured) ===");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text}`);
    console.log("=== END EMAIL ===");
    return;
  }

  try {
    const info = await transport.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });
    console.log(`Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
}
