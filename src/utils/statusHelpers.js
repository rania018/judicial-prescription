import dayjs from 'dayjs'
import { getDaysRemaining } from './prescription'

export const CRIME_TYPE_LABELS = {
  FELONY: 'جناية',
  SIMPLE_MISDEMEANOR: 'جنحة بسيطة',
  AGGRAVATED_MISDEMEANOR: 'جنحة مشددة',
  VIOLATION: 'مخالفة',
  EXEMPTED: 'مستثنى من السقوط',
}

export const TRACK_TYPE_LABELS = {
  PROSECUTION: 'مرحلة المتابعة الجزائية',
  PENALTY_EXECUTION: 'مرحلة تنفيذ العقوبة',
}

export const CASE_STAGE_LABELS = {
  PROSECUTION: 'مرحلة المتابعة الجزائية',
  SENTENCE: 'مرحلة الحكم',
}

export const ACTION_TYPE_LABELS = {
  INVESTIGATION: 'إجراء تحقيق',
  REFERRAL: 'إحالة',
  INTERROGATION: 'استجواب',
  APPEAL: 'استئناف',
}

export const SEVERITY_LEVEL_LABELS = {
  HIDDEN: 'مخفية',
  EQUAL_TO_SENTENCE: 'مساوية لمدة العقوبة',
  CUSTOM: 'مدة تخصيص العقوبة',
}

export const INTERRUPTION_TYPE_LABELS = {
  INVESTIGATION: 'إجراءات البحث والتحري (الضبطية)',
  PROSECUTION: 'إجراءات مباشرة الدعوى العمومية (النيابة)',
  JUDICIAL_INVESTIGATION: 'إجراءات التحقيق القضائي (قاضي التحقيق)',
  TRIAL: 'إجراءات المحاكمة',
}

export const STATUS_META = {
  ACTIVE: {
    label: 'آمنة',
    description: 'أكثر من سنة متبقية على انتهاء الأجل',
    badgeClass: 'status-badge status-badge-active',
    cardClass: 'status-card status-card-active',
    tone: 'safe',
  },
  WARNING: {
    label: 'متابعة خلال سنة',
    description: 'بين 6 أشهر و12 شهراً متبقية على انتهاء الأجل',
    badgeClass: 'status-badge status-badge-warning',
    cardClass: 'status-card status-card-warning',
    tone: 'warning',
  },
  CRITICAL: {
    label: 'حرجة خلال أقل من 6 أشهر',
    description: 'أقل من 6 أشهر متبقية على انتهاء الأجل',
    badgeClass: 'status-badge status-badge-critical',
    cardClass: 'status-card status-card-critical',
    tone: 'danger',
  },
  SUSPENDED: {
    label: 'موقوفة',
    description: 'الأجل موقوف مؤقتاً بسبب سبب وقف نشط',
    badgeClass: 'status-badge status-badge-suspended',
    cardClass: 'status-card status-card-suspended',
    tone: 'info',
  },
  EXPIRED: {
    label: 'منتهية',
    description: 'انقضى أجل التقادم لهذه القضية',
    badgeClass: 'status-badge status-badge-expired',
    cardClass: 'status-card status-card-expired',
    tone: 'neutral',
  },
  NON_PRESCRIPTIBLE: {
    label: 'غير خاضعة للتقادم',
    description: 'هذا الملف لا يخضع لآجال التقادم',
    badgeClass: 'status-badge status-badge-non-prescriptible',
    cardClass: 'status-card status-card-non-prescriptible',
    tone: 'info',
  },
}

const LEGACY_STATUS_ALIASES = {
  URGENT: 'WARNING',
}

export const STATUS_LABELS = Object.fromEntries(
  Object.entries(STATUS_META).map(([key, value]) => [key, value.label]),
)

export const STATUS_BADGE_CLASS = Object.fromEntries(
  Object.entries(STATUS_META).map(([key, value]) => [key, value.badgeClass]),
)

export const STATUS_CARD_CLASS = Object.fromEntries(
  Object.entries(STATUS_META).map(([key, value]) => [key, value.cardClass]),
)

export const STATUS_ORDER = [
  'CRITICAL',
  'WARNING',
  'ACTIVE',
  'SUSPENDED',
  'EXPIRED',
  'NON_PRESCRIPTIBLE',
]

STATUS_LABELS.URGENT = STATUS_LABELS.WARNING
STATUS_BADGE_CLASS.URGENT = STATUS_BADGE_CLASS.WARNING
STATUS_CARD_CLASS.URGENT = STATUS_CARD_CLASS.WARNING

function toDateValue(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function normalizeStatus(value) {
  if (!value) return value
  return LEGACY_STATUS_ALIASES[value] ?? value
}

export function hasActiveSuspension(suspensionHistory = []) {
  return suspensionHistory.some((entry) => entry && !entry.endDate)
}

export function getCaseStatus(prescriptionEndDate, suspensionHistory = []) {
  if (prescriptionEndDate === null) return 'NON_PRESCRIPTIBLE'
  if (hasActiveSuspension(suspensionHistory)) return 'SUSPENDED'

  const daysRemaining = getDaysRemaining(prescriptionEndDate)
  if (daysRemaining === null) return 'ACTIVE'
  if (daysRemaining <= 0) return 'EXPIRED'

  const endDate = toDateValue(prescriptionEndDate)
  if (!endDate) return 'ACTIVE'

  const today = dayjs().startOf('day')
  const criticalBoundary = today.add(6, 'month')
  const warningBoundary = today.add(1, 'year')
  const end = dayjs(endDate).startOf('day')

  if (end.isBefore(criticalBoundary) || end.isSame(criticalBoundary, 'day')) {
    return 'CRITICAL'
  }

  if (end.isBefore(warningBoundary) || end.isSame(warningBoundary, 'day')) {
    return 'WARNING'
  }

  return 'ACTIVE'
}

export function getStatusMeta(value) {
  const normalized = normalizeStatus(value)
  return STATUS_META[normalized] ?? null
}

export function getStatusDescription(value) {
  return getStatusMeta(value)?.description ?? ''
}

export function getStatusTone(value) {
  return getStatusMeta(value)?.tone ?? 'neutral'
}

export function isPriorityStatus(value) {
  return ['CRITICAL', 'WARNING'].includes(normalizeStatus(value))
}

export function isUrgentStatus(value) {
  return normalizeStatus(value) === 'CRITICAL'
}

export function getCrimeTypeLabel(value) {
  return CRIME_TYPE_LABELS[value] ?? value
}

export function getTrackTypeLabel(value) {
  return TRACK_TYPE_LABELS[value] ?? value
}

export function getCaseStageLabel(value) {
  return (value && CASE_STAGE_LABELS[value]) || value || '—'
}

export function getActionTypeLabel(value) {
  return ACTION_TYPE_LABELS[value] ?? value
}

export function getSeverityLevelLabel(value) {
  return SEVERITY_LEVEL_LABELS[value] ?? value
}

export function getInterruptionTypeLabel(value) {
  return INTERRUPTION_TYPE_LABELS[value] ?? value
}

export function getStatusLabel(value) {
  const normalized = normalizeStatus(value)
  return STATUS_LABELS[normalized] ?? normalized ?? value
}