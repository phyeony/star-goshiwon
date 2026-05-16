-- Additional admin email templates covering the full guest lifecycle
-- (post-payment, pre-arrival, arrival, checkout, refund, extension).
-- Body and subject use {{variable}} substitution, same as the seeded set.

INSERT INTO email_templates (slug, label, description, subject, body, sort_order)
VALUES
  (
    'check_in_instructions',
    'Check-in instructions (post-payment)',
    'Sent right after payment is confirmed. Includes self check-in details, address for taxi, and what to expect on arrival.',
    'Check-in details for your stay at Star Goshiwon — {{check_in_date}}',
    'Hi {{guest_name}},

Thanks for completing your payment — your stay from {{check_in_date}} to {{check_out_date}} at {{room_name}} is fully confirmed.

We use **self check-in**, so please save the details below before you travel.

ARRIVAL
- Address (English): 64, Manyang-ro 12ga-gil, Dongjak-gu, Seoul, Republic of Korea
- Address (Korean — show this to your taxi driver): 서울특별시 동작구 만양로12가길 64
- Nearest station: Sangdo Station (Line 7), about a 5-minute walk
- Door code: [ADMIN — FILL IN BEFORE SENDING]
- Floor / room number: [ADMIN — FILL IN BEFORE SENDING]

ON ARRIVAL
- Punch the door code at the main entrance, take the stairs / lift to your floor, and use the same code on your room door.
- Your room is ready from 3:00 PM on {{check_in_date}}. If you arrive earlier, you are welcome to leave luggage in the common area.
- The shared kitchen has free rice, kimchi and instant noodles. Coffee/tea is also stocked.
- WiFi password is posted on the fridge in the kitchen.

NEED ANYTHING?
- WhatsApp is the fastest way to reach me: {{site_url}}
- For non-urgent questions just reply to this email.

Have a safe trip — see you soon!

Best regards,
Seoul Goshiwon by Star Goshiwon
{{site_email}}',
    5
  ),
  (
    'pre_arrival_reminder',
    'Pre-arrival reminder (1–2 days before)',
    'Soft reminder a day or two before check-in. Re-sends the address and asks about arrival time.',
    'Reminder: your stay at Star Goshiwon starts on {{check_in_date}}',
    'Hi {{guest_name}},

Quick reminder that your stay at {{room_name}} starts on **{{check_in_date}}**. Looking forward to having you!

A couple of things to double-check before you travel:

- Do you have the door code and address from the check-in email I sent earlier? If not, just reply and I will resend.
- What is your expected arrival time? Knowing helps me make sure everything is ready, especially if you are arriving late at night.
- Address in Korean for your taxi driver: 서울특별시 동작구 만양로12가길 64

If anything has changed about your travel plans — flight delays, an earlier check-in, a later arrival — just let me know and I will sort it.

Safe travels!

Best regards,
Seoul Goshiwon by Star Goshiwon
{{site_email}}',
    6
  ),
  (
    'welcome_after_arrival',
    'Welcome (day-of or day-after arrival)',
    'Sent on arrival day or the day after. Checks the guest got in OK and points them at the messaging channels.',
    'Welcome to Star Goshiwon — everything OK with check-in?',
    'Hi {{guest_name}},

Welcome to Seoul! Hope your journey went smoothly and check-in was straightforward.

A few quick things:

- If anything in the room is not working (AC, WiFi, mini fridge, lights) just message me and I will get it sorted.
- The shared laundry room has a coin-free washer and dryer — use any time, just be mindful between 10 PM and 8 AM so other guests can sleep.
- Bedding sets are kept in the storage cabinet next to the kitchen; if you prepaid for one, I have already placed it on your bed.
- For anything urgent or just to say hi, WhatsApp is the fastest way: {{site_url}}

Enjoy your stay — and if you discover any great food spots near Sangdo, send recommendations my way!

Best regards,
Seoul Goshiwon by Star Goshiwon
{{site_email}}',
    7
  ),
  (
    'checkout_reminder',
    'Checkout reminder (day before)',
    'Day before checkout. Reminds the guest about cleanup expectations and how the deposit refund works.',
    'Tomorrow is checkout — quick rundown of what to expect',
    'Hi {{guest_name}},

Your stay at {{room_name}} ends tomorrow, {{check_out_date}}. Here is what to expect for a smooth checkout and a fast deposit refund.

BEFORE YOU LEAVE
- Checkout time is **11:00 AM** on {{check_out_date}}. If you need a later checkout, message me — I can usually accommodate it.
- Please take all personal belongings with you. Anything left behind we will hold for 7 days, then donate or discard.
- Bag any trash and leave it in the bin in the kitchen.
- Leave the bedding on the bed (do not strip it) — we handle laundering.
- Leave the door closed; no need to leave the key (the door uses a code).

DEPOSIT REFUND
- Within 24 hours of checkout I will inspect the room and refund your {{deposit_usd}} refundable deposit to the same PayPal account you used to pay.
- If there is any damage beyond normal wear, I will email you with photos and a fair estimate before deducting anything.

Thanks for choosing Star Goshiwon — it was a pleasure hosting you. If you have a moment, a review on Google Maps helps other travellers find us.

Safe onward travels!

Best regards,
Seoul Goshiwon by Star Goshiwon
{{site_email}}',
    8
  ),
  (
    'deposit_refunded',
    'Deposit refunded',
    'After the room is inspected and the deposit is refunded via PayPal. Asks for a review.',
    'Your {{deposit_usd}} deposit has been refunded — thank you for staying!',
    'Hi {{guest_name}},

Thanks again for staying with us. I have just refunded your {{deposit_usd}} deposit to the PayPal account you used to pay — it usually shows up in 1–3 business days depending on PayPal.

If you noticed anything during your stay that we could improve, I would genuinely love to hear it — just reply to this email.

And if you would be willing to leave a short review on Google Maps, it makes a real difference for other travellers trying to find a foreigner-friendly place in Seoul:
{{site_url}}

If you find yourself back in Seoul, message me directly and I will sort out your next stay — repeat guests skip the request form.

Safe travels!

Best regards,
Seoul Goshiwon by Star Goshiwon
{{site_email}}',
    9
  ),
  (
    'extension_offer',
    'Extension offer (mid-stay)',
    'Mid-stay nudge offering to extend the booking. Useful when their room is available beyond their current checkout.',
    'Want to extend your stay at Star Goshiwon?',
    'Hi {{guest_name}},

You are currently booked through {{check_out_date}} at {{room_name}}. Just wanted to flag that your room is still available beyond that date if you want to extend.

A couple of things worth knowing if you do:

- If your total stay reaches 4 weeks or longer, the 15% long-stay discount kicks in automatically and applies to the whole stay, not just the extension.
- I can apply the extension at the same nightly/weekly rate you are on now — no markup for adding days.
- Easiest way to extend is just to reply to this email with the new checkout date you want; I will send a payment link for the additional nights.

No pressure either way — happy to keep your existing checkout on {{check_out_date}} if you are heading off as planned. Let me know either way so I can update the calendar.

Best regards,
Seoul Goshiwon by Star Goshiwon
{{site_email}}',
    10
  )
ON CONFLICT (slug) DO NOTHING;
