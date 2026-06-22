'use client'

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { DayMetrics } from '@/types'

interface Props {
  data: DayMetrics[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="tooltip-row">
          <span>{p.name}</span>
          <span className="tooltip-val">
            {p.dataKey === 'ef_score'
              ? p.value?.toFixed(3)
              : p.value !== null && p.value !== undefined
              ? `${p.value > 0 ? '+' : ''}${p.value} kcal`
              : '—'}
          </span>
        </p>
      ))}
    </div>
  )
}

export function DeficitEFChart({ data }: Props) {
  return (
    <div className="chart-wrap">
      <div className="chart-header">
        <h2 className="chart-title">Daily Deficit <span className="text-muted">vs</span> EF Score</h2>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-dot" style={{ background: '#22D3AE' }} />Deficit</span>
          <span className="legend-item"><span className="legend-dot legend-line" style={{ background: '#F97316' }} />EF Score</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="deficit"
            tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => v === 0 ? '0' : `${v > 0 ? '+' : ''}${v}`}
          />
          <YAxis
            yAxisId="ef"
            orientation="right"
            tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            domain={[1.0, 1.5]}
            tickFormatter={v => v.toFixed(2)}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine yAxisId="deficit" y={0} stroke="rgba(255,255,255,0.1)" />
          <Bar
            yAxisId="deficit"
            dataKey="deficit"
            name="Deficit"
            fill="#22D3AE"
            opacity={0.85}
            radius={[3, 3, 0, 0]}
            maxBarSize={32}
          />
          <Line
            yAxisId="ef"
            type="monotone"
            dataKey="ef_score"
            name="EF Score"
            stroke="#F97316"
            strokeWidth={2}
            dot={{ fill: '#F97316', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
