import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listCases } from '../services/caseService'
import {
  formatArabicDate,
  formatTodayArabic,
  getDaysRemaining,
} from '../utils/prescription'
import {
  CRIME_TYPE_LABELS,
  STATUS_CARD_CLASS,
  getStatusLabel,
} from '../utils/statusHelpers'
// @ts-ignore JSX module implemented in JS
import شارة_الحالة from '../components/شارة_الحالة.jsx'
// @ts-ignore JSX module implemented in JS
import { useAuth } from '../context/AuthContext.jsx'
// @ts-ignore JSX module implemented in JS
import { useToast } from '../context/ToastContext.jsx'

const STATUS_KEYS = ['ACTIVE', 'WARNING', 'URGENT', 'CRITICAL', 'EXPIRED']
const CRIME_TYPES = ['FELONY', 'MISDEMEANOR', 'VIOLATION']
const EXPIRING_DAYS = 7

export default function لوحة_التحكم() {
  const { role } = useAuth()
  const [counts, setCounts] = useState({
    ACTIVE: 0,
    WARNING: 0,
    URGENT: 0,
    CRITICAL: 0,
    EXPIRED: 0,
  })
  const [allCases, setAllCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [notifiedExpiring, setNotifiedExpiring] = useState(false)
  const [notifiedCritical, setNotifiedCritical] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const cases = await listCases({})
      setAllCases(cases)
      const nextCounts = { ACTIVE: 0, WARNING: 0, URGENT: 0, CRITICAL: 0, EXPIRED: 0 }
      STATUS_KEYS.forEach((key) => {
        nextCounts[key] = cases.filter((c) => c.status === key).length
      })
      setCounts(nextCounts)
      setLastUpdated(Date.now())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const totalCases = allCases.length
  const needsAttention = (counts.WARNING || 0) + (counts.URGENT || 0) + (counts.CRITICAL || 0)
  const attentionCases = allCases.filter((c) => c.status === 'CRITICAL' || c.status === 'URGENT')

  const crimeTypeCounts = CRIME_TYPES.reduce((acc, key) => {
    acc[key] = allCases.filter((c) => c.crimeType === key).length
    return acc
  }, {})

  const expiringSoon = allCases
    .map((c) => ({ ...c, daysLeft: getDaysRemaining(c.prescriptionEndDate) }))
    .filter((c) => c.daysLeft !== null && c.daysLeft >= 0 && c.daysLeft <= EXPIRING_DAYS)
    .sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999))
    .slice(0, 10)

  const getLastUpdatedText = () => {
    if (!lastUpdated) return ''
    const sec = Math.floor((Date.now() - lastUpdated) / 1000)
    if (sec < 60) return 'منذ لحظات'
    if (sec < 3600) return `منذ ${Math.floor(sec / 60)} دقيقة`
    return `منذ ${Math.floor(sec / 3600)} ساعة`
  }

  useEffect(() => {
    if (!loading && !notifiedExpiring && expiringSoon.length > 0) {
      toast.info(
        `هناك ${expiringSoon.length} قضية تنتهي آجال التقادم الخاصة بها خلال ${EXPIRING_DAYS} أيام.`,
      )
      setNotifiedExpiring(true)
    }
    if (!loading && !notifiedCritical && counts.CRITICAL > 0) {
      toast.error(
        `تنبيه هام: هناك ${counts.CRITICAL} قضية في حالة حرجة من حيث آجال التقادم.`,
      )
      setNotifiedCritical(true)
    }
  }, [
    loading,
    expiringSoon.length,
    counts.CRITICAL,
    notifiedExpiring,
    notifiedCritical,
    toast,
  ])

  return (
    <div className="dashboard">
      <div className="page-header page-header--dashboard">
        <div>
          <h2 className="page-title">الواجهة الرئيسية للنظام</h2>
          <p className="dashboard-date muted">{formatTodayArabic()}</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={load}
          disabled={loading}
          aria-label="تحديث البيانات"
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

      {loading ? (
        <div className="card dashboard-loading">
          <div className="dashboard-loading-inner">
            <div className="spinner" />
            <span>جاري تحميل بيانات القضايا...</span>
          </div>
        </div>
      ) : totalCases === 0 ? (
        <div className="card dashboard-empty">
          <div className="dashboard-empty-content">
            <h3 className="dashboard-empty-title">لا توجد قضايا مسجّلة</h3>
            <p className="dashboard-empty-text muted">
              لم يتم تسجيل أي قضية في النظام بعد. يمكنك البدء بتسجيل أول قضية من خلال
              سجل القضايا.
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
              عرض سجل القضايا
            </button>
          </div>
        </div>
      ) : (
        <>
          {lastUpdated != null && (
            <p className="dashboard-meta muted">{getLastUpdatedText()}</p>
          )}

          <div className="dashboard-quick-actions">
            <button
              type="button"
              className="dashboard-quick-action"
              onClick={() => navigate('/القضايا')}
            >
              عرض كل القضايا
            </button>
            {counts.CRITICAL > 0 && (
              <button
                type="button"
                className="dashboard-quick-action dashboard-quick-action--critical"
                onClick={() =>
                  navigate('/القضايا', { state: { statusFilter: 'CRITICAL' } })
                }
              >
                القضايا الحرجة ({counts.CRITICAL})
              </button>
            )}
            {role === 'CLERK' && (
              <button
                type="button"
                className="dashboard-quick-action dashboard-quick-action--primary"
                onClick={() => navigate('/إنشاء-قضية')}
              >
                تسجيل قضية جديدة
              </button>
            )}
          </div>

          <div className="dashboard-summary">
            <div className="dashboard-summary-item">
              <span className="dashboard-summary-value">{totalCases}</span>
              <span className="dashboard-summary-label">إجمالي القضايا</span>
            </div>
            <div className="dashboard-summary-divider" />
            <div className="dashboard-summary-item dashboard-summary-item--attention">
              <span className="dashboard-summary-value">{needsAttention}</span>
              <span className="dashboard-summary-label">قضايا تحتاج متابعة</span>
            </div>
          </div>

          <div className="dashboard-sections">
            <div className="dashboard-section-col">
              <section className="dashboard-section">
                <h3 className="dashboard-section-title">توزيع حسب نوع الجريمة</h3>
                <div className="dashboard-cards dashboard-cards--crime">
                  {CRIME_TYPES.map((key) => (
                    <div
                      key={key}
                      className="dashboard-card dashboard-card--crime"
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        navigate('/القضايا', { state: { crimeTypeFilter: key } })
                      }
                      onKeyDown={(e) =>
                        e.key === 'Enter' &&
                        navigate('/القضايا', { state: { crimeTypeFilter: key } })
                      }
                    >
                      <span className="dashboard-card-label">
                        {CRIME_TYPE_LABELS[key]}
                      </span>
                      <span className="dashboard-card-count">
                        {crimeTypeCounts[key] ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="dashboard-section">
                <h3 className="dashboard-section-title">توزيع القضايا حسب حالة التقادم</h3>
                <div className="dashboard-cards">
                  {STATUS_KEYS.map((statusKey) => (
                    <div
                      key={statusKey}
                      className={`dashboard-card ${STATUS_CARD_CLASS[statusKey]}`}
                    >
                      <div className="dashboard-card-body">
                        <span className="dashboard-card-label">
                          {getStatusLabel(statusKey)}
                        </span>
                        <span className="dashboard-card-count">
                          {counts[statusKey] ?? 0}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="dashboard-card-action"
                        onClick={() =>
                          navigate('/القضايا', { state: { statusFilter: statusKey } })
                        }
                      >
                        عرض القضايا
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="dashboard-section-col">
              {expiringSoon.length > 0 && (
                <section className="dashboard-section">
                  <h3 className="dashboard-section-title">
                    تنتهي خلال {EXPIRING_DAYS} أيام
                  </h3>
                  <div className="card">
                    <div className="dashboard-table-wrap">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>رمز القضية</th>
                            <th>تاريخ انتهاء التقادم</th>
                            <th>المتبقي</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {expiringSoon.map((c) => (
                            <tr key={c.id}>
                              <td>{c.caseReference}</td>
                              <td>{formatArabicDate(c.prescriptionEndDate)}</td>
                              <td>
                                <span
                                  className={
                                    c.daysLeft === 0
                                      ? 'dashboard-days-critical'
                                      : 'dashboard-days-warning'
                                  }
                                >
                                  {c.daysLeft === 0
                                    ? 'ينتهي اليوم'
                                    : c.daysLeft === 1
                                      ? 'غداً'
                                      : `باقي ${c.daysLeft} أيام`}
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => navigate(`/القضايا/${c.id}`)}
                                >
                                  عرض
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              )}

              {attentionCases.length > 0 && (
                <section className="dashboard-section">
                  <h3 className="dashboard-section-title">
                    قضايا تحتاج متابعة فورية
                  </h3>
                  <div className="card">
                    <div className="dashboard-table-wrap">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>رمز القضية</th>
                            <th>تاريخ انتهاء التقادم</th>
                            <th>الحالة</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {attentionCases.slice(0, 10).map((c) => (
                            <tr key={c.id}>
                              <td>{c.caseReference}</td>
                              <td>{formatArabicDate(c.prescriptionEndDate)}</td>
                              <td>
                                <شارة_الحالة status={c.status} />
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => navigate(`/القضايا/${c.id}`)}
                                >
                                  عرض التفاصيل
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {attentionCases.length > 10 && (
                      <p className="dashboard-more muted">
                        عرض أول 10 قضايا. للاطلاع على الكل استخدم سجل القضايا مع تصفية
                        الحالة.
                      </p>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
