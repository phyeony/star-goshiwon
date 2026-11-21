-- Manager feedback on an AI turn, next to the good/bad rating: what was wrong,
-- and optionally what the reply should have said. Read back when improving
-- the agent and turned into eval cases.
ALTER TABLE whatsapp_agent_runs
  ADD COLUMN IF NOT EXISTS manager_note TEXT,
  ADD COLUMN IF NOT EXISTS manager_better_reply TEXT,
  ADD COLUMN IF NOT EXISTS manager_noted_at TIMESTAMPTZ;
