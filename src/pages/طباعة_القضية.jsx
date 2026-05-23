import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getCaseById, listCaseActions } from '../services/caseService'
import { formatArabicDate } from '../utils/prescription'
import {
  getCrimeTypeLabel,
  getInterruptionTypeLabel,
  getStatusLabel,
  getTrackTypeLabel,
  getNonPrescriptibleCategoryLabel,
} from '../utils/statusHelpers'

function getPrintActionLabel(action) {
  if (action.kind === 'SUSPENSION_START') return 'وقف'
  if (action.kind === 'SUSPENSION_RESUME') return 'تفعيل الأجل'
  if (action.kind === 'INTERRUPTION') return 'انقطاع'
  return 'إجراء'
}

function getPrintActionDetails(action) {
  if (action.kind === 'INTERRUPTION') {
    return getInterruptionTypeLabel(action.actionType)
  }

  if (action.kind === 'SUSPENSION_START') {
    return action.suspensionReason || 'سبب وقف غير محدد'
  }

  return action.notes || 'استئناف سريان الأجل'
}

export default function طباعة_القضية() {
  const { caseId } = useParams()
  const { user, role, userProfile } = useAuth()
  const [caseData, setCaseData] = useState(null)
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const c = await getCaseById(caseId, {
          userId: user?.uid,
          userRole: role,
          userContext: userProfile,
        })

        if (!c) {
          setCaseData(null)
          setActions([])
          return
        }

        const a = await listCaseActions(caseId)
        setCaseData(c)
        setActions(a)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [caseId, role, user?.uid, userProfile])

  if (loading) {
    return (
      <div className="print-layout">
        <p className="muted">جارٍ تجهيز النسخة القابلة للطباعة...</p>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="print-layout">
        <p className="muted">القضية غير متاحة للطباعة أو غير موجودة.</p>
      </div>
    )
  }

  return (
    <div className="print-layout">
      <header className="print-header">
        <div className="print-header-title">وزارة العدل</div>
        <div className="print-header-subtitle">بطاقة معلومات التقادم الجزائي</div>
      </header>

      <section className="print-section">
        <h2 className="print-section-title">البيانات الأساسية</h2>
        <table className="print-table">
          <tbody>
            <tr>
              <th>1) الرقم المرجعي</th>
              <td>{caseData.caseReference}</td>
            </tr>
            <tr>
              <th>2) المسار الإجرائي</th>
              <td>{getTrackTypeLabel(caseData.trackType)}</td>
            </tr>
            <tr>
              <th>3) تصنيف وتكييف الجريمة</th>
              <td>{getCrimeTypeLabel(caseData.crimeType)}</td>
            </tr>
            <tr>
              <th>4) الجهة القضائية</th>
              <td>{caseData.judicialAuthority || '—'}</td>
            </tr>
            <tr>
              <th>5) الصفة القضائية</th>
              <td>{caseData.judicialOfficer || '—'}</td>
            </tr>
            <tr>
              <th>6) {caseData.trackType === 'PENALTY_EXECUTION' ? 'تاريخ الحكم النهائي (بدء الأجل)' : 'تاريخ اقتراف الجريمة'}</th>
              <td>{formatArabicDate(caseData.crimeDate)}</td>
            </tr>
            {caseData.appearanceDate && caseData.severityLevel === 'HIDDEN' && (
              <tr>
                <th>تاريخ الظهور للعلن</th>
                <td>{formatArabicDate(caseData.appearanceDate)}</td>
              </tr>
            )}
            {caseData.nonPrescriptibleCategory && caseData.crimeType === 'EXEMPTED' && (
              <tr>
                <th>فئة الجريمة غير القابلة للتقادم</th>
                <td>{getNonPrescriptibleCategoryLabel(caseData.nonPrescriptibleCategory)}</td>
              </tr>
            )}
            {caseData.sentenceYears && caseData.trackType === 'PENALTY_EXECUTION' && caseData.crimeType === 'AGGRAVATED_MISDEMEANOR' && (
              <tr>
                <th>مدة الحكم القضائي</th>
                <td>{caseData.sentenceYears} سنة</td>
              </tr>
            )}
            <tr>
              <th>7) حالة التقادم</th>
              <td>{getStatusLabel(caseData.status)}</td>
            </tr>
            <tr>
              <th>8) تاريخ بدء الأجل</th>
              <td>{formatArabicDate(caseData.prescriptionStartDate)}</td>
            </tr>
            <tr>
              <th>9) تاريخ السقوط / انتهاء الأجل</th>
              <td>
                {caseData.prescriptionEndDate
                  ? formatArabicDate(caseData.prescriptionEndDate)
                  : 'لا تسقط بالتقادم'}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="print-section">
        <h2 className="print-section-title">10) سجل الإجراءات</h2>
        {actions.length === 0 ? (
          <p className="muted">لا توجد إجراءات مسجلة حتى تاريخ الطباعة.</p>
        ) : (
          <table className="print-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>التصنيف</th>
                <th>التفاصيل</th>
                <th>تم بواسطة</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((a) => (
                <tr key={a.id}>
                  <td>{formatArabicDate(a.actionDate)}</td>
                  <td>{getPrintActionLabel(a)}</td>
                  <td>{getPrintActionDetails(a)}</td>
                  <td>{a.performedBy || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="print-footer">
        <p className="muted">
          تم استخراج هذه النسخة بعد آخر تحديث إجرائي لضمان تطابق السجل الرقمي مع الملف الورقي.
        </p>
      </section>
    </div>
  )
}
