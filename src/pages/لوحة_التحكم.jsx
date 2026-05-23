import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Doughnut } from 'react-chartjs-2'
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
} from 'chart.js'
import { listCases } from '../services/caseService'
import { seedFakeCases } from '../utils/seedCases.js'
import { formatTodayArabic, getDaysRemaining } from '../utils/prescription'
import {
  CRIME_TYPE_LABELS,
  STATUS_ORDER,
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
import MetricCard from '../components/MetricCard.jsx'
import AlertRow from '../components/AlertRow.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import شريط_الإشعارات from '../components/شريط_الإشعارات.jsx'

ChartJS.register(ArcElement, Tooltip, Legend)

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

function getCaseDateValue(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export default function لوحة_التحكم() {
  const { user, role, userProfile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [allCases, setAllCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [seeding, setSeeding] = useState(false)
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

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const results = await seedFakeCases(user?.uid, userProfile)
      const failed = results.filter((r) => !r.ok)
      if (failed.length) {
        toast.error(`فشل إنشاء ${failed.length} ملف`)
      } else {
        toast.success(`تم إنشاء ${results.length} ملف تجريبي بنجاح`)
      }
      await load()
    } catch (err) {
      toast.error('خطأ أثناء إنشاء البيانات التجريبية')
    } finally {
      setSeeding(false)
    }
  }


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
  const nearestPrintableCase = useMemo(() => {
    const datedCases = allCases
      .map((caseData) => ({
        ...caseData,
        comparableDate: getCaseDateValue(caseData.prescriptionEndDate),
      }))
      .filter((caseData) => caseData.comparableDate)
      .sort((a, b) => a.comparableDate - b.comparableDate)

    return datedCases[0] || allCases[0] || null
  }, [allCases])

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

      if (nearestPrintableCase?.id) {
        actions.push({
          key: 'print',
          label: 'طباعة أقرب ملف',
          variant: 'secondary',
          onClick: () => navigate(`/القضايا/${nearestPrintableCase.id}/طباعة`),
        })
      }
    }

    return actions
  }, [counts.CRITICAL, counts.WARNING, navigate, nearestPrintableCase, role])

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
      <div className="ds-loading" style={{ justifyContent: 'center', padding: '60px' }}>
        <div className="ds-spinner" />
        <span>جاري تحميل بيانات مركز المتابعة...</span>
      </div>
    )
  }

  if (totalCases === 0) {
    return (
      <div className="ds-dashboard">
        <div className="ds-page-header">
          <div>
            <h2 className="ds-page-title">مركز المتابعة والتنبيهات</h2>
            <p className="ds-page-subtitle">{formatTodayArabic()}</p>
          </div>
        </div>
        <div className="ds-card">
          <div className="ds-empty">
            <div className="ds-empty-icon">⚖</div>
            <p className="ds-empty-text">
              لا توجد قضايا متاحة حالياً — سيظهر مركز المتابعة بمجرد توفر ملفات ضمن نطاق صلاحياتك.
            </p>
            <div className="gap-row mt-2">
              {role === 'CLERK' && (
                <button type="button" className="ds-btn ds-btn--primary" onClick={() => navigate('/إنشاء-قضية')}>
                  تسجيل قضية جديدة
                </button>
              )}
              <button type="button" className="ds-btn ds-btn--secondary" onClick={() => navigate('/القضايا')}>
                فتح سجل القضايا
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Donut chart data ──────────────────────────────────────
  const donutColors = {
    CRITICAL: '#C0392B',
    WARNING: '#D4A017',
    ACTIVE: '#1e8449',
    SUSPENDED: '#7d3c98',
    EXPIRED: '#555555',
  }
  const donutData = {
    labels: STATUS_ORDER.filter((k) => k !== 'NON_PRESCRIPTIBLE').map(getStatusLabel),
    datasets: [
      {
        data: STATUS_ORDER.filter((k) => k !== 'NON_PRESCRIPTIBLE').map((k) => counts[k] ?? 0),
        backgroundColor: STATUS_ORDER.filter((k) => k !== 'NON_PRESCRIPTIBLE').map(
          (k) => donutColors[k] || '#ccc',
        ),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }
  const donutOptions = {
    cutout: '68%',
    plugins: { legend: { display: false }, tooltip: { rtl: true } },
    maintainAspectRatio: true,
  }

  // ─── Top 5 nearest expiry ──────────────────────────────────
  const nearestFive = [...allCases]
    .filter((c) => c.prescriptionEndDate && c.status !== 'NON_PRESCRIPTIBLE')
    .sort((a, b) => {
      const da = typeof a.prescriptionEndDate?.toDate === 'function'
        ? a.prescriptionEndDate.toDate()
        : new Date(a.prescriptionEndDate)
      const db = typeof b.prescriptionEndDate?.toDate === 'function'
        ? b.prescriptionEndDate.toDate()
        : new Date(b.prescriptionEndDate)
      return da - db
    })
    .slice(0, 5)

  // ─── Bar chart max ─────────────────────────────────────────
  const maxCrimeCount = Math.max(...Object.values(crimeTypeCounts), 1)

  return (
    <div className="ds-dashboard">
      {/* Page header */}
      <div className="ds-page-header">
        <div>
          <h2 className="ds-page-title">مركز المتابعة والتنبيهات</h2>
          <p className="ds-page-subtitle">{formatTodayArabic()} &nbsp;·&nbsp; {dashboardCopy.label}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="ds-btn ds-btn--secondary ds-btn--sm"
            onClick={load}
            disabled={loading}
          >
            تحديث البيانات
          </button>
          {import.meta.env.DEV && (
            <button
              type="button"
              className="ds-btn ds-btn--secondary ds-btn--sm"
              style={{ opacity: 0.7, fontSize: '12px' }}
              onClick={handleSeed}
              disabled={seeding}
            >
              {seeding ? '⏳ جارٍ الإضافة...' : '🧪 بيانات تجريبية'}
            </button>
          )}
        </div>
      </div>

      <شريط_الإشعارات banner={banner} />

      {/* Metrics row — 6 cards */}
      <div className="ds-metrics-row">
        <MetricCard label="إجمالي الملفات" value={totalCases} variant="neutral" />
        <MetricCard label={role === 'CLERK' ? 'ملفات حرجة' : 'تنبيهات حمراء'} value={counts.CRITICAL || 0} variant="critical" />
        <MetricCard label="متابعة خلال سنة" value={counts.WARNING || 0} variant="warning" />
        <MetricCard label="ملفات آمنة" value={counts.ACTIVE || 0} variant="safe" />
        <MetricCard label="ملفات موقوفة" value={counts.SUSPENDED || 0} variant="suspended" />
        <MetricCard label="ملفات منتهية" value={counts.EXPIRED || 0} variant="expired" />
      </div>

      {/* Main 2-col grid */}
      <div className="ds-dashboard-grid">

        {/* LEFT COL — alerts + crime bar chart + shortcuts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Alerts panel */}
          <div className="ds-card">
            <div className="ds-card-header">
              <div>
                <div className="ds-card-title">{dashboardCopy.alertsTitle}</div>
                <div className="ds-card-subtitle">{dashboardCopy.alertsSubtitle}</div>
              </div>
              {alerts.length > 0 && (
                <button
                  type="button"
                  className="ds-btn ds-btn--secondary ds-btn--sm"
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
              <div className="ds-safe-summary">
                <span>✓</span>
                <span>لا توجد تنبيهات — جميع الملفات في وضع آمن أو حالات خاصة.</span>
              </div>
            ) : (
              <>
                {alerts.slice(0, 6).map((alert) => (
                  <AlertRow
                    key={alert.id}
                    status={alert.status}
                    caseReference={alert.caseReference}
                    daysRemaining={getDaysRemaining(alert.prescriptionEndDate ?? null)}
                    onClick={() => navigate(alert.to.pathname)}
                  />
                ))}
                {(counts.ACTIVE || 0) > 0 && (
                  <div className="ds-safe-summary mt-1">
                    <span>✓</span>
                    <span>{counts.ACTIVE} ملف آمن</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Crime type bar chart */}
          <div className="ds-card">
            <div className="ds-card-header">
              <div>
                <div className="ds-card-title">توزيع حسب نوع الجريمة</div>
                <div className="ds-card-subtitle">انقر على الشريط للانتقال إلى الملفات المصفّاة</div>
              </div>
            </div>
            {CRIME_TYPES.map((ct) => (
              <button
                key={ct}
                type="button"
                style={{ display: 'contents', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => navigate('/القضايا', { state: { crimeTypeFilter: ct } })}
              >
                <div className="ds-bar-chart-row">
                  <span className="ds-bar-chart-label">{CRIME_TYPE_LABELS[ct]}</span>
                  <div className="ds-bar-chart-bar">
                    <div
                      className="ds-bar-chart-fill"
                      style={{ width: `${((crimeTypeCounts[ct] ?? 0) / maxCrimeCount) * 100}%` }}
                    />
                  </div>
                  <span className="ds-bar-chart-count">{crimeTypeCounts[ct] ?? 0}</span>
                </div>
              </button>
            ))}

            {role === 'CLERK' && (
              <div className="ds-shortcut-grid">
                <button type="button" className="ds-shortcut" onClick={() => navigate('/إنشاء-قضية')}>
                  <strong>تسجيل ملف جديد</strong>
                  <span>فتح نموذج الإنشاء</span>
                </button>
                <button type="button" className="ds-shortcut" onClick={() => navigate('/القضايا')}>
                  <strong>بحث واستعراض</strong>
                  <span>تصفية القضايا</span>
                </button>
                {nearestPrintableCase?.id && (
                  <button
                    type="button"
                    className="ds-shortcut"
                    onClick={() => navigate(`/القضايا/${nearestPrintableCase.id}/طباعة`)}
                  >
                    <strong>طباعة أقرب ملف</strong>
                    <span>الأقرب انتهاءً</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COL — donut chart + nearest expiry table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Donut chart */}
          <div className="ds-card">
            <div className="ds-card-header">
              <div>
                <div className="ds-card-title">توزيع الحالات</div>
                <div className="ds-card-subtitle">توزيع {totalCases} ملف حسب حالة التقادم</div>
              </div>
            </div>
            <div className="ds-donut-container">
              <Doughnut data={donutData} options={donutOptions} />
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
              {STATUS_ORDER.filter((k) => k !== 'NON_PRESCRIPTIBLE').map((k) => (
                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6b7280' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: donutColors[k], display: 'inline-block' }} />
                  {getStatusLabel(k)} ({counts[k] ?? 0})
                </span>
              ))}
              {(counts.NON_PRESCRIPTIBLE ?? 0) > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6b7280' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a6b9e', display: 'inline-block' }} />
                  {getStatusLabel('NON_PRESCRIPTIBLE')} ({counts.NON_PRESCRIPTIBLE})
                </span>
              )}
            </div>
          </div>

          {/* Nearest expiry table */}
          <div className="ds-card">
            <div className="ds-card-header">
              <div>
                <div className="ds-card-title">أقرب الملفات انتهاءً</div>
                <div className="ds-card-subtitle">أبرز 5 ملفات بحسب تاريخ السقوط</div>
              </div>
              <button
                type="button"
                className="ds-link-btn"
                onClick={() => navigate('/القضايا')}
              >
                عرض الكل
              </button>
            </div>
            {nearestFive.length === 0 ? (
              <p className="muted" style={{ fontSize: '13px', padding: '8px 0' }}>لا توجد ملفات ذات أجل محدد.</p>
            ) : (
              <div className="ds-table-wrapper">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>الملف</th>
                      <th>الأجل المتبقي</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nearestFive.map((c) => (
                      <tr key={c.id} onClick={() => navigate(`/القضايا/${c.id}`)} style={{ cursor: 'pointer' }}>
                        <td><strong>{c.caseReference}</strong></td>
                        <td style={{ fontSize: '12px' }}>
                          {formatRemainingLabel(getDaysRemaining(c.prescriptionEndDate), c.status)}
                        </td>
                        <td><StatusBadge status={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
