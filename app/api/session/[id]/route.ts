import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { calcEFScore } from '@/lib/plan'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const { km, duration_minutes, avg_hr, type, kcal_burned, notes, date } = body

    const ef_score = avg_hr && km && duration_minutes
      ? calcEFScore(Number(km), Number(duration_minutes), Number(avg_hr))
      : null

    await sql`
      UPDATE cycling_sessions SET
        km                = ${Number(km)},
        duration_minutes  = ${Number(duration_minutes)},
        avg_hr            = ${avg_hr ? Number(avg_hr) : null},
        ef_score          = ${ef_score},
        type              = ${type},
        kcal_burned       = ${kcal_burned ? Number(kcal_burned) : null},
        notes             = ${notes ?? null},
        date              = ${date ?? null}
      WHERE id = ${id}
    `
    return NextResponse.json({ ok: true, ef_score })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await sql`DELETE FROM cycling_sessions WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
