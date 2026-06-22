'use client'

import { useState } from 'react'
import { CyclingSession, RIDE_TYPE_COLORS, RideType } from '@/types'
import { format, parseISO } from 'date-fns'

interface Props {
  sessions: CyclingSession[]
  onRefresh: () => void
}

const RIDE_TYPES: RideType[] = ['Long ride', 'Tempo', 'SweetSpot', 'Zone2', 'Rest']

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`
}

function SpeedBadge({ km, minutes }: { km: number; minutes: number }) {
  const speed = (km / minutes) * 60
  return (
    <span className={`speed-badge ${speed >= 26.7 ? 'speed-ok' : 'speed-low'}`}>
      {speed.toFixed(1)} km/h
    </span>
  )
}

interface EditState {
  type: RideType
  date: string
  km: string
  hours: string
  mins: string
  avg_hr: string
  kcal_burned: string
  notes: string
}

function toLocalDateStr(iso: string): string {
  // Neon DATE columns serialize as UTC midnight ISO string (e.g. "2026-06-21T17:00:00.000Z" = 2026-06-22 Bangkok).
  // toLocaleDateString('en-CA') gives YYYY-MM-DD in the browser's local timezone.
  return new Date(iso).toLocaleDateString('en-CA')
}

function toEditState(s: CyclingSession): EditState {
  return {
    type: s.type,
    date: toLocalDateStr(s.date),
    km: String(s.km),
    hours: String(Math.floor(s.duration_minutes / 60)),
    mins: String(s.duration_minutes % 60),
    avg_hr: s.avg_hr ? String(s.avg_hr) : '',
    kcal_burned: s.kcal_burned ? String(s.kcal_burned) : '',
    notes: s.notes ?? '',
  }
}

function EditRow({ session, onSave, onCancel, onDelete }: {
  session: CyclingSession
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
}) {
  const [form, setForm] = useState<EditState>(toEditState(session))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof EditState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const duration_minutes = (Number(form.hours) || 0) * 60 + (Number(form.mins) || 0)
      const res = await fetch(`/api/session/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          date: form.date,
          km: Number(form.km),
          duration_minutes,
          avg_hr: form.avg_hr ? Number(form.avg_hr) : null,
          kcal_burned: form.kcal_burned ? Number(form.kcal_burned) : null,
          notes: form.notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSave()
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('ลบ session นี้?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/session/${session.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      onDelete()
    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <tr className="edit-row">
      <td colSpan={9} style={{ padding: 0 }}>
        <div className="edit-row-inner">
          <div className="edit-row-top">
            <label className="edit-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <span className="edit-label" style={{ whiteSpace: 'nowrap' }}>วันที่</span>
              <input className="edit-input" type="date" value={form.date} onChange={set('date')} />
            </label>
            {error && <span className="edit-error">⚠ {error}</span>}
          </div>

          {/* Type */}
          <div className="edit-field-group">
            <span className="edit-label">Type</span>
            <div className="type-grid" style={{ marginTop: '0.25rem' }}>
              {RIDE_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  className={`type-btn ${form.type === t ? 'type-btn-active' : ''}`}
                  style={form.type === t ? {
                    borderColor: RIDE_TYPE_COLORS[t],
                    color: RIDE_TYPE_COLORS[t],
                    background: `${RIDE_TYPE_COLORS[t]}18`,
                  } : {}}
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                >{t}</button>
              ))}
            </div>
          </div>

          {/* Numeric fields */}
          <div className="edit-fields">
            <label className="edit-field">
              <span className="edit-label">Dist (km)</span>
              <input className="edit-input" type="number" step="0.1" value={form.km} onChange={set('km')} />
            </label>
            <label className="edit-field">
              <span className="edit-label">ชั่วโมง</span>
              <input className="edit-input" type="number" min="0" max="6" value={form.hours} onChange={set('hours')} />
            </label>
            <label className="edit-field">
              <span className="edit-label">นาที</span>
              <input className="edit-input" type="number" min="0" max="59" value={form.mins} onChange={set('mins')} />
            </label>
            <label className="edit-field">
              <span className="edit-label">Avg HR</span>
              <input className="edit-input" type="number" value={form.avg_hr} onChange={set('avg_hr')} placeholder="—" />
            </label>
            <label className="edit-field">
              <span className="edit-label">Kcal</span>
              <input className="edit-input" type="number" value={form.kcal_burned} onChange={set('kcal_burned')} placeholder="—" />
            </label>
          </div>

          {/* Notes */}
          <label className="edit-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem' }}>
            <span className="edit-label">Notes</span>
            <textarea className="edit-input field-textarea" value={form.notes} onChange={set('notes')} placeholder="ความรู้สึก, สภาพอากาศ…" style={{ minHeight: 48, resize: 'vertical' }} />
          </label>

          {/* Actions */}
          <div className="edit-actions">
            <button className="edit-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : '✓ บันทึก'}
            </button>
            <button className="edit-cancel-btn" onClick={onCancel}>ยกเลิก</button>
            <button className="edit-delete-btn" onClick={handleDelete} disabled={deleting}>
              {deleting ? '…' : '🗑 ลบ'}
            </button>
          </div>
        </div>
      </td>
    </tr>
  )
}

export function SessionsTable({ sessions, onRefresh }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)

  if (sessions.length === 0) {
    return (
      <div className="table-wrap">
        <h2 className="chart-title" style={{ marginBottom: '1rem' }}>Ride Sessions</h2>
        <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No sessions this week</p>
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <div className="chart-header" style={{ marginBottom: '1rem' }}>
        <h2 className="chart-title">Ride Sessions</h2>
        <span className="text-muted" style={{ fontSize: '0.72rem' }}>Goal: 40km / 1:30 (26.7 km/h)</span>
      </div>
      <div className="table-scroll">
        <table className="sessions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Dist</th>
              <th>Time</th>
              <th>Avg HR</th>
              <th>EF</th>
              <th>Speed</th>
              <th>Kcal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => editingId === s.id
              ? (
                <EditRow
                  key={s.id}
                  session={s}
                  onSave={() => { setEditingId(null); onRefresh() }}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => { setEditingId(null); onRefresh() }}
                />
              )
              : (
                <tr key={s.id} className={editingId ? 'row-dimmed' : ''}>
                  <td className="mono">{format(parseISO(s.date), 'EEE d/M')}</td>
                  <td>
                    <span className="type-pill" style={{ borderColor: RIDE_TYPE_COLORS[s.type], color: RIDE_TYPE_COLORS[s.type] }}>
                      {s.type}
                    </span>
                  </td>
                  <td className="mono val-primary">{s.km} km</td>
                  <td className="mono">{formatDuration(s.duration_minutes)}</td>
                  <td className="mono">{s.avg_hr ?? '—'} bpm</td>
                  <td className="mono">
                    <span className={`ef-val ${s.ef_score && s.ef_score >= 1.25 ? 'ef-good' : 'ef-warn'}`}>
                      {s.ef_score?.toFixed(3) ?? '—'}
                    </span>
                  </td>
                  <td><SpeedBadge km={s.km} minutes={s.duration_minutes} /></td>
                  <td className="mono text-muted">{s.kcal_burned ?? '—'}</td>
                  <td>
                    <button
                      className="row-edit-btn"
                      onClick={() => setEditingId(s.id)}
                      title="แก้ไข"
                    >✎</button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
