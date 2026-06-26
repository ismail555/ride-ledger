import { sql } from './db'
import { startOfWeek, endOfWeek, format, eachDayOfInterval } from 'date-fns'
import { CyclingSession, CalorieLog, BodyLog, DayMetrics } from '@/types'

export async function getWeekData(weekOffset = 0) {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  weekStart.setDate(weekStart.getDate() + weekOffset * 7)
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

  const startStr = format(weekStart, 'yyyy-MM-dd')
  const endStr = format(weekEnd, 'yyyy-MM-dd')

  const [sessionsRaw, caloriesRaw, bodyRaw] = await Promise.all([
    sql`SELECT * FROM cycling_sessions WHERE date >= ${startStr} AND date <= ${endStr} ORDER BY date ASC`,
    sql`SELECT * FROM calorie_log WHERE date >= ${startStr} AND date <= ${endStr} ORDER BY date ASC`,
    sql`SELECT * FROM body_log WHERE date >= ${startStr} AND date <= ${endStr} ORDER BY date ASC`,
  ])

  // Neon returns numeric/integer columns as strings — coerce to JS numbers
  const sessions: CyclingSession[] = (sessionsRaw as any[]).map(r => ({
    ...r,
    km: Number(r.km),
    duration_minutes: Number(r.duration_minutes),
    avg_hr: r.avg_hr != null ? Number(r.avg_hr) : null,
    ef_score: r.ef_score != null ? Number(r.ef_score) : null,
    kcal_burned: r.kcal_burned != null ? Number(r.kcal_burned) : null,
  }))

  const calories: CalorieLog[] = (caloriesRaw as any[]).map(r => ({
    ...r,
    calories: Number(r.calories),
    protein: Number(r.protein),
    carbs: Number(r.carbs),
    fat: Number(r.fat),
    tdee_target: Number(r.tdee_target),
  }))

  const bodyLogs: BodyLog[] = (bodyRaw as any[]).map(r => ({
    ...r,
    weight: Number(r.weight),
    // DB stores waist in cm; convert to inches for display (1 in = 2.54 cm)
    waist: r.waist != null ? Math.round((Number(r.waist) / 2.54) * 10) / 10 : null,
  }))

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const toLocalDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })

  const sessionsByDate = new Map(sessions.map(s => [toLocalDate(s.date), s]))
  const caloriesByDate = new Map(calories.map(c => [toLocalDate(c.date), c]))
  const bodyByDate = new Map(bodyLogs.map(b => [toLocalDate(b.date), b]))

  const dailyMetrics: DayMetrics[] = days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const session = sessionsByDate.get(dateStr)
    const calLog = caloriesByDate.get(dateStr)
    const body = bodyByDate.get(dateStr)

    const tdee = calLog?.tdee_target ?? null
    const consumed = calLog?.calories ?? null
    const deficit = tdee !== null && consumed !== null ? tdee - consumed : null

    return {
      date: dateStr,
      label: format(day, 'EEE'),
      deficit,
      ef_score: session?.ef_score ?? null,
      kcal_burned: session?.kcal_burned ?? null,
      calories_in: consumed,
      tdee_target: tdee,
      weight: body?.weight ?? null,
    }
  })

  const totalKm = sessions.reduce((s, r) => s + Number(r.km), 0)
  const totalKcal = sessions.reduce((s, r) => s + (r.kcal_burned ?? 0), 0)
  const validDeficits = dailyMetrics.filter(d => d.deficit !== null)
  const avgDeficit = validDeficits.length
    ? validDeficits.reduce((s, d) => s + d.deficit!, 0) / validDeficits.length
    : 0

  return {
    sessions,
    calories,
    bodyLogs,
    dailyMetrics,
    summary: {
      totalKm: Math.round(totalKm * 10) / 10,
      totalKcal,
      avgDeficit: Math.round(avgDeficit),
      sessionsCount: sessions.filter(s => s.type !== 'Rest').length,
      weekStart: startStr,
      weekEnd: endStr,
    },
  }
}
