import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { calcEFScore, getPlanForDate } from '@/lib/plan'
import { RideType, AppleWorkout } from '@/types'

function detectRideType(w: AppleWorkout): RideType {
  const { distance_km, duration_minutes, avg_hr } = w
  if (distance_km >= 50 || duration_minutes >= 100) return 'Long ride'
  if (avg_hr && avg_hr >= 155) return 'Tempo'
  if (avg_hr && avg_hr >= 147) return 'SweetSpot'
  return 'Zone2'
}

export async function POST(req: NextRequest) {
  // Verify API key
  const key = req.headers.get('x-api-key') ?? req.nextUrl.searchParams.get('key')
  if (key !== process.env.APPLE_SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { workouts }: { workouts: AppleWorkout[] } = await req.json()
    if (!Array.isArray(workouts) || workouts.length === 0) {
      return NextResponse.json({ error: 'workouts array required' }, { status: 400 })
    }

    const results: { uuid: string; date: string; action: 'inserted' | 'updated' }[] = []

    for (const w of workouts) {
      if (!w.apple_health_uuid || !w.date || !w.duration_minutes || !w.distance_km) continue

      const type = detectRideType(w)
      const ef_score = w.avg_hr
        ? calcEFScore(w.distance_km, w.duration_minutes, w.avg_hr)
        : null
      const plan = getPlanForDate(w.date)

      const existing = await sql`
        SELECT id FROM cycling_sessions WHERE apple_health_uuid = ${w.apple_health_uuid}
      ` as any[]
      const action = existing.length > 0 ? 'updated' : 'inserted'

      await sql`
        INSERT INTO cycling_sessions
          (date, km, duration_minutes, avg_hr, ef_score, type, kcal_burned,
           apple_health_uuid, sync_source, planned_type, planned_duration_minutes, notes)
        VALUES
          (${w.date}, ${w.distance_km}, ${w.duration_minutes}, ${w.avg_hr ?? null},
           ${ef_score}, ${type}, ${w.kcal_burned ?? null},
           ${w.apple_health_uuid}, 'apple_watch', ${plan.type}, ${plan.duration_min},
           ${w.workout_type})
        ON CONFLICT (apple_health_uuid) DO UPDATE SET
          km                       = EXCLUDED.km,
          duration_minutes         = EXCLUDED.duration_minutes,
          avg_hr                   = EXCLUDED.avg_hr,
          ef_score                 = EXCLUDED.ef_score,
          type                     = EXCLUDED.type,
          kcal_burned              = EXCLUDED.kcal_burned,
          planned_type             = EXCLUDED.planned_type,
          planned_duration_minutes = EXCLUDED.planned_duration_minutes
      `
      results.push({ uuid: w.apple_health_uuid, date: w.date, action })
    }

    return NextResponse.json({ ok: true, synced: results.length, results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
