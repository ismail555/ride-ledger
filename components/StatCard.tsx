'use client'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  accent?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

export function StatCard({ label, value, sub, accent = '#22D3AE', icon, trend }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card-inner">
        {icon && <div className="stat-icon" style={{ color: accent }}>{icon}</div>}
        <p className="stat-label">{label}</p>
        <p className="stat-value" style={{ color: accent }}>{value}</p>
        {sub && <p className="stat-sub">{sub}</p>}
      </div>
      <div className="stat-glow" style={{ background: accent }} />
    </div>
  )
}
