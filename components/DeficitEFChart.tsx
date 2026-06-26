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
  Cell,
  LabelList,
} from 'recharts'
import { DayMetrics } from '@/types'

const DEFICIT_TARGET = 500 // kcal/day target

interface Props {
  data: DayMetrics[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null

  const deficit = payload.find((p: any) => p.dataKey === 'deficit')
  const ef = payload.find((p: any) => p.dataKey === 'ef_score')
  const defVal = deficit?.value
  const efVal = ef?.value

  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {defVal != null && (
        <p className="tooltip-row" style={{ color: defVal >= 0 ? '#22D3AE' : '#EF4444' }}>
          <span>Deficit</span>
          <span className="tooltip-val">
            {defVal >= 0 ? '+' : ''}{defVal.toLocaleString()} kcal
            {defVal > 0 && (
              <span style={{ color: '#6B7280', fontWeight: 400 }}>
                {' '}({Math.round((defVal / DEFICIT_TARGET) * 100)}% of target)
              </span>
            )}
          </span>
        </p>
      )}
      {efVal != null && (
        <p className="tooltip-row" style={{ color: efVal >= 0.2 ? '#22D3AE' : '#F97316' }}>
          <span>EF Score</span>
          <span className="tooltip-val">
            {efVal.toFixed(3)}
            <span style={{ color: '#6B7280', fontWeight: 400 }}>
              {efVal >= 0.22 ? ' ✓ good' : efVal >= 0.18 ? ' ~ ok' : ' ↓ low'}
            </span>
          </span>
        </p>
      )}
    </div>
  )
}

// Custom bar label — show value above bar, skip if null or 0
const BarLabel = (props: any) => {
  const { x, y, width, value } = props
  if (value == null || value === 0) return null
  const positive = value >= 0
  return (
    <text
      x={x + width / 2}
      y={positive ? y - 4 : y + 14}
      textAnchor="middle"
      fill={positive ? '#22D3AE' : '#EF4444'}
      fontSize={9}
      fontFamily="var(--font-mono)"
      fontWeight={500}
    >
      {positive ? '+' : ''}{value > 999 ? `${(value / 1000).toFixed(1)}k` : value}
    </text>
  )
}

export function DeficitEFChart({ data }: Props) {
  // Dynamic EF domain — pad 15% above/below actual range
  const efValues = data.map(d => d.ef_score).filter((v): v is number => v != null)
  const efMin = efValues.length ? Math.min(...efValues) : 0.1
  const efMax = efValues.length ? Math.max(...efValues) : 0.4
  const efPad = (efMax - efMin) * 0.25 || 0.05
  const efDomain: [number, number] = [
    Math.max(0, Math.round((efMin - efPad) * 1000) / 1000),
    Math.round((efMax + efPad) * 1000) / 1000,
  ]

  // Deficit range for left axis
  const defValues = data.map(d => d.deficit).filter((v): v is number => v != null)
  const defMax = defValues.length ? Math.max(...defValues, DEFICIT_TARGET * 1.2) : 800
  const defMin = defValues.length ? Math.min(...defValues, -200) : -200

  const hasAnyData = defValues.length > 0 || efValues.length > 0

  return (
    <div className="chart-wrap">
      <div className="chart-header">
        <div>
          <h2 className="chart-title">Daily Deficit <span className="text-muted" style={{ fontWeight: 400 }}>vs</span> EF Score</h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
            เป้า deficit {DEFICIT_TARGET} kcal/วัน · EF ≥ 0.22 = good
          </p>
        </div>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#22D3AE', borderRadius: 2 }} />
            Deficit
          </span>
          <span className="legend-item">
            <svg width="18" height="10" style={{ marginRight: 3 }}>
              <line x1="0" y1="5" x2="18" y2="5" stroke="#F97316" strokeWidth="2" />
              <circle cx="9" cy="5" r="3" fill="#F97316" />
            </svg>
            EF
          </span>
        </div>
      </div>

      {!hasAnyData ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="text-muted mono" style={{ fontSize: '0.7rem' }}>Log calories & ride เพื่อดูกราฟ</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data} margin={{ top: 18, right: 16, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="defGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22D3AE" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#22D3AE" stopOpacity={0.45} />
              </linearGradient>
              <linearGradient id="defNegGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0.3} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="2 8"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
            />

            {/* Left axis: deficit kcal */}
            <YAxis
              yAxisId="deficit"
              domain={[defMin, defMax]}
              tick={{ fill: '#6B7280', fontSize: 9, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => v === 0 ? '0' : `${v > 0 ? '+' : ''}${Math.round(v / 100) * 100}`}
              width={36}
            />

            {/* Right axis: EF score */}
            <YAxis
              yAxisId="ef"
              orientation="right"
              domain={efDomain}
              tick={{ fill: '#6B7280', fontSize: 9, fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => v.toFixed(2)}
              width={32}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />

            {/* Zero line */}
            <ReferenceLine yAxisId="deficit" y={0} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />

            {/* Target deficit dashed line */}
            <ReferenceLine
              yAxisId="deficit"
              y={DEFICIT_TARGET}
              stroke="rgba(34,211,174,0.3)"
              strokeDasharray="5 5"
              strokeWidth={1}
              label={{
                value: 'target',
                position: 'insideTopRight',
                fill: 'rgba(34,211,174,0.5)',
                fontSize: 8,
                fontFamily: 'var(--font-mono)',
              }}
            />

            {/* Deficit bars — colored by positive/negative */}
            <Bar
              yAxisId="deficit"
              dataKey="deficit"
              name="Deficit"
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.deficit == null
                      ? 'rgba(255,255,255,0.06)'
                      : entry.deficit >= DEFICIT_TARGET
                      ? 'url(#defGrad)'
                      : entry.deficit >= 0
                      ? 'rgba(34,211,174,0.45)'
                      : 'url(#defNegGrad)'
                  }
                />
              ))}
              <LabelList content={<BarLabel />} />
            </Bar>

            {/* EF Score line */}
            <Line
              yAxisId="ef"
              type="monotone"
              dataKey="ef_score"
              name="EF Score"
              stroke="#F97316"
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, payload } = props
                if (payload.ef_score == null) return <g key={`dot-${cx}-${cy}`} />
                const good = payload.ef_score >= 0.22
                return (
                  <circle
                    key={`dot-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={good ? '#22D3AE' : '#F97316'}
                    stroke={good ? '#22D3AE' : '#F97316'}
                    strokeWidth={0}
                    style={{ filter: `drop-shadow(0 0 4px ${good ? '#22D3AE' : '#F97316'}88)` }}
                  />
                )
              }}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#F97316' }}
              connectNulls
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
