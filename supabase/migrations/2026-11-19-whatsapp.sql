-- WhatsApp auto-reply agent (plan/whatsapp-agent.md §2.5).
--
-- whatsapp_conversations: one row per guest phone number.
-- whatsapp_messages: every message in or out, deduplicated by Meta's id.
--   Guest messages wait with handled_at NULL until an agent run picks them up.
-- whatsapp_agent_runs: one row per agent turn: what the model understood, the
--   draft, what code decided and what was sent. The admin page shows these,
--   and the manager rates them good / bad.
-- whatsapp_settings: a single row. mode 'off' until the eval passes; the
--   agent does nothing while it is off.

ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_booking_requests_whatsapp_number
  ON booking_requests (whatsapp_number) WHERE whatsapp_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Digits only, as Meta sends it (e.g. 821012345678).
  wa_phone TEXT NOT NULL UNIQUE,
  profile_name TEXT NOT NULL DEFAULT '',
  booking_request_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL,
  match_source TEXT CHECK (match_source IN ('phone', 'manager')),
  men_only_state TEXT NOT NULL DEFAULT 'unasked'
    CHECK (men_only_state IN ('unasked', 'asked', 'confirmed', 'not_eligible')),
  bot_state TEXT NOT NULL DEFAULT 'active'
    CHECK (bot_state IN ('active', 'paused_by_manager', 'off')),
  -- A manager reply from the WhatsApp app pauses the agent until this time.
  paused_until TIMESTAMPTZ,
  -- Last time the "manager will reply in the morning" line was sent.
  after_hours_notice_at TIMESTAMPTZ,
  -- An agent run holds the conversation until this time, so two queue
  -- deliveries never answer the same messages twice.
  processing_until TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_last_message
  ON whatsapp_conversations (last_message_at DESC);

CREATE TABLE IF NOT EXISTS whatsapp_agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  -- send | send_check_only | send_decline | send_document_pending | draft | skip
  outcome TEXT NOT NULL,
  reasons TEXT[] NOT NULL DEFAULT '{}',
  understanding JSONB,
  draft TEXT NOT NULL DEFAULT '',
  outgoing TEXT,
  guard_problems TEXT[] NOT NULL DEFAULT '{}',
  after_hours_notice BOOLEAN NOT NULL DEFAULT false,
  send_error TEXT,
  error TEXT,
  model TEXT NOT NULL DEFAULT '',
  input_tokens INTEGER NOT NULL DEFAULT 0,
  cached_input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  manager_rating TEXT CHECK (manager_rating IN ('good', 'bad')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_agent_runs_conversation
  ON whatsapp_agent_runs (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_agent_runs_created
  ON whatsapp_agent_runs (created_at DESC);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  wa_message_id TEXT UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  sender TEXT NOT NULL CHECK (sender IN ('guest', 'bot', 'manager')),
  -- text | image | audio | video | document | location | sticker | contacts | …
  message_type TEXT NOT NULL DEFAULT 'text',
  -- Media is never downloaded; only its caption (if any) is kept.
  body TEXT NOT NULL DEFAULT '',
  -- Guest messages: set when an agent run (or mode off) has dealt with them.
  handled_at TIMESTAMPTZ,
  run_id UUID REFERENCES whatsapp_agent_runs(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation
  ON whatsapp_messages (conversation_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_pending
  ON whatsapp_messages (conversation_id) WHERE handled_at IS NULL AND sender = 'guest';

CREATE TABLE IF NOT EXISTS whatsapp_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  mode TEXT NOT NULL DEFAULT 'off' CHECK (mode IN ('off', 'shadow', 'live')),
  -- Per-category switch; a missing or false category is always handed off.
  auto_send JSONB NOT NULL DEFAULT '{
    "pricing": true, "location": true, "rules": true, "booking_how_to": true,
    "availability": true, "men_only": true, "short_stay": true, "smalltalk": true,
    "residence_document": true
  }'::jsonb,
  llm_provider TEXT NOT NULL DEFAULT 'openai',
  llm_model TEXT NOT NULL DEFAULT 'gpt-6-luna',
  llm_effort TEXT CHECK (llm_effort IN ('none', 'minimal', 'low', 'medium', 'high')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO whatsapp_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Server code uses the service role; no client reads these tables directly.
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;
