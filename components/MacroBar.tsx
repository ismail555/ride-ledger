'use client'

import { CalorieLog } from '@/types'

interface Props {
  data: CalorieLog[]
  proteinTarget?: number
}

export function MacroBar({ data, proteinTarget = 195 }: Props) {
  if (data.length === 0) return null

  const avg = {
    calories: Math.round(data.reduce((s, d) => s + d.calories, 0) / data.length),
    protein: Math.round(data.reduce((s, d) => s + d.protein, 0) / data.length),
    carbs: Math.round(data.reduce((s, d) => s + d.carbs, 0) / data.length),
    fat: Math.round(data.reduce((s, d) => s + d.fat, 0) / data.length),
    tdee: Math.round(data.reduce((s, d) => s + d.tdee_target, 0) / data.length),
  }

  const proteinPct = Math.min((avg.protein / proteinTarget) * 100, 100)
  const caloriePct = Math.min((avg.calories / avg.tdee) * 100, 100)

  return (
    <div className="chart-wrap">
      <div className="chart-header">
        <h2 className="chart-title">Avg Daily Nutrition</h2>
        <span className="text-muted" style={{ fontSize: '0.75rem' }}>Protein target: {proteinTarget}g</span>
      </div>

      <div className="macro-grid">
        <div className="macro-stat">
          <p className="macro-val" style={{ color: '#F97316' }}>{avg.calories}</p>
          <p className="macro-label">kcal avg</p>
        </div>
        <div className="macro-stat">
          <p className="macro-val" style={{ color: '#22D3AE' }}>{avg.protein}g</p>
          <p className="macro-label">protein</p>
        </div>
        <div className="macro-stat">
          <p className="macro-val" style={{ color: '#60A5FA' }}>{avg.carbs}g</p>
          <p className="macro-label">carbs</p>
        </div>
        <div className="macro-stat">
          <p className="macro-val" style={{ color: '#FBBF24' }}>{avg.fat}g</p>
          <p className="macro-label">fat</p>
        </div>
      </div>

      <div className="bar-section">
        <div className="bar-row">
          <span className="bar-label">Calories vs TDEE</span>
          <span className="bar-pct" style={{ color: caloriePct > 95 ? '#EF4444' : '#6B7280' }}>
            {avg.calories} / {avg.tdee}
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${caloriePct}%`,
              background: caloriePct > 95 ? '#EF4444' : '#F97316',
            }}
          />
        </div>
      </div>

      <div className="bar-section" style={{ marginTop: '0.75rem' }}>
        <div className="bar-row">
          <span className="bar-label">Protein target</span>
          <span className="bar-pct" style={{ color: proteinPct >= 100 ? '#22D3AE' : '#6B7280' }}>
            {avg.protein}g / {proteinTarget}g
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${proteinPct}%`,
              background: '#22D3AE',
            }}
          />
        </div>
      </div>
    </div>
  )
}
