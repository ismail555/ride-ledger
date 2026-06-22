'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { BodyLog } from '@/types'
import { format, parseISO } from 'date-fns'

interface Props {
  data: BodyLog[]
  targetWeight?: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload[0] && (
        <p style={{ color: '#A78BFA' }} className="tooltip-row">
          <span>Weight</span>
          <span className="tooltip-val">{payload[0].value} kg</span>
        </p>
      )}
      {payload[1]?.value && (
        <p style={{ color: '#6B7280' }} className="tooltip-row">
          <span>Waist</span>
          <span className="tooltip-val">{payload[1].value} cm</span>
        </p>
      )}
    </div>
  )
}

export function WeightChart({ data, targetWeight = 78 }: Props) {
  const chartData = data.map(d => ({
    label: format(parseISO(d.date), 'EEE'),
    weight: d.weight,
    waist: d.waist,
  }))

  const weights = data.map(d => d.weight)
  const minW = Math.min(...weights, targetWeight) - 1
  const maxW = Math.max(...weights) + 0.5

  return (
    <div className="chart-wrap">
      <div className="chart-header">
        <h2 className="chart-title">Weight Trend</h2>
        <div className="weight-badge">
          <span className="text-muted">target</span>
          <span style={{ color: '#A78BFA' }}>{targetWeight} kg</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[minW, maxW]}
            tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={targetWeight}
            stroke="#A78BFA"
            strokeDasharray="4 4"
            strokeOpacity={0.4}
          />
          <Area
            type="monotone"
            dataKey="weight"
            stroke="#A78BFA"
            strokeWidth={2}
            fill="url(#weightGrad)"
            dot={{ fill: '#A78BFA', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
