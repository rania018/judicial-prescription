import {
  STATUS_BADGE_CLASS,
  getStatusDescription,
  getStatusLabel,
  normalizeStatus,
} from '../utils/statusHelpers'

export default function شارة_الحالة({ status }) {
  if (!status) return null
  const normalizedStatus = normalizeStatus(status)
  const cls = STATUS_BADGE_CLASS[normalizedStatus] ?? 'status-badge'
  return (
    <span className={cls} title={getStatusDescription(normalizedStatus)}>
      {getStatusLabel(normalizedStatus)}
    </span>
  )
}