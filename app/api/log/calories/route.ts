import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getPlanForDate } from '@/lib/plan'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { date, calories, protein, carbs, fat, food_photo, notes } = body

    if (!date || !calories) {
      return NextResponse.json({ error: 'date and calories required' }, { status: 400 })
    }

    const plan = getPlanForDate(date)
    const tdee_target = plan.tdee

    await sql`
      INSERT INTO calorie_log (date, calories, protein, carbs, fat, tdee_target, food_photo, notes)
      VALUES (${date}, ${calories}, ${protein ?? 0}, ${carbs ?? 0}, ${fat ?? 0},
              ${tdee_target}, ${food_photo ?? null}, ${notes ?? null})
      ON CONFLICT (date) DO UPDATE SET
        calories    = EXCLUDED.calories,
        protein     = EXCLUDED.protein,
        carbs       = EXCLUDED.carbs,
        fat         = EXCLUDED.fat,
        tdee_target = EXCLUDED.tdee_target,
        food_photo  = EXCLUDED.food_photo,
        notes       = EXCLUDED.notes
    `

    const deficit = tdee_target - Number(calories)
    return NextResponse.json({ ok: true, tdee_target, deficit })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })
  try {
    const rows = await sql`SELECT * FROM calorie_log WHERE date = ${date} LIMIT 1` as any[]
    return NextResponse.json(rows[0] ?? null)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
