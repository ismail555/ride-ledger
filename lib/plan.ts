import { RideType } from '@/types'

export interface DayPlan {
  type: RideType
  label: string
  duration_min: number
  zone: string
  goal: string
  tdee: number
  eat_min: number
  eat_max: number
  target_deficit: number
}

// day-of-week (0=Sun … 6=Sat) → plan
export const WEEKLY_PLAN: Record<number, DayPlan> = {
  1: { type: 'Rest',      label: 'จันทร์',  duration_min: 0,   zone: '—',     goal: 'ฟื้นตัว',         tdee: 2150, eat_min: 1650, eat_max: 1750, target_deficit: 450 },
  2: { type: 'Zone2',     label: 'อังคาร', duration_min: 90,  zone: 'Z2',    goal: 'fat burn',        tdee: 3050, eat_min: 2450, eat_max: 2550, target_deficit: 500 },
  3: { type: 'Tempo',     label: 'พุธ',    duration_min: 75,  zone: 'Z2+Z3', goal: 'เพิ่ม threshold', tdee: 3150, eat_min: 2550, eat_max: 2650, target_deficit: 500 },
  4: { type: 'Zone2',     label: 'พฤหัส', duration_min: 90,  zone: 'Z2',    goal: 'recovery ride',   tdee: 3050, eat_min: 2450, eat_max: 2550, target_deficit: 500 },
  5: { type: 'SweetSpot', label: 'ศุกร์',  duration_min: 75,  zone: 'Z2-Z3', goal: 'fat burn สูง',    tdee: 3150, eat_min: 2550, eat_max: 2650, target_deficit: 500 },
  6: { type: 'Zone2',     label: 'เสาร์',  duration_min: 90,  zone: 'Z2',    goal: 'aerobic base',    tdee: 3050, eat_min: 2450, eat_max: 2550, target_deficit: 500 },
  0: { type: 'Long ride', label: 'อาทิตย์',duration_min: 120, zone: 'Z2',    goal: 'endurance',       tdee: 3400, eat_min: 2800, eat_max: 2900, target_deficit: 500 },
}

export function getPlanForDate(dateStr: string): DayPlan {
  const dow = new Date(dateStr + 'T00:00:00').getDay()
  return WEEKLY_PLAN[dow]
}

export function calcEFScore(km: number, duration_minutes: number, avg_hr: number): number {
  const speed = (km / duration_minutes) * 60
  return Math.round((speed / avg_hr) * 1000) / 1000
}

export function rideGoalMet(
  actual_duration: number,
  planned_duration: number,
  actual_type: RideType,
  planned_type: RideType,
): { met: boolean; reason: string } {
  if (planned_type === 'Rest') return { met: true, reason: 'Rest day' }
  if (actual_type !== planned_type)
    return { met: false, reason: `ควรทำ ${planned_type} แต่ทำ ${actual_type}` }
  const pct = (actual_duration / planned_duration) * 100
  if (pct >= 90) return { met: true, reason: `${actual_duration} นาที (${Math.round(pct)}% ของแผน)` }
  return { met: false, reason: `${actual_duration} นาที — ขาด ${planned_duration - actual_duration} นาที` }
}
