-- Use the actual stored payment deadline in approval emails. The HTML email
-- renderer turns the standalone {{payment_url}} paragraph into a CTA button.

UPDATE email_templates SET
  body = 'Hi {{guest_name}},

Good news — your booking request has been approved! Here are the details we have on file:

- Room: {{room_name}}
- Check-in: {{check_in_date}}
- Check-out: {{check_out_date}}
- Guests: {{guest_count}}
- Total to prepay: {{total_usd}} (includes the {{deposit_usd}} refundable deposit)

To finalize your reservation, please review the booking summary and complete payment via PayPal before {{payment_deadline}}:

{{payment_url}}

This opens the booking summary on our website first, then you can continue to PayPal. PayPal may offer card checkout without a PayPal account, depending on your region.

Once we confirm payment, I will send your self check-in instructions (door code, address details in Korean for the taxi, and arrival tips).

If anything in the booking details above looks wrong, just reply and I will update it before we move forward.

Best regards,
Seoul Goshiwon by Star Goshiwon
{{site_email}}
{{site_url}}'
WHERE slug = 'approved';

UPDATE email_templates SET
  body_ko = '{{guest_name}}님 안녕하세요,

예약 요청이 승인되었습니다! 예약 내역을 안내해 드립니다.

- 객실: {{room_name}}
- 체크인: {{check_in_date}}
- 체크아웃: {{check_out_date}}
- 인원: {{guest_count}}명
- 선결제 금액: {{total_usd}} (환불 가능한 보증금 {{deposit_usd}} 포함)

예약 확정을 위해 {{payment_deadline}}까지 아래 버튼에서 예약 내역을 확인하시고 PayPal로 결제를 완료해 주세요:

{{payment_url}}

먼저 저희 웹사이트의 예약 요약 페이지가 열리고, 거기서 PayPal 결제로 이어집니다. 지역에 따라 PayPal 계정 없이 카드 결제도 가능합니다.

결제가 확인되는 대로 셀프 체크인 안내(도어락 번호, 택시 기사님께 보여드릴 한글 주소, 도착 시 안내사항)를 전달해 드리겠습니다.

위 예약 내역에 잘못된 부분이 있다면 답장 주시면 수정 후 다시 안내드리겠습니다.

감사합니다.
스타고시원
{{site_email}}
{{site_url}}'
WHERE slug = 'approved';
