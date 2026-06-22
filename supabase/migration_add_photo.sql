-- Run this in Neon SQL Editor
ALTER TABLE calorie_log ADD COLUMN IF NOT EXISTS food_photo text;
ALTER TABLE calorie_log ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE cycling_sessions ADD COLUMN IF NOT EXISTS planned_type text;
ALTER TABLE cycling_sessions ADD COLUMN IF NOT EXISTS planned_duration_minutes integer;
