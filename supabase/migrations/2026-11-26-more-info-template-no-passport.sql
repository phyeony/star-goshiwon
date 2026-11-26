-- The "Awaiting more info" email template asked guests to send a passport
-- photo by email. Passport photos now go only through the booking
-- verification link (lib/passport), so the line points there instead.
-- Edits only that line, so any other wording the manager changed stays.
-- Visa proof was also dropped from the policy on 2026-11-24.

UPDATE email_templates SET body = replace(
  replace(body,
    '- A clear photo of your passport (photo page)',
    '- Your booking verification, through the secure link in your booking confirmation email (please don''t send passport photos by email)'),
  E'- Proof of legal stay in Korea (visa page, or visa-free entry stamp)\n', '')
WHERE slug = 'more_info';

UPDATE email_templates SET body_ko = replace(
  replace(body_ko,
    '- 여권 사진면의 선명한 사진',
    '- 예약 확인 이메일의 보안 링크로 예약 인증 (여권 사진은 이메일로 보내지 마세요)'),
  E'- 한국 체류 자격 증명 (비자 페이지 또는 무비자 입국 도장)\n', '')
WHERE slug = 'more_info';
