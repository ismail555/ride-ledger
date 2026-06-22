import { NextRequest, NextResponse } from 'next/server'
import { getWeekData } from '@/lib/data'

export async function GET(req: NextRequest) {
  const offset = Number(req.nextUrl.searchParams.get('offset') ?? '0')
  try {
    const data = await getWeekData(offset)
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
