import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getPlanForDate, calcEFScore, rideGoalMet } from '@/lib/plan'
import { RideType } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { date, km, duration_minutes, avg_hr, type, kcal_burned, notes } = body

    if (!date || !km || !duration_minutes || !type) {
      return NextResponse.json({ error: 'date, km, duration_minutes, type required' }, { status: 400 })
    }

    const plan = getPlanForDate(date)
    const ef_score = avg_hr ? calcEFScore(Number(km), Number(duration_minutes), Number(avg_hr)) : null
    const goalResult = rideGoalMet(
      Number(duration_minutes),
      plan.duration_min,
      type as RideType,
      plan.type,
    )

    await sql`
      INSERT INTO cycling_sessions
        (date, km, duration_minutes, avg_hr, ef_score, type, kcal_burned, notes, planned_type, planned_duration_minutes)
      VALUES
        (${date}, ${km}, ${duration_minutes}, ${avg_hr ?? null}, ${ef_score},
         ${type}, ${kcal_burned ?? null}, ${notes ?? null}, ${plan.type}, ${plan.duration_min})
    `

    return NextResponse.json({ ok: true, ef_score, goal: goalResult, plan })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })
  try {
    const rows = await sql`SELECT * FROM cycling_sessions WHERE date = ${date} ORDER BY created_at DESC`
    return NextResponse.json(rows)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
