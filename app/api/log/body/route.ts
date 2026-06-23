import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { date, waist_inches, weight_kg } = await req.json()
    if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

    // DB stores waist in cm; convert from inches input
    const waist_cm = waist_inches != null ? Math.round(waist_inches * 2.54 * 10) / 10 : null

    await sql`
      INSERT INTO body_log (date, waist, weight)
      VALUES (${date}, ${waist_cm}, ${weight_kg ?? null})
      ON CONFLICT (date) DO UPDATE SET
        waist  = COALESCE(EXCLUDED.waist,  body_log.waist),
        weight = COALESCE(EXCLUDED.weight, body_log.weight)
    `
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })
  try {
    const rows = await sql`SELECT * FROM body_log WHERE date = ${date} LIMIT 1` as any[]
    if (!rows[0]) return NextResponse.json(null)
    const row = rows[0]
    // Convert waist cm → inches for the form
    return NextResponse.json({
      ...row,
      waist: row.waist != null ? Math.round((Number(row.waist) / 2.54) * 10) / 10 : null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
