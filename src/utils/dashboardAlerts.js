import { formatArabicDate, getDaysRemaining } from './prescription'
import {
  getStatusDescription,
  getStatusLabel,
  getStatusTone,
  isPriorityStatus,
  isUrgentStatus,
  normalizeStatus,
} from './statusHelpers'
import { normalizeRole, ROLES } from './rbacHelper'

const ROLE_COPY = {
  [ROLES.CLERK]: {
    label: 'واجهة تشغيلية',
    title: 'متابعة تشغيلية للقضايا والملفات',
    description:
      'اختصارات العمل اليومي مع مؤشرات رقابية تساعدك على البحث والطباعة وتنسيق الملفات التي تحتاج متابعة.',
    alertsTitle: 'ملفات بحاجة إلى تنسيق إداري',
    alertsSubtitle: 'هذه القائمة تساعدك على فتح الملفات الأكثر حساسية بسرعة دون تحويلها إلى إجراء قضائي.',
  },
  [ROLES.JUDGE]: {
    label: 'مركز إجراءات القاضي',
    title: 'قضايا تتطلب إجراءً قضائياً أو متابعة عاجلة',
    description:
      'اعرض القضايا المكلّف بها حسب مستوى الخطورة، وابدأ مباشرة من الملفات الأقرب لانتهاء الأجل.',
    alertsTitle: 'القضايا العاجلة الموكلة إليك',
    alertsSubtitle: 'ترتيب تنازلي حسب مستوى الخطورة ثم قرب تاريخ انتهاء الأجل.',
  },
  [ROLES.PUBLIC_PROSECUTOR]: {
    label: 'مركز رقابة النيابة',
    title: 'تنبيهات رقابية على مستوى المحكمة',
    description:
      'اعرض القضايا عالية الخطورة داخل نطاق المحكمة بصياغة إشرافية تسمح بالمتابعة دون كسر صلاحيات الوصول.',
    alertsTitle: 'التنبيهات الرقابية داخل نطاق المحكمة',
    alertsSubtitle: 'الملفات تظهر بصيغة قراءة أو تصرف وفق صلاحياتك الحالية ونطاق الإشراف.',
  },
  [ROLES.ATTORNEY_GENERAL]: {
    label: 'مركز إشراف المحامي العام',
    title: 'تنبيهات إشرافية على مستوى المجلس',
    description:
      'متابعة أوسع للملفات الحرجة والملفات التي تحتاج متابعة خلال سنة على مستوى المجلس القضائي.',
    alertsTitle: 'التنبيهات الإشرافية ضمن نطاق المجلس',
    alertsSubtitle: 'الترتيب يبرز الملفات الحرجة أولاً ثم الملفات التي تتطلب متابعة وقائية.',
  },
}

function getRoleSpecificPrefix(role) {
  switch (normalizeRole(role)) {
    case ROLES.JUDGE:
      return 'قضية تتطلب اتخاذ إجراء'
    case ROLES.PUBLIC_PROSECUTOR:
    case ROLES.ATTORNEY_GENERAL:
      return 'ملف يحتاج متابعة رقابية'
    case ROLES.CLERK:
      return 'ملف يحتاج تنسيقاً إدارياً'
    default:
      return 'ملف يحتاج متابعة'
  }
}

export function formatRemainingLabel(daysRemaining, status) {
  const normalizedStatus = normalizeStatus(status)
  if (normalizedStatus === 'NON_PRESCRIPTIBLE') return 'غير خاضعة للتقادم'
  if (normalizedStatus === 'SUSPENDED') return 'الأجل موقوف حالياً'
  if (daysRemaining === null) return 'غير متاح'
  if (daysRemaining < 0) return `منتهية منذ ${Math.abs(daysRemaining)} يوم`
  if (daysRemaining === 0) return 'ينتهي الأجل اليوم'
  if (daysRemaining === 1) return 'ينتهي الأجل غداً'
  return `متبقي ${daysRemaining} يوم`
}

function sortAlerts(cases) {
  const priorityWeight = {
    CRITICAL: 0,
    WARNING: 1,
    ACTIVE: 2,
    SUSPENDED: 3,
    EXPIRED: 4,
    NON_PRESCRIPTIBLE: 5,
  }

  return [...cases].sort((a, b) => {
    const statusDiff =
      (priorityWeight[normalizeStatus(a.status)] ?? 99) -
      (priorityWeight[normalizeStatus(b.status)] ?? 99)
    if (statusDiff !== 0) return statusDiff
    const daysA = getDaysRemaining(a.prescriptionEndDate) ?? Number.MAX_SAFE_INTEGER
    const daysB = getDaysRemaining(b.prescriptionEndDate) ?? Number.MAX_SAFE_INTEGER
    if (daysA !== daysB) return daysA - daysB
    const referenceA = a.caseReference || ''
    const referenceB = b.caseReference || ''
    return referenceA.localeCompare(referenceB, 'ar')
  })
}

export function getRoleDashboardCopy(role) {
  return ROLE_COPY[normalizeRole(role)] ?? ROLE_COPY[ROLES.JUDGE]
}

export function buildCaseAlerts(cases = [], role) {
  return sortAlerts(cases)
    .filter((caseData) => isPriorityStatus(caseData.status))
    .map((caseData) => {
      const status = normalizeStatus(caseData.status)
      const daysRemaining = getDaysRemaining(caseData.prescriptionEndDate)
      return {
        id: caseData.id,
        caseId: caseData.id,
        caseReference: caseData.caseReference || 'بدون رقم',
        status,
        statusLabel: getStatusLabel(status),
        tone: getStatusTone(status),
        priority: isUrgentStatus(status) ? 'high' : 'medium',
        title: `${getRoleSpecificPrefix(role)}: ${caseData.caseReference}`,
        description: getStatusDescription(status),
        dueDateLabel: formatArabicDate(caseData.prescriptionEndDate),
        remainingLabel: formatRemainingLabel(daysRemaining, status),
        accessLabel:
          normalizeRole(role) === ROLES.JUDGE
            ? caseData.isEditable
              ? 'قابل للتصرف'
              : 'اطلاع فقط'
            : normalizeRole(role) === ROLES.CLERK
              ? 'متابعة تشغيلية'
              : 'اطلاع رقابي',
        to: { pathname: `/القضايا/${caseData.id}` },
      }
    })
}

export function buildNotificationBanner({ role, alerts, counts }) {
  const urgentCount = alerts.filter((alert) => alert.priority === 'high').length
  const warningCount = alerts.filter((alert) => alert.priority === 'medium').length
  const normalizedRole = normalizeRole(role)

  if (urgentCount === 0 && warningCount === 0) return null

  const isUrgent = urgentCount > 0
  const tone = isUrgent ? 'danger' : 'warning'
  const statusFilter = isUrgent ? 'CRITICAL' : 'WARNING'

  if (normalizedRole === ROLES.JUDGE) {
    return {
      tone,
      title: isUrgent ? 'تنبيه قضائي عاجل' : 'متابعة قضائية مطلوبة',
      message: isUrgent
        ? `لديك ${urgentCount} قضايا حرجة تتطلب اتخاذ إجراء قبل انتهاء الأجل خلال أقل من 6 أشهر.`
        : `لديك ${warningCount} قضايا تحتاج متابعة وقائية خلال مدة لا تتجاوز سنة.`,
      actionLabel: isUrgent ? 'فتح القضايا الحرجة' : 'فتح القضايا الصفراء',
      actionState: { statusFilter },
    }
  }

  if (normalizedRole === ROLES.CLERK) {
    return {
      tone,
      title: isUrgent ? 'تنسيق إداري عاجل' : 'متابعة تشغيلية',
      message: isUrgent
        ? `يوجد ${urgentCount} ملفات حرجة تحتاج تنسيقاً سريعاً مع الجهات المختصة قبل اقتراب السقوط.`
        : `يوجد ${warningCount} ملفات ضمن المتابعة السنوية، مع ${counts.ACTIVE || 0} ملفات آمنة حالياً.`,
      actionLabel: 'فتح سجل القضايا',
      actionState: { statusFilter },
    }
  }

  return {
    tone,
    title: normalizedRole === ROLES.ATTORNEY_GENERAL ? 'تنبيه إشرافي' : 'تنبيه رقابي',
    message: isUrgent
      ? `يوجد ${urgentCount} ملفات حرجة ضمن نطاق الإشراف الحالي وتحتاج متابعة فورية.`
      : `يوجد ${warningCount} ملفات تحتاج متابعة خلال سنة ضمن نطاق الإشراف الحالي.`,
    actionLabel: isUrgent ? 'استعراض الملفات الحرجة' : 'استعراض ملفات المتابعة',
    actionState: { statusFilter },
  }
}
