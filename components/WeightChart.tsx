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

const TARGET_WAIST = 32 // inches

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload[0]?.value != null && (
        <p style={{ color: '#A78BFA' }} className="tooltip-row">
          <span>Waist</span>
          <span className="tooltip-val">{payload[0].value}"</span>
        </p>
      )}
    </div>
  )
}

interface Props {
  data: BodyLog[]
  targetWaist?: number
}

export function WeightChart({ data, targetWaist = TARGET_WAIST }: Props) {
  const waistData = data.filter(d => d.waist != null)

  if (waistData.length === 0) {
    return (
      <div className="chart-wrap" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="chart-header">
          <h2 className="chart-title">Waist Trend</h2>
          <div className="weight-badge">
            <span className="text-muted">target</span>
            <span style={{ color: '#A78BFA' }}>{targetWaist}"</span>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="text-muted mono" style={{ fontSize: '0.72rem' }}>Log รอบเอวเพื่อดู trend</p>
        </div>
      </div>
    )
  }

  const chartData = waistData.map(d => ({
    label: format(parseISO(d.date), 'EEE'),
    waist: d.waist,
  }))

  const values = waistData.map(d => d.waist!)
  const minV = Math.min(...values, targetWaist) - 0.5
  const maxV = Math.max(...values) + 0.5

  return (
    <div className="chart-wrap">
      <div className="chart-header">
        <h2 className="chart-title">Waist Trend</h2>
        <div className="weight-badge">
          <span className="text-muted">target</span>
          <span style={{ color: '#A78BFA' }}>{targetWaist}"</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="waistGrad" x1="0" y1="0" x2="0" y2="1">
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
            domain={[minV, maxV]}
            tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}"`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={targetWaist}
            stroke="#A78BFA"
            strokeDasharray="4 4"
            strokeOpacity={0.4}
          />
          <Area
            type="monotone"
            dataKey="waist"
            stroke="#A78BFA"
            strokeWidth={2}
            fill="url(#waistGrad)"
            dot={{ fill: '#A78BFA', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
