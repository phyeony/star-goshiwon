-- Admin-editable email templates used by the booking-request email composer.
-- The body and subject support {{variable}} substitution at send time.

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_sort_order
  ON email_templates(sort_order, created_at);

DROP TRIGGER IF EXISTS email_templates_updated_at ON email_templates;
CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed the existing four templates so admins start with a working baseline.
INSERT INTO email_templates (slug, label, description, subject, body, sort_order)
VALUES
  (
    'approved',
    'Approved — room confirmed',
    'Confirms availability and gives payment instructions.',
    'Your booking is confirmed — {{room_name}} ({{check_in_date}} → {{check_out_date}})',
    'Hi {{guest_name}},

Good news — your booking request has been approved! Here are the details we have on file:

- Room: {{room_name}}
- Check-in: {{check_in_date}}
- Check-out: {{check_out_date}}
- Guests: {{guest_count}}
- Total to prepay: {{total_usd}} (includes the {{deposit_usd}} refundable deposit)

To finalize your reservation, please complete the PayPal payment within 48 hours. Reply to this email and I will send you the PayPal payment link.

Once we confirm payment, I will send your self check-in instructions (door code, address details in Korean for the taxi, and arrival tips).

If anything in the booking details above looks wrong, just reply and I will update it before we move forward.

Best regards,
Seoul Goshiwon by Star Goshiwon
{{site_email}}
{{site_url}}',
    1
  ),
  (
    'declined',
    'Declined — not available',
    'Politely declines and suggests next steps.',
    'Update on your booking request — {{room_name}}',
    'Hi {{guest_name}},

Thank you for your interest in staying with us. Unfortunately, we are not able to accommodate your request for {{room_name}} from {{check_in_date}} to {{check_out_date}}.

If your dates are flexible, I would be happy to suggest alternative dates or a different room type. You can browse current availability here: {{site_url}}/rooms

Sorry I could not give you better news this time, and thank you again for considering us.

Best regards,
Seoul Goshiwon by Star Goshiwon
{{site_email}}
{{site_url}}',
    2
  ),
  (
    'more_info',
    'Awaiting more info',
    'Asks the guest for documents or details before approving.',
    'A few more details needed for your booking — {{room_name}}',
    'Hi {{guest_name}},

Thank you for your booking request for {{room_name}} ({{check_in_date}} → {{check_out_date}}). Before we can confirm, I need a few more details from you:

- A clear photo of your passport (photo page)
- Proof of legal stay in Korea (visa page, or visa-free entry stamp)
- Confirmation of your exact arrival date and approximate arrival time

We verify these before approving, so once you reply with the items above I can move quickly to confirm availability and send payment instructions.

If you have any questions, just reply to this email.

Best regards,
Seoul Goshiwon by Star Goshiwon
{{site_email}}
{{site_url}}',
    3
  ),
  (
    'follow_up',
    'Generic follow-up',
    'Empty draft prefilled with greeting and booking reference.',
    'Re: Your booking request — {{room_name}}',
    'Hi {{guest_name}},

Following up on your booking request for {{room_name}} ({{check_in_date}} → {{check_out_date}}).



Best regards,
Seoul Goshiwon by Star Goshiwon
{{site_email}}
{{site_url}}',
    4
  )
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE email_templates DISABLE ROW LEVEL SECURITY;