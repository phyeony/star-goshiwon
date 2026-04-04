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

export async function sendGuestConfirmation(data: BookingEmailData) {
  const subject = "Your booking request has been received — Seoul Stay Goshiwon";
  const body = `
Hi ${data.guest_name},

Thank you for your booking request at ${siteConfig.name}!

Here is a summary of your request:

Room: ${data.room_name}
Check-in: ${data.check_in_date}
Check-out: ${data.check_out_date}
Guests: ${data.guest_count}
Estimated Total: ${formatKRW(data.estimated_total)}
${data.notes ? `\nYour message: ${data.notes}` : ""}

IMPORTANT: This is not a confirmed booking yet.
We will review availability and contact you via email within ${siteConfig.responseTime}.

If you have any questions, feel free to reply to this email or reach us on WhatsApp.

Best regards,
${siteConfig.name}
${siteConfig.email}
  `.trim();

  await sendEmail(data.guest_email, subject, body);
}

export async function sendAdminNotification(data: BookingEmailData) {
  const adminEmail = process.env.ADMIN_EMAIL || siteConfig.email;
  const subject = `New booking request from ${data.guest_name}`;
  const body = `
New booking request received:

Guest: ${data.guest_name}
Email: ${data.guest_email}
Room: ${data.room_name}
Check-in: ${data.check_in_date}
Check-out: ${data.check_out_date}
Guests: ${data.guest_count}
Estimated Total: ${formatKRW(data.estimated_total)}
${data.notes ? `\nNotes: ${data.notes}` : ""}

Review this request in the admin dashboard:
${siteConfig.url}/admin/requests
  `.trim();

  await sendEmail(adminEmail, subject, body);
}

async function sendEmail(to: string, subject: string, text: string) {
  // V1: Log email to console. Replace with SMTP/Resend/SendGrid in production.
  const smtpHost = process.env.SMTP_HOST;

  if (!smtpHost) {
    console.log("=== EMAIL (no SMTP configured) ===");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text}`);
    console.log("=== END EMAIL ===");
    return;
  }

  // Production: Use nodemailer or similar
  // This is the integration point for SMTP / Resend / SendGrid
  const response = await fetch(`https://${smtpHost}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    console.error("Failed to send email:", await response.text());
  }
}
