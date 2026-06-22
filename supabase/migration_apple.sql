-- Run in Neon SQL Editor
ALTER TABLE cycling_sessions
  ADD COLUMN IF NOT EXISTS apple_health_uuid text UNIQUE,
  ADD COLUMN IF NOT EXISTS sync_source text DEFAULT 'manual';
