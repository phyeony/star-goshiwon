UPDATE email_templates SET
  description = 'Polite follow-up for guests who have not messaged WhatsApp after the booking request confirmation email.',
  subject = 'Re: Your booking request - {{room_name}}',
  body = 'Hi {{guest_name}},

Thank you again for sending your booking request for {{room_name}} ({{check_in_date}} - {{check_out_date}}).

I am following up because we have not received a WhatsApp message from you yet after our booking request confirmation email.

Could you please send us a message on our WhatsApp channel when you have a moment?
{{whatsapp_url}}

WhatsApp is the fastest way for us to help with availability, payment steps, arrival questions, and any other details about your stay.

If you already sent a WhatsApp message, please ignore this email and thank you for reaching out.

Best regards,
Seoul Goshiwon by Star Goshiwon
{{site_email}}
{{site_url}}'
WHERE slug = 'follow_up';
