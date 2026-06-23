'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import { StatCard } from '@/components/StatCard'
import { DeficitEFChart } from '@/components/DeficitEFChart'
import { WeightChart } from '@/components/WeightChart'
import { SessionsTable } from '@/components/SessionsTable'
import { MacroBar } from '@/components/MacroBar'
import { CyclingSession, CalorieLog, BodyLog, DayMetrics } from '@/types'
import Link from 'next/link'
import { AppleHealthSync } from '@/components/AppleHealthSync'
import { WEEKLY_PLAN } from '@/lib/plan'

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

// ── Weekly Energy Balance ─────────────────────────────────────────────────────
const KCAL_PER_KG_FAT = 7700

function WeekNutritionPanel({ calories, sessions }: {
  calories: CalorieLog[]
  sessions: CyclingSession[]
}) {
  if (calories.length === 0) {
    return (
      <div className="week-nutrition-wrap">
        <div className="wn-header">
          <span className="wn-title">Weekly Energy Balance</span>
          <span className="text-muted mono" style={{ fontSize: '0.65rem' }}>ยังไม่มีข้อมูล — log calories ก่อน</span>
        </div>
      </div>
    )
  }

  const totalIn   = calories.reduce((s, c) => s + Number(c.calories), 0)
  const totalTDEE = calories.reduce((s, c) => s + Number(c.tdee_target), 0)
  const rideKcal  = sessions.reduce((s, r) => s + (r.kcal_burned ?? 0), 0)
  const netDeficit = totalTDEE - totalIn           // positive = ate less than TDEE (good)
  const netWithRide = netDeficit + rideKcal        // add back ride burn for full NEAT picture
  const loggedDays = calories.length

  // Projected if kept at this pace for full 7 days
  const projDeficit7 = (netDeficit / loggedDays) * 7
  const projFatG = projDeficit7 / KCAL_PER_KG_FAT * 1000
  const projFatActual = netDeficit / KCAL_PER_KG_FAT * 1000 // already-achieved so far

  const onTrack = netDeficit > 0
  const pct = Math.min(Math.max((netDeficit / 3500) * 100, 0), 100) // 3500 = weekly target

  return (
    <div className="week-nutrition-wrap">
      <div className="wn-header">
        <span className="wn-title">Weekly Energy Balance</span>
        <span className="wn-days mono">{loggedDays}/7 วัน</span>
      </div>

      {/* 4-number summary */}
      <div className="wn-stats">
        <div className="wn-stat">
          <span className="wn-stat-label">กิน (รวม)</span>
          <span className="wn-stat-val">{totalIn.toLocaleString()}</span>
          <span className="wn-stat-unit">kcal</span>
        </div>
        <div className="wn-stat">
          <span className="wn-stat-label">TDEE (รวม)</span>
          <span className="wn-stat-val">{totalTDEE.toLocaleString()}</span>
          <span className="wn-stat-unit">kcal</span>
        </div>
        <div className="wn-stat">
          <span className="wn-stat-label">Deficit สะสม</span>
          <span className="wn-stat-val" style={{ color: onTrack ? 'var(--teal)' : 'var(--red)' }}>
            {onTrack ? '+' : ''}{netDeficit.toLocaleString()}
          </span>
          <span className="wn-stat-unit">kcal</span>
        </div>
        <div className="wn-stat">
          <span className="wn-stat-label">Fat ที่เผาแล้ว</span>
          <span className="wn-stat-val" style={{ color: onTrack ? 'var(--teal)' : 'var(--red)' }}>
            {onTrack ? '-' : '+'}{Math.abs(projFatActual).toFixed(0)}
          </span>
          <span className="wn-stat-unit">g</span>
        </div>
      </div>

      {/* Progress bar vs 3,500 kcal weekly target */}
      <div className="wn-bar-label-row">
        <span className="wn-bar-label">Deficit progress vs เป้า 3,500 kcal/สัปดาห์</span>
        <span className="wn-bar-pct" style={{ color: onTrack ? 'var(--teal)' : 'var(--red)' }}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="wn-bar-track">
        <div className="wn-bar-fill" style={{
          width: `${pct}%`,
          background: onTrack ? 'var(--teal)' : 'var(--red)',
        }} />
      </div>

      {/* Science verdict */}
      <div className={`wn-verdict ${onTrack ? 'wn-ok' : 'wn-over'}`}>
        <span className="wn-verdict-icon">{onTrack ? '▼' : '▲'}</span>
        <div className="wn-verdict-text">
          <span className="wn-verdict-main">
            {onTrack
              ? `ลงแน่นอน — ถ้าคงเส้นคงวาถึงปลายสัปดาห์ คาดว่าลด ~${Math.abs(projFatG).toFixed(0)}g fat`
              : `เกินแผน — deficit ติดลบ ไขมันสะสม ~${Math.abs(projFatActual).toFixed(0)}g สัปดาห์นี้`}
          </span>
          {rideKcal > 0 && (
            <span className="wn-verdict-sub">
              รวม ride burn {rideKcal.toLocaleString()} kcal → net energy gap {netWithRide.toLocaleString()} kcal
            </span>
          )}
          <span className="wn-verdict-sub">
            7,700 kcal = fat 1 kg · ตอนนี้ทำได้ {(netDeficit / 7700 * 1000).toFixed(0)}g จาก diet เพียงอย่างเดียว
          </span>
        </div>
      </div>
    </div>
  )
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

  const latestWaist = data?.bodyLogs.length
    ? [...data.bodyLogs].reverse().find(b => b.waist != null)?.waist ?? null
    : null

  // Today's Brief — computed client-side
  const todayDow = new Date().getDay()
  const todayPlan = WEEKLY_PLAN[todayDow]
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  const yesterdaySession = data?.sessions.find(s => s.date.slice(0, 10) === yesterdayStr) ?? null
  const weekDeficit = data?.dailyMetrics.reduce((sum, d) => sum + (d.deficit ?? 0), 0) ?? 0
  const weekTargetDeficit = 3500 // ~500/day × 7
  const proteinDays = data?.calories.filter(c => Number(c.protein) >= 195).length ?? 0
  const loggedDays = data?.calories.length ?? 0

  return (
    <main className="dashboard">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Ride Ledger</h1>
          <p className="dash-subtitle">Waist 35.8" → 32" · 170 cm · 30 yr</p>
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
          {/* ── Today's Brief ── */}
          {weekOffset === 0 && (
            <div className="brief-wrap">
              {/* Yesterday's ride */}
              <div className="brief-block">
                <p className="brief-label">เมื่อวาน</p>
                {yesterdaySession ? (
                  <div className="brief-ride">
                    <span className="brief-ride-type">{yesterdaySession.type}</span>
                    <span className="brief-ride-stat">{yesterdaySession.km} km</span>
                    <span className="brief-ride-stat">{Math.floor(yesterdaySession.duration_minutes / 60)}h {yesterdaySession.duration_minutes % 60}m</span>
                    {yesterdaySession.ef_score && (
                      <span className={`brief-ride-ef ${yesterdaySession.ef_score >= 1.25 ? 'ef-good' : 'ef-warn'}`}>
                        EF {yesterdaySession.ef_score.toFixed(3)}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="brief-empty">ไม่มี session — Rest day หรือยังไม่ได้ log</p>
                )}
              </div>

              {/* Weekly progress */}
              <div className="brief-block">
                <p className="brief-label">สัปดาห์นี้</p>
                <div className="brief-deficit-row">
                  <span className="brief-deficit-num" style={{ color: weekDeficit >= 0 ? 'var(--teal)' : 'var(--orange)' }}>
                    {weekDeficit >= 0 ? '+' : ''}{weekDeficit.toLocaleString()} kcal
                  </span>
                  <span className="brief-deficit-target">เป้า {weekTargetDeficit.toLocaleString()}</span>
                </div>
                <div className="brief-progress-bar">
                  <div
                    className="brief-progress-fill"
                    style={{ width: `${Math.min(Math.max((weekDeficit / weekTargetDeficit) * 100, 0), 100)}%` }}
                  />
                </div>
                <p className="brief-protein-row">
                  Protein ≥195g: <span style={{ color: 'var(--teal)' }}>{proteinDays}/{loggedDays} วัน</span>
                  {latestWaist && (
                    <> · รอบเอว <span style={{ color: 'var(--violet)' }}>{latestWaist}"</span> → เป้า <span style={{ color: 'var(--teal)' }}>32"</span></>
                  )}
                </p>
              </div>

              {/* Today's target */}
              <div className="brief-block brief-today">
                <p className="brief-label">วันนี้ — {todayPlan.label} ({todayPlan.type})</p>
                <div className="brief-today-row">
                  <div className="brief-today-item">
                    <span className="brief-today-key">TDEE</span>
                    <span className="brief-today-val">{todayPlan.tdee.toLocaleString()} kcal</span>
                  </div>
                  <div className="brief-today-item">
                    <span className="brief-today-key">กินได้</span>
                    <span className="brief-today-val" style={{ color: 'var(--teal)' }}>
                      {todayPlan.eat_min.toLocaleString()}–{todayPlan.eat_max.toLocaleString()} kcal
                    </span>
                  </div>
                  <div className="brief-today-item">
                    <span className="brief-today-key">Protein</span>
                    <span className="brief-today-val" style={{ color: 'var(--amber)' }}>≥ 195g</span>
                  </div>
                  {todayPlan.duration_min > 0 && (
                    <div className="brief-today-item">
                      <span className="brief-today-key">Ride</span>
                      <span className="brief-today-val">{todayPlan.duration_min} min · {todayPlan.zone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
              label="Sessions"
              value={`${data.summary.sessionsCount}`}
              sub={avgEF ? `avg EF ${avgEF.toFixed(3)}` : 'rides this week'}
              accent="var(--violet)"
              icon="📊"
            />
            {latestWaist ? (
              <StatCard
                label="Waist"
                value={`${latestWaist}"`}
                sub={`to goal: ${(latestWaist - 32).toFixed(1)}" remaining`}
                accent={(latestWaist - 32) < 2 ? 'var(--teal)' : 'var(--violet)'}
                icon="📏"
              />
            ) : (
              <StatCard
                label="Waist"
                value="—"
                sub='log รอบเอวที่หน้า Log'
                accent="var(--violet)"
                icon="📏"
              />
            )}
          </div>

          <GoalBar totalKm={data.summary.totalKm} />

          <div className="charts-grid">
            <DeficitEFChart data={data.dailyMetrics} />
            <WeightChart data={data.bodyLogs} targetWaist={32} />
          </div>

          {data.calories.length > 0 && (
            <MacroBar data={data.calories} proteinTarget={195} />
          )}

          <WeekNutritionPanel calories={data.calories} sessions={data.sessions} />

          <SessionsTable sessions={data.sessions} onRefresh={() => load(weekOffset)} />
        </>
      )}
    </main>
  )
}
