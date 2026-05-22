import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { listCases } from '../services/caseService'
import { formatArabicDate } from '../utils/prescription'
import { getCrimeTypeLabel, getStatusLabel } from '../utils/statusHelpers'
// @ts-ignore JSX module implemented in JS
import شارة_الحالة from '../components/شارة_الحالة.jsx'
// @ts-ignore JSX module implemented in JS
import { useToast } from '../context/ToastContext.jsx'

const STATUS_FILTERS = [
  { value: 'ALL', label: 'كل الحالات' },
  { value: 'ACTIVE', label: 'سارية' },
  { value: 'WARNING', label: 'تنبيه' },
  { value: 'URGENT', label: 'عاجلة' },
  { value: 'CRITICAL', label: 'حرجة' },
  { value: 'EXPIRED', label: 'منتهية' },
]

const CRIME_TYPE_FILTERS = [
  { value: 'ALL', label: 'كل الأنواع' },
  { value: 'FELONY', label: 'جناية' },
  { value: 'MISDEMEANOR', label: 'جنحة' },
  { value: 'VIOLATION', label: 'مخالفة' },
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
  const [caseCodeFilter, setCaseCodeFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const navigate = useNavigate()

  const loadCases = async () => {
    setLoading(true)
    try {
      const data = await listCases({
        status: statusFilter,
        caseCode: caseCodeFilter,
        crimeType: crimeTypeFilter,
      })
      setCases(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCases()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, crimeTypeFilter])

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
      c.caseCode ?? '',
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
      <div className="page-header">
        <h2 className="page-title">القضايا</h2>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">سجل القضايا</div>
            <div className="card-subtitle">
              استعراض القضايا مع إمكانية التصفية حسب الحالة والبحث برمز القضية.
            </div>
          </div>
          <div className="page-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExportCsv}
              disabled={loading || cases.length === 0}
            >
              تصدير إلى CSV
            </button>
          </div>
        </div>

        <form onSubmit={handleFilterSubmit} className="filters-row">
          <div className="form-field">
            <label className="form-label" htmlFor="statusFilter">
              الحالة
            </label>
            <select
              id="statusFilter"
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="crimeTypeFilter">
              نوع الجريمة
            </label>
            <select
              id="crimeTypeFilter"
              className="form-select"
              value={crimeTypeFilter}
              onChange={(e) => setCrimeTypeFilter(e.target.value)}
            >
              {CRIME_TYPE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="caseCodeFilter">
              رمز القضية
            </label>
            <input
              id="caseCodeFilter"
              type="text"
              className="form-input"
              value={caseCodeFilter}
              onChange={(e) => setCaseCodeFilter(e.target.value)}
            />
          </div>

          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-secondary">
              تحديث النتائج
            </button>
          </div>
        </form>

        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1rem',
            }}
          >
            <div className="spinner" />
            <span>جارٍ تحميل القضايا...</span>
          </div>
        ) : cases.length === 0 ? (
          <p className="muted" style={{ marginTop: '1rem' }}>
            لا توجد قضايا مطابقة لمعايير البحث الحالية.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>رمز القضية</th>
                  <th>نوع الجريمة</th>
                  <th>تاريخ آخر إجراء</th>
                  <th>تاريخ انتهاء التقادم</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr
                    key={c.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/القضايا/${c.id}`)}
                  >
                    <td>{c.caseCode}</td>
                    <td>{getCrimeTypeLabel(c.crimeType)}</td>
                    <td>{formatArabicDate(c.lastActionDate)}</td>
                    <td>{formatArabicDate(c.prescriptionEndDate)}</td>
                    <td>
                      <span title={getStatusLabel(c.status)}>
                        <شارة_الحالة status={c.status} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

