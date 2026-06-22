'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { StatCard } from '@/components/StatCard'
import { DeficitEFChart } from '@/components/DeficitEFChart'
import { WeightChart } from '@/components/WeightChart'
import { SessionsTable } from '@/components/SessionsTable'
import { MacroBar } from '@/components/MacroBar'
import { CyclingSession, CalorieLog, BodyLog, DayMetrics } from '@/types'
import Link from 'next/link'
import { AppleHealthSync } from '@/components/AppleHealthSync'

interface WeekData {
  sessions: CyclingSession[]
  calories: CalorieLog[]
  bodyLogs: BodyLog[]
  dailyMetrics: DayMetrics[]
  summary: {
    totalKm: number
    totalKcal: number
    avgDeficit: number
    sessionsCount: number
    weekStart: string
    weekEnd: string
  }
}

function GoalBar({ totalKm }: { totalKm: number }) {
  const goalPerRide = 40
  const pct = Math.min((totalKm / (goalPerRide * 4)) * 100, 100)
  return (
    <div className="goal-bar-wrap">
      <p className="goal-title">Season Goal — 40 km / 1:30 per ride (26.7 km/h avg)</p>
      <div className="goal-row">
        <span className="goal-val">{totalKm} km</span>
        <div className="goal-track">
          <div className="goal-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="goal-target">vs 4×40 km</span>
      </div>
    </div>
  )
}

export default function WeeklyDashboard() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [data, setData] = useState<WeekData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (offset: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/week?offset=${offset}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const result = await res.json()
      setData(result)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(weekOffset) }, [weekOffset, load])

  const weekLabel = data
    ? `${format(parseISO(data.summary.weekStart), 'd MMM')} — ${format(parseISO(data.summary.weekEnd), 'd MMM yyyy')}`
    : '—'

  const avgEF = data?.sessions.filter(s => s.ef_score !== null).length
    ? (() => {
        const valid = data!.sessions.filter(s => s.ef_score !== null)
        return valid.reduce((s, r) => s + r.ef_score!, 0) / valid.length
      })()
    : null

  const latestWeight = data?.bodyLogs.length
    ? data.bodyLogs[data.bodyLogs.length - 1].weight
    : null

  return (
    <main className="dashboard">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Ride Ledger</h1>
          <p className="dash-subtitle">88 kg → 78 kg · 170 cm · 30 yr · Weekly Overview</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/log" className="log-today-btn">+ Log Today</Link>
          <div className="week-nav">
            <button className="nav-btn" onClick={() => setWeekOffset(o => o - 1)}>‹</button>
            <span className="week-label">{weekLabel}</span>
            <button
              className="nav-btn"
              onClick={() => setWeekOffset(o => Math.min(o + 1, 0))}
              disabled={weekOffset === 0}
              style={{ opacity: weekOffset === 0 ? 0.3 : 1 }}
            >›</button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <p className="text-muted mono" style={{ fontSize: '0.72rem' }}>Loading week data…</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>⚠ {error}</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--muted)' }}>
            Check .env.local — DATABASE_URL (Neon connection string) required
          </p>
        </div>
      )}

      <AppleHealthSync
        onSynced={() => load(weekOffset)}
        apiKey={process.env.NEXT_PUBLIC_APPLE_SYNC_API_KEY ?? ''}
      />

      {!loading && !error && data && (
        <>
          <div className="stats-grid">
            <StatCard
              label="Total Distance"
              value={`${data.summary.totalKm}`}
              sub="km this week"
              accent="var(--teal)"
              icon="🚴"
            />
            <StatCard
              label="Kcal Burned"
              value={data.summary.totalKcal.toLocaleString()}
              sub="from rides"
              accent="var(--orange)"
              icon="🔥"
            />
            <StatCard
              label="Avg Deficit"
              value={`${data.summary.avgDeficit > 0 ? '+' : ''}${data.summary.avgDeficit}`}
              sub="kcal / day"
              accent={data.summary.avgDeficit >= 300 ? 'var(--teal)' : 'var(--amber)'}
              icon="⚡"
            />
            <StatCard
              label="Sessions"
              value={`${data.summary.sessionsCount}`}
              sub={avgEF ? `avg EF ${avgEF.toFixed(3)}` : 'rides this week'}
              accent="var(--violet)"
              icon="📊"
            />
          </div>

          {latestWeight && (
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
              <StatCard
                label="Current Weight"
                value={`${latestWeight}`}
                sub="kg · target 78 kg"
                accent="var(--violet)"
                icon="⚖️"
              />
              <StatCard
                label="To Goal"
                value={`${(latestWeight - 78).toFixed(1)}`}
                sub="kg remaining"
                accent={(latestWeight - 78) < 5 ? 'var(--teal)' : 'var(--orange)'}
                icon="🎯"
              />
            </div>
          )}

          <GoalBar totalKm={data.summary.totalKm} />

          <div className="charts-grid">
            <DeficitEFChart data={data.dailyMetrics} />
            {data.bodyLogs.length > 0
              ? <WeightChart data={data.bodyLogs} targetWeight={78} />
              : (
                <div className="chart-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p className="text-muted mono" style={{ fontSize: '0.72rem' }}>No body log data this week</p>
                </div>
              )
            }
          </div>

          {data.calories.length > 0 && (
            <MacroBar data={data.calories} proteinTarget={195} />
          )}

          <SessionsTable sessions={data.sessions} onRefresh={() => load(weekOffset)} />
        </>
      )}
    </main>
  )
}
