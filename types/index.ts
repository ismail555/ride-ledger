export type RideType = 'Long ride' | 'Tempo' | 'SweetSpot' | 'Zone2' | 'Rest'

export interface CyclingSession {
  id: string
  date: string
  km: number
  duration_minutes: number
  avg_hr: number | null
  ef_score: number | null
  type: RideType
  kcal_burned: number | null
  notes: string | null
}

export interface CalorieLog {
  id: string
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  tdee_target: number
  food_photo: string | null
  notes: string | null
}

export interface BodyLog {
  id: string
  date: string
  weight: number
  waist: number | null
}

export interface DayMetrics {
  date: string
  label: string
  deficit: number | null
  ef_score: number | null
  kcal_burned: number | null
  calories_in: number | null
  tdee_target: number | null
  weight: number | null
}

export const TDEE_BY_TYPE: Record<RideType, number> = {
  'Long ride': 3400,
  'Tempo': 3150,
  'SweetSpot': 3150,
  'Zone2': 3050,
  'Rest': 2150,
}

export interface AppleWorkout {
  apple_health_uuid: string
  date: string
  duration_minutes: number
  distance_km: number
  avg_hr: number | null
  kcal_burned: number | null
  workout_type: string
}

export const RIDE_TYPE_COLORS: Record<RideType, string> = {
  'Long ride': '#22D3AE',
  'Tempo': '#F97316',
  'SweetSpot': '#FBBF24',
  'Zone2': '#60A5FA',
  'Rest': '#6B7280',
}
