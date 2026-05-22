import { useState } from 'react'
import dayjs from 'dayjs'

const ACTION_TYPES = [
  { value: 'INVESTIGATION', label: 'إجراءات البحث والتحري (الضبطية)' },
  { value: 'PROSECUTION', label: 'إجراءات مباشرة الدعوى العمومية (النيابة)' },
  { value: 'JUDICIAL_INVESTIGATION', label: 'إجراءات التحقيق القضائي (قاضي التحقيق)' },
  { value: 'TRIAL', label: 'إجراءات المحاكمة' },
]

export default function نموذج_إجراء({ onSubmit, submitting, disabled, actionMode = 'INTERRUPTION' }) {
  const [actionType, setActionType] = useState('INVESTIGATION')
  const [actionDate, setActionDate] = useState('')
  const [notes, setNotes] = useState('')
  
  // For suspension mode
  const [suspensionReason, setSuspensionReason] = useState('')

  const today = dayjs().format('YYYY-MM-DD')

  const isInterruptionMode = actionMode === 'INTERRUPTION'
  const isSuspensionMode = actionMode === 'SUSPENSION'
  
  const isValid = isInterruptionMode 
    ? actionType && actionDate !== '' 
    : actionDate !== '' && suspensionReason.trim() !== ''

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isValid || disabled) return

    const confirmed = window.confirm(
      isInterruptionMode 
        ? 'هل أنت متأكد من إضافة هذا الإجراء الذي يؤدي إلى انقطاع التقادم؟'
        : 'هل أنت متأكد من إضافة هذا الإجراء الذي يؤدي إلى وقف التقادم؟'
    )
    if (!confirmed) return

    if (isInterruptionMode) {
      onSubmit({
        actionType,
        actionDate: new Date(actionDate),
        notes: notes || undefined
      })
    } else {
      onSubmit({
        actionDate: new Date(actionDate),
        suspensionReason,
        notes: notes || undefined
      })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        {isInterruptionMode && (
          <div className="form-field">
            <label className="form-label" htmlFor="actionType">
              نوع الإجراء (يؤدي إلى انقطاع)
            </label>
            <select
              id="actionType"
              className="form-select"
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              required
              disabled={disabled}
            >
              {ACTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {!isInterruptionMode && (
          <div className="form-field">
            <label className="form-label" htmlFor="suspensionReason">
              سبب الوقف
            </label>
            <input
              id="suspensionReason"
              type="text"
              className="form-input"
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              required
              disabled={disabled}
            />
            <p className="muted">سبب وقف التقادم مؤقتًا.</p>
          </div>
        )}

        <div className="form-field">
          <label className="form-label" htmlFor="actionDate">
            {isInterruptionMode ? 'تاريخ الإجراء (الانقطاع)' : 'تاريخ بدء الوقف'}
          </label>
          <input
            id="actionDate"
            type="date"
            className="form-input"
            max={today}
            value={actionDate}
            onChange={(e) => setActionDate(e.target.value)}
            required
            disabled={disabled}
          />
          <p className="muted">لا يمكن اختيار تاريخ مستقبلي.</p>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="notes">
            ملاحظات (اختياري)
          </label>
          <textarea
            id="notes"
            className="form-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={disabled}
            rows="3"
          />
          <p className="muted">ملاحظات إضافية حول هذا الإجراء.</p>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!isValid || submitting || disabled}
        >
          {submitting ? (
            <>
              <span className="spinner" />
              <span>
                {isInterruptionMode ? 'جارٍ إضافة الإجراء...' : 'جارٍ تسجيل الوقف...'}
              </span>
            </>
          ) : (
            isInterruptionMode ? 'إضافة إجراء (انقطاع)' : 'تسجيل وقف (Suspension)'
          )}
        </button>
      </div>
    </form>
  )
}