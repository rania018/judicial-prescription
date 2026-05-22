import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listCases } from '../services/caseService'
import { formatTodayArabic, getDaysRemaining } from '../utils/prescription'
import {
  CRIME_TYPE_LABELS,
  STATUS_CARD_CLASS,
  STATUS_ORDER,
  getStatusDescription,
  getStatusLabel,
} from '../utils/statusHelpers'
import {
  buildCaseAlerts,
  buildNotificationBanner,
  formatRemainingLabel,
  getRoleDashboardCopy,
} from '../utils/dashboardAlerts'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import شارة_الحالة from '../components/شارة_الحالة.jsx'
import شريط_الإشعارات from '../components/شريط_الإشعارات.jsx'

const CRIME_TYPES = [
  'FELONY',
  'SIMPLE_MISDEMEANOR',
  'AGGRAVATED_MISDEMEANOR',
  'VIOLATION',
  'EXEMPTED',
]

function buildStatusCounts(cases) {
  return STATUS_ORDER.reduce(
    (acc, key) => ({
      ...acc,
      [key]: cases.filter((caseData) => caseData.status === key).length,
    }),
    {},
  )
}

function getLastUpdatedText(lastUpdated) {
  if (!lastUpdated) return ''
  const sec = Math.floor((Date.now() - lastUpdated) / 1000)
  if (sec < 60) return 'آخر تحديث منذ لحظات'
  if (sec < 3600) return `آخر تحديث منذ ${Math.floor(sec / 60)} دقيقة`
  return `آخر تحديث منذ ${Math.floor(sec / 3600)} ساعة`
}

export default function لوحة_التحكم() {
  const { user, role, userProfile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [allCases, setAllCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [notifiedHighPriority, setNotifiedHighPriority] = useState(false)
  const [notifiedFollowUp, setNotifiedFollowUp] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const cases = await listCases({
        userId: user?.uid,
        userRole: role,
        userContext: userProfile,
      })
      setAllCases(cases)
      setLastUpdated(Date.now())
    } finally {
      setLoading(false)
    }
  }, [role, user?.uid, userProfile])

  useEffect(() => {
    load()
  }, [load])

  const totalCases = allCases.length
  const counts = useMemo(() => buildStatusCounts(allCases), [allCases])
  const alerts = useMemo(() => buildCaseAlerts(allCases, role), [allCases, role])
  const dashboardCopy = useMemo(() => getRoleDashboardCopy(role), [role])
  const banner = useMemo(
    () => buildNotificationBanner({ role, alerts, counts }),
    [alerts, counts, role],
  )
  const crimeTypeCounts = useMemo(
    () =>
      CRIME_TYPES.reduce((acc, key) => {
        acc[key] = allCases.filter((caseData) => caseData.crimeType === key).length
        return acc
      }, {}),
    [allCases],
  )

  const summaryMetrics = useMemo(
    () => [
      { key: 'TOTAL', label: 'إجمالي الملفات', value: totalCases, tone: 'neutral' },
      {
        key: 'CRITICAL',
        label: role === 'CLERK' ? 'ملفات حرجة' : 'تنبيهات حمراء',
        value: counts.CRITICAL || 0,
        tone: 'danger',
      },
      {
        key: 'WARNING',
        label: 'متابعة خلال سنة',
        value: counts.WARNING || 0,
        tone: 'warning',
      },
      {
        key: 'ACTIVE',
        label: 'ملفات آمنة',
        value: counts.ACTIVE || 0,
        tone: 'safe',
      },
      {
        key: 'SUSPENDED',
        label: 'ملفات موقوفة',
        value: counts.SUSPENDED || 0,
        tone: 'info',
      },
      {
        key: 'EXPIRED',
        label: 'ملفات منتهية',
        value: counts.EXPIRED || 0,
        tone: 'muted',
      },
    ],
    [counts, role, totalCases],
  )

  const quickActions = useMemo(() => {
    const actions = [
      {
        key: 'all',
        label: 'عرض كل القضايا',
        variant: 'secondary',
        onClick: () => navigate('/القضايا'),
      },
    ]

    if (counts.CRITICAL > 0) {
      actions.push({
        key: 'critical',
        label:
          role === 'CLERK'
            ? `الملفات الحرجة (${counts.CRITICAL})`
            : `القضايا الحرجة (${counts.CRITICAL})`,
        variant: 'critical',
        onClick: () => navigate('/القضايا', { state: { statusFilter: 'CRITICAL' } }),
      })
    }

    if (counts.WARNING > 0) {
      actions.push({
        key: 'warning',
        label: `متابعة خلال سنة (${counts.WARNING})`,
        variant: 'warning',
        onClick: () => navigate('/القضايا', { state: { statusFilter: 'WARNING' } }),
      })
    }

    if (role === 'CLERK') {
      actions.push(
        {
          key: 'create',
          label: 'تسجيل قضية جديدة',
          variant: 'primary',
          onClick: () => navigate('/إنشاء-قضية'),
        },
        {
          key: 'search',
          label: 'بحث سريع في القضايا',
          variant: 'secondary',
          onClick: () => navigate('/القضايا'),
        },
      )

      if (allCases[0]?.id) {
        actions.push({
          key: 'print',
          label: 'طباعة أقرب ملف',
          variant: 'secondary',
          onClick: () => navigate(`/القضايا/${allCases[0].id}/طباعة`),
        })
      }
    }

    return actions
  }, [allCases, counts.CRITICAL, counts.WARNING, navigate, role])

  useEffect(() => {
    if (!loading && !notifiedHighPriority && (counts.CRITICAL || 0) > 0) {
      toast.error(
        role === 'CLERK'
          ? `يوجد ${counts.CRITICAL} ملفات حرجة تحتاج تنسيقاً سريعاً.`
          : `يوجد ${counts.CRITICAL} ملفات حرجة تحتاج متابعة فورية.`,
      )
      setNotifiedHighPriority(true)
    }

    if (!loading && !notifiedFollowUp && (counts.WARNING || 0) > 0) {
      toast.info(`يوجد ${counts.WARNING} ملفات تحتاج متابعة خلال سنة.`)
      setNotifiedFollowUp(true)
    }
  }, [
    counts.CRITICAL,
    counts.WARNING,
    loading,
    notifiedFollowUp,
    notifiedHighPriority,
    role,
    toast,
  ])

  if (loading) {
    return (
      <div className="dashboard">
        <div className="card dashboard-loading">
          <div className="dashboard-loading-inner">
            <div className="spinner" />
            <span>جاري تحميل بيانات مركز المتابعة...</span>
          </div>
        </div>
      </div>
    )
  }

  if (totalCases === 0) {
    return (
      <div className="dashboard">
        <div className="page-header page-header--dashboard">
          <div>
            <h2 className="page-title">مركز المتابعة والتنبيهات</h2>
            <p className="dashboard-date muted">{formatTodayArabic()}</p>
          </div>
        </div>

        <div className="card dashboard-empty">
          <div className="dashboard-empty-content">
            <h3 className="dashboard-empty-title">لا توجد قضايا متاحة حالياً</h3>
            <p className="dashboard-empty-text muted">
              سيظهر مركز المتابعة والتنبيهات بمجرد توفر قضايا ضمن نطاق الصلاحيات الحالي.
            </p>
            {role === 'CLERK' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate('/إنشاء-قضية')}
              >
                تسجيل قضية جديدة
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/القضايا')}
            >
              فتح سجل القضايا
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="page-header page-header--dashboard">
        <div>
          <h2 className="page-title">مركز المتابعة والتنبيهات</h2>
          <p className="dashboard-date muted">{formatTodayArabic()}</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={load}
          disabled={loading}
          aria-label="تحديث بيانات مركز المتابعة"
        >
          {loading ? (
            <>
              <span className="spinner" />
              <span>جاري التحديث...</span>
            </>
          ) : (
            'تحديث البيانات'
          )}
        </button>
      </div>

      <شريط_الإشعارات banner={banner} />

      <section className="card dashboard-hero">
        <div className="dashboard-hero__copy">
          <span className="dashboard-hero__eyebrow">{dashboardCopy.label}</span>
          <h3 className="dashboard-hero__title">{dashboardCopy.title}</h3>
          <p className="dashboard-hero__text">{dashboardCopy.description}</p>
          {lastUpdated != null && <p className="dashboard-meta muted">{getLastUpdatedText(lastUpdated)}</p>}
        </div>

        <div className="dashboard-quick-actions">
          {quickActions.map((action) => (
            <button
              key={action.key}
              type="button"
              className={`dashboard-quick-action dashboard-quick-action--${action.variant}`}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-metrics">
        {summaryMetrics.map((metric) => (
          <div
            key={metric.key}
            className={`dashboard-metric-card dashboard-metric-card--${metric.tone}`}
          >
            <span className="dashboard-metric-card__label">{metric.label}</span>
            <strong className="dashboard-metric-card__value">{metric.value}</strong>
          </div>
        ))}
      </section>

      <div className="dashboard-grid">
        <div className="dashboard-grid__main">
          <section className="card dashboard-panel">
            <div className="card-header dashboard-panel__header">
              <div>
                <div className="card-title">{dashboardCopy.alertsTitle}</div>
                <div className="card-subtitle">{dashboardCopy.alertsSubtitle}</div>
              </div>
              {alerts.length > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    navigate('/القضايا', {
                      state: { statusFilter: alerts[0].priority === 'high' ? 'CRITICAL' : 'WARNING' },
                    })
                  }
                >
                  فتح القائمة
                </button>
              )}
            </div>

            {alerts.length === 0 ? (
              <div className="dashboard-empty-state">
                <h4>لا توجد تنبيهات حمراء أو صفراء حالياً</h4>
                <p className="muted">
                  جميع الملفات الحالية في وضع آمن أو ضمن حالات خاصة مثل الوقف أو الانتهاء.
                </p>
              </div>
            ) : (
              <div className="dashboard-alert-list">
                {alerts.slice(0, 8).map((alert) => (
                  <button
                    key={alert.id}
                    type="button"
                    className={`dashboard-alert-card dashboard-alert-card--${alert.tone}`}
                    onClick={() => navigate(alert.to.pathname)}
                  >
                    <div className="dashboard-alert-card__header">
                      <div>
                        <strong className="dashboard-alert-card__reference">
                          {alert.caseReference}
                        </strong>
                        <p className="dashboard-alert-card__title">{alert.title}</p>
                      </div>
                      <شارة_الحالة status={alert.status} />
                    </div>
                    <p className="dashboard-alert-card__description">{alert.description}</p>
                    <div className="dashboard-alert-card__meta">
                      <span>{alert.remainingLabel}</span>
                      <span>تاريخ السقوط: {alert.dueDateLabel}</span>
                      <span>{alert.accessLabel}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {role === 'CLERK' && (
            <section className="card dashboard-panel">
              <div className="card-header dashboard-panel__header">
                <div>
                  <div className="card-title">اختصارات تشغيلية</div>
                  <div className="card-subtitle">
                    مهام يومية سريعة لمباشرة التسجيل والبحث والطباعة دون الدخول في إجراء قضائي.
                  </div>
                </div>
              </div>

              <div className="dashboard-shortcuts">
                <button type="button" className="dashboard-shortcut" onClick={() => navigate('/إنشاء-قضية')}>
                  <strong>تسجيل ملف جديد</strong>
                  <span>فتح نموذج الإنشاء مباشرة</span>
                </button>
                <button type="button" className="dashboard-shortcut" onClick={() => navigate('/القضايا')}>
                  <strong>بحث واستعراض</strong>
                  <span>تصفية القضايا حسب الحالة أو رقم الملف</span>
                </button>
                {allCases[0]?.id && (
                  <button
                    type="button"
                    className="dashboard-shortcut"
                    onClick={() => navigate(`/القضايا/${allCases[0].id}/طباعة`)}
                  >
                    <strong>طباعة ملف قريب الأجل</strong>
                    <span>فتح صفحة الطباعة للملف الأقرب انتهاءً</span>
                  </button>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="dashboard-grid__side">
          <section className="card dashboard-panel">
            <div className="card-header dashboard-panel__header">
              <div>
                <div className="card-title">حالات التقادم بالألوان</div>
                <div className="card-subtitle">
                  تصنيف موحد بين لوحة التحكم وملفات القضايا وفق منطق الأحمر / الأصفر / الأخضر.
                </div>
              </div>
            </div>

            <div className="dashboard-status-cards">
              {STATUS_ORDER.map((statusKey) => (
                <button
                  key={statusKey}
                  type="button"
                  className={`dashboard-status-card ${STATUS_CARD_CLASS[statusKey]}`}
                  onClick={() => navigate('/القضايا', { state: { statusFilter: statusKey } })}
                >
                  <span className="dashboard-status-card__label">{getStatusLabel(statusKey)}</span>
                  <strong className="dashboard-status-card__count">{counts[statusKey] ?? 0}</strong>
                  <span className="dashboard-status-card__hint">
                    {getStatusDescription(statusKey)}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="card dashboard-panel">
            <div className="card-header dashboard-panel__header">
              <div>
                <div className="card-title">توزيع حسب نوع الجريمة</div>
                <div className="card-subtitle">
                  انتقال سريع إلى السجل المصفّى وفق التكييف الجزائي.
                </div>
              </div>
            </div>

            <div className="dashboard-crime-grid">
              {CRIME_TYPES.map((crimeType) => (
                <button
                  key={crimeType}
                  type="button"
                  className="dashboard-crime-card"
                  onClick={() =>
                    navigate('/القضايا', { state: { crimeTypeFilter: crimeType } })
                  }
                >
                  <span>{CRIME_TYPE_LABELS[crimeType]}</span>
                  <strong>{crimeTypeCounts[crimeType] ?? 0}</strong>
                </button>
              ))}
            </div>
          </section>

          <section className="card dashboard-panel">
            <div className="card-header dashboard-panel__header">
              <div>
                <div className="card-title">أقرب الملفات انتهاءً</div>
                <div className="card-subtitle">
                  مراجعة سريعة للحالات الأقرب إلى تاريخ السقوط مع نفس منطق الألوان.
                </div>
              </div>
            </div>

            <div className="dashboard-compact-list">
              {allCases.slice(0, 5).map((caseData) => (
                <button
                  key={caseData.id}
                  type="button"
                  className="dashboard-compact-list__item"
                  onClick={() => navigate(`/القضايا/${caseData.id}`)}
                >
                  <div>
                    <strong>{caseData.caseReference}</strong>
                    <p className="dashboard-compact-list__meta">
                      {formatRemainingLabel(
                        getDaysRemaining(caseData.prescriptionEndDate),
                        caseData.status,
                      )}
                    </p>
                  </div>
                  <شارة_الحالة status={caseData.status} />
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
