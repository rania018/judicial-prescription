// MetricCard — colored right-border metric card
export default function MetricCard({ label, value, variant }) {
  return (
    <div className={`ds-metric-card ds-metric-card--${variant}`}>
      <span className="ds-metric-card__label">{label}</span>
      <span className="ds-metric-card__value">{value}</span>
    </div>
  )
}
