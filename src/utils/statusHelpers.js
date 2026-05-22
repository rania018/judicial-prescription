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

export const STATUS_LABELS = {
  ACTIVE: 'سارية',
  WARNING: 'تنبيه',
  URGENT: 'عاجلة',
  CRITICAL: 'حرجة',
  EXPIRED: 'منتهية',
  NON_PRESCRIPTIBLE: 'غير قابلة للتقادم',
}

export const STATUS_BADGE_CLASS = {
  ACTIVE: 'status-badge status-badge-active',
  WARNING: 'status-badge status-badge-warning',
  URGENT: 'status-badge status-badge-urgent',
  CRITICAL: 'status-badge status-badge-critical',
  EXPIRED: 'status-badge status-badge-expired',
  NON_PRESCRIPTIBLE: 'status-badge status-badge-non-prescriptible',
}

export const STATUS_CARD_CLASS = {
  ACTIVE: 'status-card status-card-active',
  WARNING: 'status-card status-card-warning',
  URGENT: 'status-card status-card-urgent',
  CRITICAL: 'status-card status-card-critical',
  EXPIRED: 'status-card status-card-expired',
  NON_PRESCRIPTIBLE: 'status-card status-card-non-prescriptible',
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
  return STATUS_LABELS[value] ?? value
}