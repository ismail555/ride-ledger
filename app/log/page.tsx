'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { getPlanForDate, rideGoalMet } from '@/lib/plan'
import { RIDE_TYPE_COLORS, RideType } from '@/types'
import Link from 'next/link'

const TODAY = format(new Date(), 'yyyy-MM-dd')
const RIDE_TYPES: RideType[] = ['Long ride', 'Tempo', 'SweetSpot', 'Zone2', 'Rest']

// Compress image client-side to max 480px / quality 0.7
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 480
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }
    img.onerror = reject
    img.src = url
  })
}

// ─── Calorie Form ────────────────────────────────────────────────────────────
function CalorieForm({ date }: { date: string }) {
  const [form, setForm] = useState({ calories: '', protein: '', carbs: '', fat: '', notes: '' })
  const [photo, setPhoto] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ tdee: number; deficit: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const plan = getPlanForDate(date)

  useEffect(() => {
    setResult(null)
    setError(null)
    fetch(`/api/log/calories?date=${date}`)
      .then(r => r.json())
      .then(d => {
        if (d) {
          setForm({
            calories: String(d.calories ?? ''),
            protein: String(d.protein ?? ''),
            carbs: String(d.carbs ?? ''),
            fat: String(d.fat ?? ''),
            notes: d.notes ?? '',
          })
          if (d.food_photo) { setPhoto(d.food_photo); setPhotoPreview(d.food_photo) }
          setResult({ tdee: d.tdee_target, deficit: d.tdee_target - d.calories })
        }
      })
      .catch(() => {})
  }, [date])

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    setPhoto(compressed)
    setPhotoPreview(compressed)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/log/calories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, ...form, food_photo: photo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult({ tdee: data.tdee_target, deficit: data.deficit })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const deficit = result?.deficit ?? (form.calories && plan ? plan.tdee - Number(form.calories) : null)
  const deficitOk = deficit !== null && deficit >= 0

  return (
    <form onSubmit={handleSave} className="log-card">
      <div className="log-card-header">
        <h2 className="log-section-title">🍽 Calorie Log</h2>
        <div className="plan-badge" style={{ borderColor: RIDE_TYPE_COLORS[plan.type], color: RIDE_TYPE_COLORS[plan.type] }}>
          {plan.label} · {plan.type}
        </div>
      </div>

      {/* TDEE guidance */}
      <div className="tdee-guide">
        <span className="tdee-row"><span className="tdee-label">TDEE วันนี้</span><span className="tdee-val">{plan.tdee.toLocaleString()} kcal</span></span>
        <span className="tdee-sep">→</span>
        <span className="tdee-row"><span className="tdee-label">กิน</span><span className="tdee-val">{plan.eat_min.toLocaleString()}–{plan.eat_max.toLocaleString()} kcal</span></span>
        <span className="tdee-sep">=</span>
        <span className="tdee-row"><span className="tdee-label">Deficit</span><span className="tdee-val" style={{ color: 'var(--teal)' }}>~{plan.target_deficit} kcal</span></span>
      </div>

      {/* Macro inputs */}
      <div className="input-grid4">
        <label className="input-wrap">
          <span className="input-label">Calories</span>
          <input className="field" type="number" placeholder="2500" value={form.calories}
            onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} required />
        </label>
        <label className="input-wrap">
          <span className="input-label">Protein (g)</span>
          <input className="field" type="number" placeholder="195" value={form.protein}
            onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} />
        </label>
        <label className="input-wrap">
          <span className="input-label">Carbs (g)</span>
          <input className="field" type="number" placeholder="220" value={form.carbs}
            onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} />
        </label>
        <label className="input-wrap">
          <span className="input-label">Fat (g)</span>
          <input className="field" type="number" placeholder="65" value={form.fat}
            onChange={e => setForm(f => ({ ...f, fat: e.target.value }))} />
        </label>
      </div>

      {/* Notes */}
      <label className="input-wrap" style={{ display: 'block', marginBottom: '1rem' }}>
        <span className="input-label">Notes / เมนูที่กิน</span>
        <textarea className="field field-textarea" placeholder="ข้าวไก่ย่าง, โปรตีนเชค, สลัด…" value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </label>

      {/* Photo upload */}
      <div className="photo-zone" onClick={() => fileRef.current?.click()}>
        {photoPreview
          ? <img src={photoPreview} alt="food" className="photo-preview" />
          : <div className="photo-placeholder"><span>📷</span><span>อัปโหลดรูปอาหาร</span><span className="photo-hint">แตะเพื่อเลือกรูป</span></div>
        }
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
      </div>

      {/* Deficit summary */}
      {form.calories && (
        <div className={`deficit-box ${deficitOk ? 'deficit-ok' : 'deficit-over'}`}>
          <div className="deficit-main">
            <span className="deficit-label">Deficit วันนี้</span>
            <span className="deficit-value">
              {deficit !== null ? `${deficit > 0 ? '+' : ''}${Math.round(deficit)} kcal` : '—'}
            </span>
          </div>
          <div className="deficit-bars">
            <div className="deficit-bar-row">
              <span>กิน</span>
              <div className="dbar-track">
                <div className="dbar-fill" style={{
                  width: `${Math.min((Number(form.calories) / plan.tdee) * 100, 100)}%`,
                  background: deficitOk ? 'var(--orange)' : 'var(--red)',
                }} />
              </div>
              <span className="dbar-num">{Number(form.calories).toLocaleString()}</span>
            </div>
            <div className="deficit-bar-row">
              <span>TDEE</span>
              <div className="dbar-track">
                <div className="dbar-fill" style={{ width: '100%', background: 'rgba(255,255,255,0.15)' }} />
              </div>
              <span className="dbar-num">{plan.tdee.toLocaleString()}</span>
            </div>
            {form.protein && (
              <div className="deficit-bar-row">
                <span>Protein</span>
                <div className="dbar-track">
                  <div className="dbar-fill" style={{
                    width: `${Math.min((Number(form.protein) / 195) * 100, 100)}%`,
                    background: Number(form.protein) >= 195 ? 'var(--teal)' : 'var(--amber)',
                  }} />
                </div>
                <span className="dbar-num">{form.protein}g / 195g</span>
              </div>
            )}
          </div>
          <p className="deficit-verdict">{deficitOk ? '✓ อยู่ในแผน' : '⚠ กินเกิน TDEE'}</p>
        </div>
      )}

      {error && <p className="form-error">⚠ {error}</p>}
      <button type="submit" className="save-btn" disabled={saving}>
        {saving ? 'Saving…' : 'บันทึก Calories'}
      </button>
    </form>
  )
}

// ─── Ride Form ────────────────────────────────────────────────────────────────
function RideForm({ date }: { date: string }) {
  const [form, setForm] = useState({
    type: '' as RideType | '',
    km: '',
    hours: '',
    minutes: '',
    avg_hr: '',
    kcal_burned: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ ef_score: number | null; goal: { met: boolean; reason: string }; plan: any } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const plan = getPlanForDate(date)

  useEffect(() => {
    setResult(null)
    setError(null)
    setForm({ type: '', km: '', hours: '', minutes: '', avg_hr: '', kcal_burned: '', notes: '' })
  }, [date])

  const totalMinutes = (Number(form.hours) || 0) * 60 + (Number(form.minutes) || 0)
  const previewGoal = form.type && totalMinutes > 0
    ? rideGoalMet(totalMinutes, plan.duration_min, form.type as RideType, plan.type)
    : null

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/log/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          type: form.type,
          km: Number(form.km),
          duration_minutes: totalMinutes,
          avg_hr: form.avg_hr ? Number(form.avg_hr) : null,
          kcal_burned: form.kcal_burned ? Number(form.kcal_burned) : null,
          notes: form.notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="log-card">
      <div className="log-card-header">
        <h2 className="log-section-title">🚴 Ride Log</h2>
        <div className="plan-badge" style={{ borderColor: RIDE_TYPE_COLORS[plan.type], color: RIDE_TYPE_COLORS[plan.type] }}>
          แผน: {plan.type} {plan.duration_min > 0 ? `${plan.duration_min} นาที` : ''}
        </div>
      </div>

      {/* Plan summary */}
      <div className="plan-info">
        <span className="plan-zone">Zone: {plan.zone}</span>
        <span className="plan-goal">เป้า: {plan.goal}</span>
      </div>

      {/* Type selector */}
      <div className="input-wrap" style={{ marginBottom: '1rem' }}>
        <span className="input-label">ประเภท Session</span>
        <div className="type-grid">
          {RIDE_TYPES.map(t => (
            <button
              key={t}
              type="button"
              className={`type-btn ${form.type === t ? 'type-btn-active' : ''}`}
              style={form.type === t ? { borderColor: RIDE_TYPE_COLORS[t], color: RIDE_TYPE_COLORS[t], background: `${RIDE_TYPE_COLORS[t]}18` } : {}}
              onClick={() => setForm(f => ({ ...f, type: t }))}
            >{t}</button>
          ))}
        </div>
      </div>

      {form.type !== 'Rest' && (
        <>
          <div className="input-grid3">
            <label className="input-wrap">
              <span className="input-label">ระยะทาง (km)</span>
              <input className="field" type="number" step="0.1" placeholder="35.0" value={form.km}
                onChange={e => setForm(f => ({ ...f, km: e.target.value }))} required={!['', 'Rest'].includes(form.type)} />
            </label>
            <label className="input-wrap">
              <span className="input-label">ชั่วโมง</span>
              <input className="field" type="number" min="0" max="6" placeholder="1" value={form.hours}
                onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
            </label>
            <label className="input-wrap">
              <span className="input-label">นาที</span>
              <input className="field" type="number" min="0" max="59" placeholder="30" value={form.minutes}
                onChange={e => setForm(f => ({ ...f, minutes: e.target.value }))} />
            </label>
          </div>

          <div className="input-grid2">
            <label className="input-wrap">
              <span className="input-label">Avg HR (bpm)</span>
              <input className="field" type="number" placeholder="145" value={form.avg_hr}
                onChange={e => setForm(f => ({ ...f, avg_hr: e.target.value }))} />
            </label>
            <label className="input-wrap">
              <span className="input-label">Kcal Burned</span>
              <input className="field" type="number" placeholder="1200" value={form.kcal_burned}
                onChange={e => setForm(f => ({ ...f, kcal_burned: e.target.value }))} />
            </label>
          </div>
        </>
      )}

      <label className="input-wrap" style={{ display: 'block', marginBottom: '1rem' }}>
        <span className="input-label">Notes</span>
        <textarea className="field field-textarea" placeholder="ความรู้สึก, สภาพอากาศ, หัวใจ…" value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </label>

      {/* Live goal preview */}
      {previewGoal && !result && (
        <div className={`goal-result ${previewGoal.met ? 'goal-ok' : 'goal-miss'}`}>
          <span className="goal-icon">{previewGoal.met ? '✓' : '✗'}</span>
          <div>
            <p className="goal-title">{previewGoal.met ? 'ถึงเป้าหมาย' : 'ยังไม่ถึงเป้า'}</p>
            <p className="goal-reason">{previewGoal.reason}</p>
          </div>
        </div>
      )}

      {/* Save result */}
      {result && (
        <div className={`goal-result ${result.goal.met ? 'goal-ok' : 'goal-miss'}`}>
          <span className="goal-icon">{result.goal.met ? '✓' : '✗'}</span>
          <div style={{ flex: 1 }}>
            <p className="goal-title">{result.goal.met ? '✅ บันทึกแล้ว — ถึงเป้า!' : '💾 บันทึกแล้ว — ยังไม่ถึงเป้า'}</p>
            <p className="goal-reason">{result.goal.reason}</p>
            {result.ef_score && (
              <p className="goal-ef">EF Score: <strong style={{ color: 'var(--teal)' }}>{result.ef_score.toFixed(3)}</strong></p>
            )}
          </div>
        </div>
      )}

      {error && <p className="form-error">⚠ {error}</p>}
      <button type="submit" className="save-btn" disabled={saving || !form.type}>
        {saving ? 'Saving…' : 'บันทึก Ride'}
      </button>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LogPage() {
  const [date, setDate] = useState(TODAY)
  const plan = getPlanForDate(date)

  return (
    <main className="dashboard">
      <div className="dash-header">
        <div>
          <Link href="/" className="back-link">← Dashboard</Link>
          <h1 className="dash-title" style={{ marginTop: '0.25rem' }}>Daily Log</h1>
          <p className="dash-subtitle">บันทึก Calories & Ride</p>
        </div>
        <div>
          <input
            type="date"
            value={date}
            max={TODAY}
            onChange={e => setDate(e.target.value)}
            className="date-picker"
          />
        </div>
      </div>

      {/* Day plan header */}
      <div className="day-plan-header">
        <div>
          <span className="day-plan-label">แผนวันนี้</span>
          <span className="day-plan-type" style={{ color: RIDE_TYPE_COLORS[plan.type] }}>{plan.label} — {plan.type}</span>
        </div>
        <div className="day-plan-meta">
          <span>{plan.zone !== '—' ? `Zone ${plan.zone}` : 'Rest'}</span>
          {plan.duration_min > 0 && <span>{plan.duration_min} นาที</span>}
          <span>{plan.goal}</span>
        </div>
      </div>

      <div className="log-grid">
        <CalorieForm date={date} />
        <RideForm date={date} />
      </div>
    </main>
  )
}
