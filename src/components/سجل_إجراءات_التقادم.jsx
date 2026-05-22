import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getInterruptionTypeLabel } from '../utils/statusHelpers'
import { formatArabicDate } from '../utils/prescription'
import نموذج_إجراء from './نموذج_إجراء'

export default function سجل_إجراءات_التقادم({
  caseId,
  caseData,
  userRole,
  canEditCase,
  onAddInterruption,
  onAddSuspension,
  onResumeSuspension,
}) {
  const [showActionPanel, setShowActionPanel] = useState(false)
  const [showInterruptionForm, setShowInterruptionForm] = useState(false)
  const [showSuspensionForm, setShowSuspensionForm] = useState(false)
  const [showResumeForm, setShowResumeForm] = useState(false)
  const [resumeDate, setResumeDate] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const interruptions = caseData.interruptionHistory || []
  const suspensions = caseData.suspensionHistory || []
  const activeSuspension = suspensions.find((s) => !s.endDate)

  const historyEntries = useMemo(() => {
    const interruptionEntries = interruptions.map((entry) => ({
      id: `interrupt-${entry.id || entry.date}`,
      date: entry.date,
      type: 'INTERRUPTION',
      label: 'انقطاع',
      details: getInterruptionTypeLabel(entry.type),
      by: entry.performedByName || entry.performedBy || '—',
      notes: entry.notes || '—',
    }))

    const suspensionEntries = suspensions.flatMap((entry) => {
      const started = {
        id: `susp-start-${entry.id || entry.startDate}`,
        date: entry.startDate,
        type: 'SUSPENSION_START',
        label: 'وقف',
        details: entry.reason || '—',
        by: entry.suspendedByName || entry.suspendedBy || '—',
        notes: entry.notes || '—',
      }

      if (!entry.endDate) {
        return [started]
      }

      return [
        started,
        {
          id: `susp-resume-${entry.id || entry.endDate}`,
          date: entry.endDate,
          type: 'SUSPENSION_RESUME',
          label: 'تفعيل الأجل',
          details: 'استئناف سريان التقادم بعد زوال المانع',
          by: entry.resumedByName || entry.resumedBy || '—',
          notes: '—',
        },
      ]
    })

    return [...interruptionEntries, ...suspensionEntries].sort((a, b) => {
      const aTime = new Date(a.date).getTime()
      const bTime = new Date(b.date).getTime()
      return bTime - aTime
    })
  }, [interruptions, suspensions])

  const handleAddInterruption = (interruptionData) => {
    onAddInterruption(interruptionData)
    setShowInterruptionForm(false)
    setShowActionPanel(false)
  }

  const handleAddSuspension = (suspensionData) => {
    onAddSuspension(suspensionData)
    setShowSuspensionForm(false)
    setShowActionPanel(false)
  }

  const handleResumeSuspension = () => {
    if (!resumeDate || !activeSuspension) return

    if (new Date(resumeDate) < new Date(activeSuspension.startDate)) {
      alert('تاريخ التفعيل يجب أن يكون بعد تاريخ بدء الوقف.')
      return
    }

    onResumeSuspension({
      actionDate: new Date(resumeDate),
    })
    setShowResumeForm(false)
    setResumeDate('')
  }

  const canShowActionButtons =
    canEditCase && caseData.status !== 'EXPIRED' && caseData.status !== 'NON_PRESCRIPTIBLE'

  return (
    <div className="prescription-actions-log">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">10) سجل الإجراءات</h3>
        </div>
        <div className="card-body">
          {!canEditCase && (
            <p className="muted" style={{ marginBottom: '0.75rem' }}>
              هذا الحساب في وضع الاطلاع فقط لهذه القضية، ولا يمكنه اتخاذ إجراء قضائي.
            </p>
          )}

          <div className="form-actions mb-4" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {canShowActionButtons && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setShowActionPanel((prev) => !prev)
                  setShowInterruptionForm(false)
                  setShowSuspensionForm(false)
                }}
              >
                {showActionPanel ? 'إخفاء' : 'اتخاذ إجراء'}
              </button>
            )}

            {activeSuspension && canShowActionButtons && (
              <button
                type="button"
                className="btn btn-success"
                onClick={() => setShowResumeForm((prev) => !prev)}
              >
                {showResumeForm ? 'إلغاء' : 'تفعيل الأجل'}
              </button>
            )}

            <Link to={`/القضايا/${caseId}/طباعة`} className="btn btn-secondary">
              طباعة
            </Link>
          </div>

          {showActionPanel && canShowActionButtons && (
            <div className="mb-4 p-3 border rounded" style={{ marginBottom: '1rem' }}>
              <div className="form-actions" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowInterruptionForm((prev) => !prev)
                    setShowSuspensionForm(false)
                  }}
                >
                  {showInterruptionForm ? 'إلغاء' : 'انقطاع'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowSuspensionForm((prev) => !prev)
                    setShowInterruptionForm(false)
                  }}
                  disabled={!!activeSuspension}
                >
                  {showSuspensionForm ? 'إلغاء' : 'وقف'}
                </button>
              </div>

              {showInterruptionForm && (
                <div className="mb-4 p-3 border rounded">
                  <h4>إضافة إجراء انقطاع</h4>
                  <نموذج_إجراء onSubmit={handleAddInterruption} actionMode="INTERRUPTION" />
                </div>
              )}

              {showSuspensionForm && (
                <div className="mb-4 p-3 border rounded">
                  <h4>إضافة إجراء وقف</h4>
                  <نموذج_إجراء onSubmit={handleAddSuspension} actionMode="SUSPENSION" />
                </div>
              )}
            </div>
          )}

          {showResumeForm && activeSuspension && canShowActionButtons && (
            <div className="mb-4 p-3 border rounded" style={{ marginBottom: '1rem' }}>
              <h4>تفعيل الأجل بعد الوقف</h4>
              <div className="form-field">
                <label className="form-label" htmlFor="resumeDate">
                  تاريخ التفعيل
                </label>
                <input
                  id="resumeDate"
                  type="date"
                  className="form-input"
                  min={new Date(activeSuspension.startDate).toISOString().split('T')[0]}
                  max={today}
                  value={resumeDate}
                  onChange={(e) => setResumeDate(e.target.value)}
                  required
                />
                <p className="muted">لا يمكن اختيار تاريخ سابق لبدء الوقف أو تاريخ مستقبلي.</p>
              </div>
              <div className="form-actions mt-2">
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleResumeSuspension}
                  disabled={!resumeDate}
                >
                  تأكيد التفعيل
                </button>
              </div>
            </div>
          )}

          {historyEntries.length > 0 ? (
            <div>
              <h4>السجل الإجرائي (للأرشفة والطباعة)</h4>
              <div className="card">
                <table className="table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>التصنيف</th>
                      <th>التفاصيل</th>
                      <th>تم بواسطة</th>
                      <th>ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{formatArabicDate(entry.date)}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              entry.type === 'INTERRUPTION'
                                ? 'status-badge-critical'
                                : entry.type === 'SUSPENSION_START'
                                  ? 'status-badge-warning'
                                  : 'status-badge-active'
                            }`}
                          >
                            {entry.label}
                          </span>
                        </td>
                        <td>{entry.details}</td>
                        <td>{entry.by}</td>
                        <td>{entry.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="muted">لا توجد إجراءات تقادم مسجلة لهذه القضية.</p>
          )}

          {userRole === 'CLERK' && (
            <p className="muted" style={{ marginTop: '0.75rem' }}>
              حساب أمين الضبط يقتصر على التسجيل والاستخراج/الطباعة دون إجراءات قضائية.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
