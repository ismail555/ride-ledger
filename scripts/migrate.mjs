// Run: node scripts/migrate.mjs
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
const url = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim()
if (!url) throw new Error('DATABASE_URL not found in .env.local')

const sql = neon(url)

console.log('Running migrations…')
await sql`ALTER TABLE calorie_log ADD COLUMN IF NOT EXISTS food_photo text`
await sql`ALTER TABLE calorie_log ADD COLUMN IF NOT EXISTS notes text`
await sql`ALTER TABLE cycling_sessions ADD COLUMN IF NOT EXISTS planned_type text`
await sql`ALTER TABLE cycling_sessions ADD COLUMN IF NOT EXISTS planned_duration_minutes integer`
await sql`ALTER TABLE cycling_sessions ADD COLUMN IF NOT EXISTS apple_health_uuid text UNIQUE`
await sql`ALTER TABLE cycling_sessions ADD COLUMN IF NOT EXISTS sync_source text DEFAULT 'manual'`
await sql`ALTER TABLE body_log ALTER COLUMN weight DROP NOT NULL`
console.log('✓ All migrations applied')
