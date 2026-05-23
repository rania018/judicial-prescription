// AlertRow — urgency alert row with dot, file number, days, badge
import StatusBadge from './StatusBadge.jsx'

export default function AlertRow({ status, caseReference, daysRemaining, onClick }) {
  const tone = status === 'CRITICAL' ? 'critical' : 'warning'
  const daysText =
    daysRemaining === null
      ? 'لا تسقط بالتقادم'
      : daysRemaining <= 0
        ? 'انتهى الأجل'
        : `متبقٍّ ${daysRemaining} يوم`

  return (
    <div
      className={`ds-alert-row ds-alert-row--${tone}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className={`ds-alert-row__dot ds-alert-row__dot--${tone}`} />
      <span className="ds-alert-row__ref">{caseReference}</span>
      <span className="ds-alert-row__days">{daysText}</span>
      <StatusBadge status={status} />
    </div>
  )
}
