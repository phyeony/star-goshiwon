import { siteConfig } from "./site-data";

interface WrapOptions {
  preheader?: string;
}

interface TextToEmailHtmlOptions {
  ctaUrl?: string;
  ctaLabel?: string;
}

const PAYMENT_REVIEW_URL_RE = /^https?:\/\/[^\s<]+\/booking-payment\/pay\?request_id=[^\s<]+$/;

export function wrapEmailHtml(bodyHtml: string, opts: WrapOptions = {}): string {
  const preheader = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#fff;opacity:0;">${escapeHtml(opts.preheader)}</div>`
    : "";

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
  ${preheader}
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
${bodyHtml}
  </div>

  <div style="background-color: #f9fafb; padding: 16px 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="margin: 0; font-size: 12px; color: #9ca3af;">${escapeHtml(siteConfig.name)} &middot; Dongjak-gu, Seoul</p>
  </div>
</div>`.trim();
}

export function textToEmailHtml(
  text: string,
  opts: TextToEmailHtmlOptions = {}
): string {
  const paragraphs = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return paragraphs
    .map((para) => {
      const trimmed = para.trim();
      const buttonUrl = getStandaloneButtonUrl(trimmed, opts.ctaUrl);
      if (buttonUrl) {
        return renderButton(buttonUrl, opts.ctaLabel ?? "Review and pay securely");
      }
      const lines = para.split("\n").map((line) => autolink(escapeHtml(line)));
      return `<p style="margin: 0 0 16px; font-size: 16px; line-height: 1.55;">${lines.join("<br />")}</p>`;
    })
    .join("\n");
}

function getStandaloneButtonUrl(text: string, ctaUrl?: string) {
  if (ctaUrl && text === ctaUrl) return ctaUrl;
  if (PAYMENT_REVIEW_URL_RE.test(text)) return text;
  return null;
}

function renderButton(url: string, label: string): string {
  return `<p style="margin: 24px 0;"><a href="${escapeHtml(url)}" style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 700;">${escapeHtml(label)}</a></p>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const URL_RE = /(https?:\/\/[^\s<]+)/g;
const EMAIL_RE = /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

function autolink(escaped: string): string {
  return escaped
    .replace(
      URL_RE,
      (m) => `<a href="${m}" style="color: #4f46e5; text-decoration: underline;">${m}</a>`
    )
    .replace(
      EMAIL_RE,
      (m) => `<a href="mailto:${m}" style="color: #4f46e5; text-decoration: underline;">${m}</a>`
    );
}
