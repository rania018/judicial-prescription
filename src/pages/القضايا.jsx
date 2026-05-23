import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { listCases } from '../services/caseService'
import { formatArabicDate, getDaysRemaining } from '../utils/prescription'
import { getCrimeTypeLabel, getStatusLabel, TRACK_TYPE_LABELS } from '../utils/statusHelpers'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

const STATUS_FILTERS = [
  { value: 'ALL', label: 'كل الحالات' },
  { value: 'CRITICAL', label: 'خطرة (أقل من 6 أشهر)' },
  { value: 'WARNING', label: 'عاجلة (أقل من سنة)' },
  { value: 'ACTIVE', label: 'سارية / آمنة' },
  { value: 'SUSPENDED', label: 'موقوفة' },
  { value: 'EXPIRED', label: 'منتهية' },
  { value: 'NON_PRESCRIPTIBLE', label: 'لا تسقط بالتقادم' },
]

const CRIME_TYPE_FILTERS = [
  { value: 'ALL', label: 'كل الأنواع' },
  { value: 'FELONY', label: 'جناية' },
  { value: 'SIMPLE_MISDEMEANOR', label: 'جنحة بسيطة' },
  { value: 'AGGRAVATED_MISDEMEANOR', label: 'جنحة مشددة' },
  { value: 'VIOLATION', label: 'مخالفة' },
  { value: 'EXEMPTED', label: 'جرائم لا تسقط بالتقادم' },
]

export default function القضايا() {
  const location = useLocation()
  const [cases, setCases] = useState([])
  const [statusFilter, setStatusFilter] = useState(
    location.state?.statusFilter ?? 'ALL',
  )
  const [crimeTypeFilter, setCrimeTypeFilter] = useState(
    location.state?.crimeTypeFilter ?? 'ALL',
  )
  const [caseReferenceFilter, setCaseReferenceFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const { user, role, userProfile } = useAuth()

  const navigate = useNavigate()

  const loadCases = async () => {
    setLoading(true)
    try {
      const data = await listCases({
        status: statusFilter,
        caseReference: caseReferenceFilter,
        crimeType: crimeTypeFilter,
        userId: user?.uid,
        userRole: role,
        userContext: userProfile,
      })
      setCases(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCases()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, crimeTypeFilter, user?.uid, role, userProfile])

  const handleFilterSubmit = (e) => {
    e.preventDefault()
    loadCases()
  }

  const handleExportCsv = () => {
    if (!cases.length) return
    const header = [
      'رمز القضية',
      'نوع الجريمة',
      'تاريخ بدء التقادم',
      'تاريخ آخر إجراء',
      'تاريخ انتهاء التقادم',
      'الحالة',
    ]
    const rows = cases.map((c) => [
      c.caseReference ?? '',
      getCrimeTypeLabel(c.crimeType ?? ''),
      formatArabicDate(c.prescriptionStartDate),
      formatArabicDate(c.lastActionDate),
      formatArabicDate(c.prescriptionEndDate),
      getStatusLabel(c.status ?? ''),
    ])

    const escape = (value) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`

    const csv = [header, ...rows]
      .map((row) => row.map(escape).join(','))
      .join('\r\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cases-export.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.info('تم تصدير القضايا الحالية إلى ملف CSV.')
  }

  return (
    <div>
      <div className="ds-page-header">
        <div>
          <h2 className="ds-page-title">سجل القضايا</h2>
          <p className="ds-page-subtitle">
            {loading ? 'جارٍ التحميل...' : `${cases.length} قضية`}
          </p>
        </div>
        <button
          type="button"
          className="ds-btn ds-btn--secondary ds-btn--sm"
          onClick={handleExportCsv}
          disabled={loading || cases.length === 0}
        >
          تصدير CSV
        </button>
      </div>

      {/* Filter bar */}
      <div className="ds-card mb-2">
        <form onSubmit={handleFilterSubmit} className="ds-filter-bar">
          <div className="ds-form-group">
            <label className="ds-form-label" htmlFor="statusFilter">الحالة</label>
            <select
              id="statusFilter"
              className="ds-form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="ds-form-group">
            <label className="ds-form-label" htmlFor="crimeTypeFilter">نوع الجريمة</label>
            <select
              id="crimeTypeFilter"
              className="ds-form-select"
              value={crimeTypeFilter}
              onChange={(e) => setCrimeTypeFilter(e.target.value)}
            >
              {CRIME_TYPE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div className="ds-form-group ds-form-group--wide">
            <label className="ds-form-label" htmlFor="caseReferenceFilter">الرقم المرجعي</label>
            <input
              id="caseReferenceFilter"
              type="text"
              className="ds-form-input"
              placeholder="ابحث بالرقم المرجعي أو رقم القضية"
              value={caseReferenceFilter}
              onChange={(e) => setCaseReferenceFilter(e.target.value)}
            />
          </div>

          <div style={{ paddingTop: '20px' }}>
            <button type="submit" className="ds-btn ds-btn--secondary ds-btn--sm">
              تحديث النتائج
            </button>
          </div>
        </form>
      </div>

      {/* Table card */}
      <div className="ds-card">
        {loading ? (
          <div className="ds-loading">
            <div className="ds-spinner" />
            <span>جارٍ تحميل القضايا...</span>
          </div>
        ) : cases.length === 0 ? (
          <div className="ds-empty">
            <div className="ds-empty-icon">🗂</div>
            <p className="ds-empty-text">لا توجد قضايا مطابقة لمعايير البحث الحالية.</p>
          </div>
        ) : (
          <div className="ds-table-wrapper">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>الرقم المرجعي</th>
                  <th>نوع الجريمة</th>
                  <th>المسار الإجرائي</th>
                  <th>تاريخ آخر إجراء</th>
                  <th>الأجل المتبقي</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => {
                  const days = getDaysRemaining(c.prescriptionEndDate)
                  const totalDays = (() => {
                    if (!c.prescriptionStartDate || !c.prescriptionEndDate) return null
                    const start = typeof c.prescriptionStartDate?.toDate === 'function'
                      ? c.prescriptionStartDate.toDate()
                      : new Date(c.prescriptionStartDate)
                    const end = typeof c.prescriptionEndDate?.toDate === 'function'
                      ? c.prescriptionEndDate.toDate()
                      : new Date(c.prescriptionEndDate)
                    return Math.round((end - start) / 86400000)
                  })()
                  const elapsed = totalDays && days !== null ? Math.max(0, totalDays - days) : null
                  const pct = totalDays && elapsed !== null ? Math.min(100, Math.round((elapsed / totalDays) * 100)) : null
                  const barTone = pct === null ? 'safe' : pct >= 80 ? 'critical' : pct >= 60 ? 'warning' : 'safe'
                  const daysLabel = c.status === 'NON_PRESCRIPTIBLE'
                    ? 'لا تسقط'
                    : c.status === 'EXPIRED'
                      ? 'منتهي'
                      : days !== null
                        ? `${days} يوم`
                        : '—'

                  return (
                    <tr key={c.id} onClick={() => navigate(`/القضايا/${c.id}`)}>
                      <td><strong>{c.caseReference}</strong></td>
                      <td>{getCrimeTypeLabel(c.crimeType)}</td>
                      <td style={{ fontSize: '12px', color: '#6b7280' }}>
                        {TRACK_TYPE_LABELS[c.trackType] ?? c.trackType ?? '—'}
                      </td>
                      <td style={{ fontSize: '12px' }}>{formatArabicDate(c.lastActionDate)}</td>
                      <td>
                        {pct !== null ? (
                          <div className="ds-progress-cell">
                            <span className={`ds-progress-value ds-progress-value--${barTone}`}>{daysLabel}</span>
                            <div className="ds-progress-bar">
                              <div className={`ds-progress-bar__fill ds-progress-bar__fill--${barTone}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>{daysLabel}</span>
                        )}
                      </td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>
                        <button
                          type="button"
                          className="ds-btn ds-btn--ghost ds-btn--sm"
                          onClick={(e) => { e.stopPropagation(); navigate(`/القضايا/${c.id}`) }}
                          aria-label="عرض تفاصيل القضية"
                        >
                          عرض
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
