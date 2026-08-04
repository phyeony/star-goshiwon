-- Admin-editable templates for the guest residence documents (체류 확인서 /
-- 숙소 이용 계약서). A row overrides the built-in code-generated document for
-- its (type, lang) pair; with no row the built-in document renders, so a
-- missing or deleted template is always a safe state.
--
-- body_html holds the document body with {{token}} placeholders, sanitized at
-- save time. Uploaded .docx files are converted to HTML on upload and the
-- binary is discarded — no blob storage is involved.
--
-- NOTE: this table stores *templates* only. Filled-in documents and guest
-- legal data (passport number, DOB, home address) are never persisted.

CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('letter', 'contract')),
  lang TEXT NOT NULL CHECK (lang IN ('ko', 'en')),
  title TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  -- Provenance only, e.g. "계약서_2026.docx". The file itself is not stored.
  source_filename TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by_email TEXT NOT NULL DEFAULT '',
  -- One template per document type per language; the admin UI upserts on this.
  UNIQUE (type, lang)
);

-- All app access goes through the service-role client, which bypasses RLS.
-- Enabling RLS with no policies blocks any anon/authenticated direct access.
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
