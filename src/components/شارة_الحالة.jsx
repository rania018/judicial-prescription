import { STATUS_BADGE_CLASS, getStatusLabel } from '../utils/statusHelpers'

export default function شارة_الحالة({ status }) {
  if (!status) return null
  const cls = STATUS_BADGE_CLASS[status] ?? 'status-badge'
  return <span className={cls}>{getStatusLabel(status)}</span>
}