// StatusBadge — pill badge for case status
import {
  getStatusLabel,
  getStatusDescription,
  normalizeStatus,
} from '../utils/statusHelpers'

const STATUS_CLASS = {
  ACTIVE: 'ds-badge ds-badge--active',
  WARNING: 'ds-badge ds-badge--warning',
  URGENT: 'ds-badge ds-badge--urgent',
  CRITICAL: 'ds-badge ds-badge--critical',
  SUSPENDED: 'ds-badge ds-badge--suspended',
  EXPIRED: 'ds-badge ds-badge--expired',
  NON_PRESCRIPTIBLE: 'ds-badge ds-badge--non-prescriptible',
}

export default function StatusBadge({ status }) {
  if (!status) return null
  const normalized = normalizeStatus(status)
  const cls = STATUS_CLASS[normalized] ?? 'ds-badge'
  return (
    <span className={cls} title={getStatusDescription(normalized)}>
      {getStatusLabel(normalized)}
    </span>
  )
}
