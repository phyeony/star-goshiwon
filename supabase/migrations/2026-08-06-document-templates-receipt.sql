-- Adds the 숙박료 영수증 (accommodation payment receipt) to the document
-- template slots.
--
-- Immigration wants a three-part bundle from a 고시원: the 확인서/입실계약서,
-- a 사업자등록증 사본, and a recent 월세 영수증 or 계좌이체 내역. Guests here
-- pay in USD through PayPal, so no Korean bank record naming this business
-- will ever exist — a receipt issued by the business is the accepted
-- substitute, and the admin needs to be able to re-word it like the others.
--
-- The 영문병기 (bilingual) variant is composed in code from the ko and en
-- documents, so the lang CHECK deliberately stays ('ko', 'en'): there is no
-- template body to store for it.

ALTER TABLE document_templates
  DROP CONSTRAINT IF EXISTS document_templates_type_check;

ALTER TABLE document_templates
  ADD CONSTRAINT document_templates_type_check
  CHECK (type IN ('letter', 'contract', 'receipt'));
