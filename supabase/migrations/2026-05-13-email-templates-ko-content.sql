-- Adds Korean (한국어) versions for all 10 seeded email templates.
-- The ALTER TABLE statements are idempotent (IF NOT EXISTS) so this file
-- can be run on a project where the previous -ko.sql migration has or
-- hasn't been applied.

ALTER TABLE email_templates
  ADD COLUMN IF NOT EXISTS subject_ko TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS body_ko TEXT NOT NULL DEFAULT '';

UPDATE email_templates SET
  subject_ko = '예약이 확정되었습니다 — {{room_name}} ({{check_in_date}} → {{check_out_date}})',
  body_ko = '{{guest_name}}님 안녕하세요,

예약 요청이 승인되었습니다! 예약 내역을 안내해 드립니다.

- 객실: {{room_name}}
- 체크인: {{check_in_date}}
- 체크아웃: {{check_out_date}}
- 인원: {{guest_count}}명
- 선결제 금액: {{total_usd}} (환불 가능한 보증금 {{deposit_usd}} 포함)

48시간 이내에 PayPal 결제를 완료해 주셔야 예약이 최종 확정됩니다. 본 이메일에 답장 주시면 PayPal 결제 링크를 보내드리겠습니다.

결제가 확인되는 대로 셀프 체크인 안내(도어락 번호, 택시 기사님께 보여드릴 한글 주소, 도착 시 안내사항)를 전달해 드리겠습니다.

위 예약 내역에 잘못된 부분이 있다면 답장 주시면 수정 후 다시 안내드리겠습니다.

감사합니다.
스타고시원
{{site_email}}
{{site_url}}'
WHERE slug = 'approved';

UPDATE email_templates SET
  subject_ko = '예약 요청에 대한 안내 — {{room_name}}',
  body_ko = '{{guest_name}}님 안녕하세요,

저희 게스트하우스에 관심을 가져 주셔서 감사합니다. 안타깝게도 {{check_in_date}}부터 {{check_out_date}}까지의 {{room_name}} 예약은 어려울 것 같습니다.

일정 조정이 가능하시다면 다른 날짜나 다른 객실 타입을 추천해 드릴 수 있습니다. 현재 예약 가능한 객실은 아래에서 확인하실 수 있습니다: {{site_url}}/rooms

이번에는 좋은 소식을 드리지 못해 죄송하며, 저희를 고려해 주셔서 다시 한 번 감사드립니다.

감사합니다.
스타고시원
{{site_email}}
{{site_url}}'
WHERE slug = 'declined';

UPDATE email_templates SET
  subject_ko = '예약 확정을 위한 추가 정보 요청 — {{room_name}}',
  body_ko = '{{guest_name}}님 안녕하세요,

{{room_name}} ({{check_in_date}} → {{check_out_date}}) 예약 요청을 보내 주셔서 감사합니다. 예약 확정 전에 몇 가지 추가 정보가 필요합니다.

- 여권 사진면의 선명한 사진
- 한국 체류 자격 증명 (비자 페이지 또는 무비자 입국 도장)
- 정확한 도착 날짜와 예상 도착 시간

위 서류는 예약 승인 전에 미리 확인하고 있으니, 답장 주시면 빠르게 가용 여부를 확인하고 결제 안내를 드리겠습니다.

문의 사항이 있으시면 답장 주세요.

감사합니다.
스타고시원
{{site_email}}
{{site_url}}'
WHERE slug = 'more_info';

UPDATE email_templates SET
  subject_ko = '회신: 예약 요청 관련 — {{room_name}}',
  body_ko = '{{guest_name}}님 안녕하세요,

{{room_name}} ({{check_in_date}} → {{check_out_date}}) 예약 요청과 관련하여 후속 안내드립니다.



감사합니다.
스타고시원
{{site_email}}
{{site_url}}'
WHERE slug = 'follow_up';

UPDATE email_templates SET
  subject_ko = '스타고시원 체크인 안내 — {{check_in_date}}',
  body_ko = '{{guest_name}}님 안녕하세요,

결제가 완료되어 {{check_in_date}}부터 {{check_out_date}}까지 {{room_name}} 예약이 최종 확정되었습니다.

저희는 셀프 체크인 시스템을 운영하므로, 출발 전 아래 내용을 꼭 저장해 두세요.

도착 안내
- 영문 주소: 64, Manyang-ro 12ga-gil, Dongjak-gu, Seoul, Republic of Korea
- 한글 주소 (택시 기사님께 보여주세요): 서울특별시 동작구 만양로12가길 64
- 가장 가까운 지하철역: 상도역 (7호선), 도보 약 5분
- 도어락 번호: [관리자 — 발송 전 입력]
- 호수: [관리자 — 발송 전 입력]

도착 후 안내
- 건물 입구에 도어락 번호를 입력하고 계단 또는 엘리베이터로 해당 층까지 이동하신 후, 객실 문에도 동일한 번호를 입력하세요.
- 객실은 {{check_in_date}} 오후 3:00부터 입실 가능합니다. 일찍 도착하시면 공용 공간에 짐을 두실 수 있습니다.
- 공용 주방에는 무료로 사용하실 수 있는 쌀, 김치, 라면이 준비되어 있고, 커피와 차도 비치되어 있습니다.
- 와이파이 비밀번호는 주방 냉장고에 부착되어 있습니다.

문의가 필요하시면
- WhatsApp으로 가장 빠르게 연락하실 수 있습니다: {{site_url}}
- 급하지 않은 문의는 본 이메일에 답장 주세요.

안전한 여행 되시고, 곧 뵙겠습니다!

감사합니다.
스타고시원
{{site_email}}'
WHERE slug = 'check_in_instructions';

UPDATE email_templates SET
  subject_ko = '안내: {{check_in_date}} 스타고시원 체크인 예정',
  body_ko = '{{guest_name}}님 안녕하세요,

{{room_name}} 예약이 {{check_in_date}}에 시작될 예정이라 다시 한 번 안내드립니다. 곧 뵙기를 기대하고 있습니다!

출발 전 몇 가지 확인 부탁드립니다:

- 이전에 보내드린 체크인 안내 메일에서 도어락 번호와 주소를 확인하셨나요? 다시 받으셔야 하면 답장 주세요.
- 예상 도착 시간을 알려 주시면 준비에 도움이 됩니다. 특히 늦은 밤 도착 예정이시면 미리 알려 주세요.
- 택시 기사님께 보여드릴 한글 주소: 서울특별시 동작구 만양로12가길 64

여행 계획이 변경되었거나 (항공편 지연, 도착 시간 변경 등) 일정 변경이 필요하시면 언제든 연락 주세요.

안전한 여행 되세요!

감사합니다.
스타고시원
{{site_email}}'
WHERE slug = 'pre_arrival_reminder';

UPDATE email_templates SET
  subject_ko = '스타고시원에 오신 것을 환영합니다 — 체크인은 잘 하셨나요?',
  body_ko = '{{guest_name}}님 안녕하세요,

서울에 오신 것을 환영합니다! 여행은 편안하셨고 체크인도 무사히 마치셨기를 바랍니다.

몇 가지 안내드립니다:

- 객실에 문제가 있으시면 (에어컨, 와이파이, 미니 냉장고, 조명 등) 메시지 주시면 바로 조치해 드리겠습니다.
- 공용 세탁실의 세탁기와 건조기는 동전 없이 사용 가능하며, 다른 게스트의 휴식을 위해 오후 10시부터 오전 8시 사이에는 사용을 자제해 주세요.
- 침구 세트는 주방 옆 보관함에 비치되어 있으며, 미리 결제하신 경우 이미 침대에 준비해 두었습니다.
- 급한 문의나 인사는 WhatsApp으로 가장 빠르게 연락 주실 수 있습니다: {{site_url}}

즐거운 체류 되시고, 상도 근처 좋은 맛집을 발견하시면 추천해 주세요!

감사합니다.
스타고시원
{{site_email}}'
WHERE slug = 'welcome_after_arrival';

UPDATE email_templates SET
  subject_ko = '내일 체크아웃 안내 — 절차 안내드립니다',
  body_ko = '{{guest_name}}님 안녕하세요,

내일 {{check_out_date}}에 {{room_name}} 체크아웃 예정이십니다. 원활한 체크아웃과 빠른 보증금 환불을 위해 아래 내용을 안내드립니다.

체크아웃 전 안내
- 체크아웃 시간은 {{check_out_date}} 오전 11:00입니다. 늦은 체크아웃이 필요하시면 메시지 주세요. 대부분 조정 가능합니다.
- 모든 개인 물품을 챙겨가 주세요. 두고 가신 물품은 7일간 보관 후 기부 또는 폐기됩니다.
- 쓰레기는 봉투에 담아 주방 쓰레기통에 버려 주세요.
- 침구는 침대 위에 그대로 두시면 됩니다 (시트 분리 불필요) — 저희가 세탁 처리합니다.
- 객실 문은 닫고 나가시면 됩니다. 도어락이라 열쇠는 따로 두실 필요 없습니다.

보증금 환불
- 체크아웃 후 24시간 이내에 객실을 점검하고 결제하셨던 PayPal 계정으로 {{deposit_usd}}의 환불 가능한 보증금을 송금해 드립니다.
- 일반적인 사용 범위를 넘는 손상이 있는 경우, 사진과 합리적인 견적을 먼저 메일로 알려드린 후 차감 여부를 안내해 드립니다.

스타고시원을 이용해 주셔서 감사합니다. 잠시 시간을 내어 Google 지도에 후기를 남겨 주시면 다른 여행자분들께 큰 도움이 됩니다.

안전한 다음 여정 되세요!

감사합니다.
스타고시원
{{site_email}}'
WHERE slug = 'checkout_reminder';

UPDATE email_templates SET
  subject_ko = '{{deposit_usd}} 보증금이 환불되었습니다 — 이용해 주셔서 감사합니다!',
  body_ko = '{{guest_name}}님 안녕하세요,

저희 시설을 이용해 주셔서 다시 한 번 감사드립니다. 결제하셨던 PayPal 계정으로 {{deposit_usd}}의 보증금을 환불해 드렸습니다. PayPal 정책에 따라 보통 1~3 영업일 이내에 반영됩니다.

체류 중 개선이 필요하다고 느끼신 점이 있으시면 답장으로 자유롭게 알려 주세요. 진심으로 듣고 싶습니다.

또한 Google 지도에 짧은 후기를 남겨 주시면, 외국인 친화적인 서울 숙소를 찾는 다른 여행자분들께 큰 도움이 됩니다:
{{site_url}}

다시 서울을 방문하실 때는 메시지로 직접 연락 주세요. 재방문 게스트는 예약 요청 폼 없이 바로 예약하실 수 있습니다.

안전한 여행 되세요!

감사합니다.
스타고시원
{{site_email}}'
WHERE slug = 'deposit_refunded';

UPDATE email_templates SET
  subject_ko = '스타고시원 숙박 연장을 원하시나요?',
  body_ko = '{{guest_name}}님 안녕하세요,

현재 {{room_name}}에 {{check_out_date}}까지 예약되어 있으신데, 해당 객실이 그 이후에도 예약 가능한 상태라 안내드립니다. 숙박 연장을 원하시면 도와드릴 수 있습니다.

연장 시 알아두실 점:

- 총 숙박 기간이 4주 이상이 되면 자동으로 15% 장기 숙박 할인이 전체 숙박에 적용됩니다 (연장분뿐만 아니라).
- 현재 적용 중인 일/주 단위 요금과 동일한 요율로 연장이 가능합니다. 연장에 따른 추가 마진은 없습니다.
- 연장은 본 이메일에 새로운 체크아웃 날짜를 회신해 주시는 것이 가장 간단합니다. 추가 일수에 대한 결제 링크를 보내드리겠습니다.

부담 없이 답장 주세요. 기존 일정대로 {{check_out_date}}에 체크아웃하셔도 좋습니다. 어느 쪽이든 일정 관리를 위해 알려 주시면 감사하겠습니다.

감사합니다.
스타고시원
{{site_email}}'
WHERE slug = 'extension_offer';
