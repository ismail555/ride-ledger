'use client'

import { useEffect, useRef, useState } from 'react'
import type { AppleWorkout } from '@/types'

interface Props {
  onSynced: () => void
  apiKey: string
}

// ── Parse Apple Health export.xml in the browser ──────────────────────────────
function parseHealthXML(xmlText: string): AppleWorkout[] {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml')
  const nodes = doc.querySelectorAll(
    'Workout[workoutActivityType="HKWorkoutActivityTypeCycling"]'
  )

  return Array.from(nodes)
    .map(w => {
      const startDate = w.getAttribute('startDate') ?? ''
      const date = startDate.slice(0, 10) // "2026-06-22"

      const durationRaw = parseFloat(w.getAttribute('duration') ?? '0')
      const durationUnit = w.getAttribute('durationUnit') ?? 'min'
      const duration_minutes = Math.round(
        durationUnit === 'min' ? durationRaw : durationRaw / 60
      )

      const distRaw = parseFloat(w.getAttribute('totalDistance') ?? '0')
      const distUnit = (w.getAttribute('totalDistanceUnit') ?? 'km').toLowerCase()
      const distance_km = Math.round(
        (distUnit === 'km' ? distRaw : distRaw * 1.60934) * 10
      ) / 10

      const kcalRaw = parseFloat(w.getAttribute('totalEnergyBurned') ?? '0')
      const kcal_burned = kcalRaw > 0 ? Math.round(kcalRaw) : null

      const hrStats = w.querySelector(
        'WorkoutStatistics[type="HKQuantityTypeIdentifierHeartRate"]'
      )
      const avg_hr = hrStats
        ? Math.round(parseFloat(hrStats.getAttribute('average') ?? '0')) || null
        : null

      // UUID = startDate ISO as deterministic ID
      const apple_health_uuid = startDate.replace(/\s/g, 'T').replace(/[^0-9T+:]/g, '')
        || `${date}-${duration_minutes}`

      const sourceName = w.getAttribute('sourceName') ?? ''
      const workout_type = sourceName.toLowerCase().includes('watch')
        ? 'Outdoor Cycling (Apple Watch)'
        : 'Cycling'

      return { apple_health_uuid, date, duration_minutes, distance_km, avg_hr, kcal_burned, workout_type }
    })
    .filter(w => w.date && w.duration_minutes > 0 && w.distance_km > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
}

// ── Tab: iOS Shortcut instructions ────────────────────────────────────────────
function ShortcutTab({ apiKey }: { apiKey: string }) {
  const [copied, setCopied] = useState<string | null>(null)
  const [baseUrl, setBaseUrl] = useState('')
  useEffect(() => { setBaseUrl(window.location.origin) }, [])

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  const apiUrl = `${baseUrl}/api/apple/sync`

  return (
    <div className="shortcut-guide">
      <p className="guide-intro">
        ตั้ง Shortcut ครั้งเดียว — หลัง workout กด Run Shortcut ข้อมูลจาก Apple Watch จะ sync มาทันที
      </p>

      <div className="guide-steps">
        <div className="guide-step">
          <div className="step-num">1</div>
          <div>
            <p className="step-title">เปิด Shortcuts app บน iPhone</p>
            <p className="step-desc">สร้าง Shortcut ใหม่ → กด + ที่มุมบนขวา</p>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-num">2</div>
          <div>
            <p className="step-title">เพิ่ม Actions ตามลำดับ</p>
            <div className="action-list">
              <div className="action-item">
                <span className="action-tag">Health</span>
                <span>Find Workouts <b>where Activity = Cycling</b>, sorted by Start Date descending, limit 10</span>
              </div>
              <div className="action-item">
                <span className="action-tag">Scripting</span>
                <span>Repeat with each item in <b>Workouts</b></span>
              </div>
              <div className="action-item" style={{ paddingLeft: '1.5rem' }}>
                <span className="action-tag">Scripting</span>
                <span>Set Variable <b>workout_data</b> = Dictionary:<br/>
                  <code>apple_health_uuid</code> → Repeat Item &gt; UUID<br/>
                  <code>date</code> → Repeat Item &gt; Start Date (format: yyyy-MM-dd)<br/>
                  <code>duration_minutes</code> → Repeat Item &gt; Duration (in minutes)<br/>
                  <code>distance_km</code> → Repeat Item &gt; Distance (km)<br/>
                  <code>avg_hr</code> → Repeat Item &gt; Average Heart Rate<br/>
                  <code>kcal_burned</code> → Repeat Item &gt; Active Energy (kcal)<br/>
                  <code>workout_type</code> → "Outdoor Cycling"
                </span>
              </div>
              <div className="action-item" style={{ paddingLeft: '1.5rem' }}>
                <span className="action-tag">Scripting</span>
                <span>Add <b>workout_data</b> to Variable <b>all_workouts</b></span>
              </div>
              <div className="action-item">
                <span className="action-tag">Web</span>
                <span>Get Contents of <b>URL</b> (POST, JSON body = <code>{`{"workouts": all_workouts}`}</code>)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-num">3</div>
          <div>
            <p className="step-title">ใส่ URL และ API Key</p>
            <div className="copy-row">
              <div className="copy-field">
                <span className="copy-label">API URL</span>
                <code className="copy-val">{apiUrl}</code>
              </div>
              <button className="copy-btn" onClick={() => copy(apiUrl, 'url')}>
                {copied === 'url' ? '✓' : 'Copy'}
              </button>
            </div>
            <div className="copy-row" style={{ marginTop: '0.5rem' }}>
              <div className="copy-field">
                <span className="copy-label">Header: x-api-key</span>
                <code className="copy-val">{apiKey || '(ตั้งใน .env.local)'}</code>
              </div>
              <button className="copy-btn" onClick={() => copy(apiKey, 'key')}>
                {copied === 'key' ? '✓' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-num">4</div>
          <div>
            <p className="step-title">เพิ่มใน Back Tap (ทางเลือก)</p>
            <p className="step-desc">Settings → Accessibility → Touch → Back Tap → Double Tap → เลือก Shortcut นี้<br/>
              <span style={{ color: 'var(--teal)' }}>แค่เคาะหลัง iPhone 2 ครั้งหลัง workout = sync ทันที</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Health Export XML import ─────────────────────────────────────────────
function XMLImportTab({ apiKey, onSynced }: { apiKey: string; onSynced: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [parsing, setParsing] = useState(false)
  const [workouts, setWorkouts] = useState<AppleWorkout[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setParsing(true)
    setWorkouts(null)
    setError(null)
    setResult(null)

    try {
      let xmlText: string
      if (file.name.endsWith('.zip')) {
        setError('กรุณาเปิด ZIP แล้วเลือกไฟล์ export.xml โดยตรงครับ')
        setParsing(false)
        return
      }
      xmlText = await file.text()
      const parsed = parseHealthXML(xmlText)
      if (parsed.length === 0) {
        setError('ไม่พบ Cycling workout ใน export.xml นี้')
        setParsing(false)
        return
      }
      setWorkouts(parsed)
      setSelected(new Set(parsed.map(w => w.apple_health_uuid)))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setParsing(false)
    }
  }

  function toggleAll() {
    if (!workouts) return
    if (selected.size === workouts.length) setSelected(new Set())
    else setSelected(new Set(workouts.map(w => w.apple_health_uuid)))
  }

  async function handleImport() {
    if (!workouts) return
    const toImport = workouts.filter(w => selected.has(w.apple_health_uuid))
    setImporting(true)
    setError(null)
    try {
      const res = await fetch('/api/apple/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({ workouts: toImport }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(`✓ Import แล้ว ${data.synced} workouts`)
      onSynced()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="xml-import">
      <p className="guide-intro">
        iPhone → Health app → รูปโปรไฟล์ → Export All Health Data → แตกไฟล์ → เลือก <code>export.xml</code>
      </p>

      <div
        className="xml-drop-zone"
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".xml" style={{ display: 'none' }} onChange={handleFile} />
        {parsing
          ? <><div className="btn-spinner" style={{ width: 16, height: 16 }} />กำลัง parse XML…</>
          : <><span style={{ fontSize: '1.1rem' }}>📂</span>เลือก export.xml</>
        }
      </div>

      {error && <p className="form-error" style={{ marginTop: '0.75rem' }}>⚠ {error}</p>}

      {workouts && (
        <>
          <div className="xml-list-header">
            <span className="xml-found">พบ {workouts.length} Cycling workouts</span>
            <button className="xml-toggle-all" onClick={toggleAll}>
              {selected.size === workouts.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div className="xml-list">
            {workouts.map(w => (
              <label key={w.apple_health_uuid} className={`xml-row ${selected.has(w.apple_health_uuid) ? 'xml-row-sel' : ''}`}>
                <input
                  type="checkbox"
                  checked={selected.has(w.apple_health_uuid)}
                  onChange={e => {
                    const s = new Set(selected)
                    e.target.checked ? s.add(w.apple_health_uuid) : s.delete(w.apple_health_uuid)
                    setSelected(s)
                  }}
                  className="xml-check"
                />
                <span className="xml-date">{w.date}</span>
                <span className="xml-km">{w.distance_km} km</span>
                <span className="xml-dur">{Math.floor(w.duration_minutes / 60)}h {w.duration_minutes % 60}m</span>
                <span className="xml-hr">{w.avg_hr ? `${w.avg_hr} bpm` : '—'}</span>
                <span className="xml-kcal">{w.kcal_burned ? `${w.kcal_burned} kcal` : '—'}</span>
              </label>
            ))}
          </div>

          {result
            ? <p className="sync-ok" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', marginTop: '0.75rem' }}>{result}</p>
            : (
              <button
                className="save-btn"
                style={{ marginTop: '0.75rem' }}
                disabled={importing || selected.size === 0}
                onClick={handleImport}
              >
                {importing ? 'Importing…' : `Import ${selected.size} workouts`}
              </button>
            )
          }
        </>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export function AppleHealthSync({ onSynced, apiKey }: Props) {
  const [tab, setTab] = useState<'shortcut' | 'xml'>('shortcut')
  const [open, setOpen] = useState(false)

  return (
    <div className="apple-sync-wrap">
      <div className="apple-sync-header" style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div className="apple-sync-title">
          <span className="apple-icon"> </span>
          <span>Apple Watch Sync</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {open && (
            <div className="apple-tabs" onClick={e => e.stopPropagation()}>
              <button
                className={`apple-tab ${tab === 'shortcut' ? 'apple-tab-active' : ''}`}
                onClick={() => setTab('shortcut')}
              >iOS Shortcut</button>
              <button
                className={`apple-tab ${tab === 'xml' ? 'apple-tab-active' : ''}`}
                onClick={() => setTab('xml')}
              >Health Export</button>
            </div>
          )}
          <span className="apple-toggle-icon">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        tab === 'shortcut'
          ? <ShortcutTab apiKey={apiKey} />
          : <XMLImportTab apiKey={apiKey} onSynced={onSynced} />
      )}
    </div>
  )
}
