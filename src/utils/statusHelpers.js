import dayjs from 'dayjs'
import { getDaysRemaining } from './prescription'

export const CRIME_TYPE_LABELS = {
  FELONY: 'جناية',
  SIMPLE_MISDEMEANOR: 'جنحة بسيطة',
  AGGRAVATED_MISDEMEANOR: 'جنحة مشددة',
  VIOLATION: 'مخالفة',
  EXEMPTED: 'جرائم لا تسقط بالتقادم',
}

export const TRACK_TYPE_LABELS = {
  PROSECUTION: 'مرحلة المتابعة الجزائية',
  PENALTY_EXECUTION: 'مرحلة تنفيذ العقوبة',
}

export const JUDICIAL_AUTHORITY_LABELS = {
  COURT: 'محكمة',
  COUNCIL: 'مجلس قضائي',
}

export const JUDICIAL_OFFICER_LABELS = {
  PROSECUTOR: 'وكيل الجمهورية',
  COURT_PRESIDENT: 'رئيس المحكمة',
  INVESTIGATING_JUDGE: 'قاضي التحقيق',
  JUVENILE_JUDGE: 'قاضي الأحداث',
  SENTENCING_JUDGE: 'قاضي الحكم',
  ATTORNEY_GENERAL: 'النائب العام',
  COUNCIL_PRESIDENT: 'رئيس المجلس',
  INDICTMENT_CHAMBER_PRESIDENT: 'رئيس غرفة الاتهام',
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
  HIDDEN: 'جريمة خفية / مخفية',
  EQUAL_TO_SENTENCE: 'مدة التقادم مساوية لمدة العقوبة',
  CUSTOM: 'مدة تقادم خاصة (مخصصة)',
}

export const NON_PRESCRIPTIBLE_CATEGORIES = [
  { value: 'TERRORISM', label: 'الجرائم الإرهابية والتخريبية (جنايات وجنح)' },
  { value: 'STATE_SECURITY', label: 'جنايات أمن الدولة' },
  { value: 'ORGANIZED_CRIME', label: 'جرائم الجريمة المنظمة العابرة للحدود' },
  { value: 'CORRUPTION', label: 'جرائم الفساد بكافة صورها' },
  { value: 'EMBEZZLEMENT_ABROAD', label: 'جرائم اختلاس الأموال العمومية (مع تحويل العائدات للخارج)' },
]

export const NON_PRESCRIPTIBLE_CATEGORY_LABELS = Object.fromEntries(
  NON_PRESCRIPTIBLE_CATEGORIES.map(({ value, label }) => [value, label]),
)

export const INDICTMENT_BRANCH_GROUPS = [
  { value: 'MISDEMEANOR_CASES', label: 'نافذة القضايا الجنحية' },
  { value: 'CRIMINAL_CASES', label: 'نافذة القضايا الجنائية' },
  { value: 'CRIMINAL_COURT', label: 'نافذة محكمة الجنايات' },
]

export const INDICTMENT_BRANCH_OPTIONS = {
  MISDEMEANOR_CASES: [
    { value: 'MISDEMEANOR_ADULT', label: 'قضايا جنحية للبالغين' },
    { value: 'MISDEMEANOR_JUVENILE', label: 'قضايا جنحية للأحداث' },
  ],
  CRIMINAL_CASES: [
    { value: 'CRIMINAL_JUVENILE_COUNCIL_SEAT', label: 'قضايا جنائية للأحداث (محكمة مقر المجلس)' },
  ],
  CRIMINAL_COURT: [
    { value: 'CRIMINAL_COURT_FIRST_INSTANCE', label: 'محكمة الجنايات الابتدائية' },
    { value: 'CRIMINAL_COURT_APPEAL', label: 'محكمة الجنايات الاستئنافية' },
  ],
}

export const INDICTMENT_BRANCH_LABELS = Object.fromEntries(
  Object.values(INDICTMENT_BRANCH_OPTIONS)
    .flat()
    .filter((option) => option?.value && option?.label)
    .map(({ value, label }) => [value, label]),
)

export const INTERRUPTION_TYPE_LABELS = {
  INVESTIGATION: 'إجراءات البحث والتحري (الضبطية)',
  PROSECUTION: 'إجراءات مباشرة الدعوى العمومية (النيابة)',
  JUDICIAL_INVESTIGATION: 'إجراءات التحقيق القضائي (قاضي التحقيق)',
  TRIAL: 'إجراءات المحاكمة',
}

export const STATUS_META = {
  ACTIVE: {
    label: 'سارية / آمنة',
    description: 'أكثر من سنة متبقية على انتهاء الأجل',
    badgeClass: 'status-badge status-badge-active',
    cardClass: 'status-card status-card-active',
    tone: 'safe',
  },
  WARNING: {
    label: 'عاجلة',
    description: 'بين 6 أشهر و12 شهراً متبقية على انتهاء الأجل',
    badgeClass: 'status-badge status-badge-warning',
    cardClass: 'status-card status-card-warning',
    tone: 'warning',
  },
  CRITICAL: {
    label: 'خطرة',
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
    label: 'لا تسقط بالتقادم',
    description: 'هذا الملف لا يخضع لآجال التقادم (جرائم لا تسقط بالتقادم)',
    badgeClass: 'status-badge status-badge-non-prescriptible',
    cardClass: 'status-card status-card-non-prescriptible',
    tone: 'info',
  },
}

const LEGACY_STATUS_ALIASES = {
  URGENT: 'WARNING',
}

export const STATUS_LABELS = {
  ...Object.fromEntries(Object.entries(STATUS_META).map(([key, value]) => [key, value.label])),
  URGENT: STATUS_META.WARNING.label,
}

export const STATUS_BADGE_CLASS = {
  ...Object.fromEntries(
    Object.entries(STATUS_META).map(([key, value]) => [key, value.badgeClass]),
  ),
  URGENT: STATUS_META.WARNING.badgeClass,
}

export const STATUS_CARD_CLASS = {
  ...Object.fromEntries(Object.entries(STATUS_META).map(([key, value]) => [key, value.cardClass])),
  URGENT: STATUS_META.WARNING.cardClass,
}

export const STATUS_ORDER = [
  'CRITICAL',
  'WARNING',
  'ACTIVE',
  'SUSPENDED',
  'EXPIRED',
  'NON_PRESCRIPTIBLE',
]

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

export function getJudicialOfficerLabel(value) {
  return JUDICIAL_OFFICER_LABELS[value] ?? value
}

export function getJudicialAuthorityLabel(value) {
  return JUDICIAL_AUTHORITY_LABELS[value] ?? value
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

export function getNonPrescriptibleCategoryLabel(value) {
  return NON_PRESCRIPTIBLE_CATEGORY_LABELS[value] ?? value
}

export function getIndictmentBranchLabel(value) {
  return INDICTMENT_BRANCH_LABELS[value] ?? value
}

export function getInterruptionTypeLabel(value) {
  return INTERRUPTION_TYPE_LABELS[value] ?? value
}

export function getStatusLabel(value) {
  const normalized = normalizeStatus(value)
  return STATUS_LABELS[normalized] ?? value
}