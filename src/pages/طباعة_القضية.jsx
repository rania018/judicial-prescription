import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getCaseById, listCaseActions } from '../services/caseService'
import { formatArabicDate } from '../utils/prescription'
import {
  getActionTypeLabel,
  getCaseStageLabel,
  getCrimeTypeLabel,
  getStatusLabel,
} from '../utils/statusHelpers'

export default function طباعة_القضية() {
  const { caseId } = useParams()
  const [caseData, setCaseData] = useState(null)
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [c, a] = await Promise.all([
          getCaseById(caseId),
          listCaseActions(caseId),
        ])
        setCaseData(c)
        setActions(a)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [caseId])

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
        <p className="muted">لم يتم العثور على القضية المطلوبة.</p>
      </div>
    )
  }

  return (
    <div className="print-layout">
      <header className="print-header">
        <div className="print-header-title">وزارة العدل</div>
        <div className="print-header-subtitle">
          نظام متابعة آجال التقادم في القضايا الجزائية
        </div>
      </header>

      <section className="print-section">
        <h2 className="print-section-title">بيانات القضية</h2>
        <table className="print-table">
          <tbody>
            <tr>
              <th>رمز القضية</th>
              <td>{caseData.caseCode}</td>
            </tr>
            <tr>
              <th>نوع الجريمة</th>
              <td>{getCrimeTypeLabel(caseData.crimeType)}</td>
            </tr>
            <tr>
              <th>مصدر القضية</th>
              <td>
                {caseData.caseOrigin === 'POLICE'
                  ? 'محضر شرطة'
                  : caseData.caseOrigin === 'PROSECUTION'
                    ? 'النيابة العامة'
                    : caseData.caseOrigin === 'COURT_FIRST'
                      ? 'محكمة أول درجة'
                      : 'غير محدد'}
              </td>
            </tr>
            <tr>
              <th>مرحلة القضية</th>
              <td>{getCaseStageLabel(caseData.caseStage)}</td>
            </tr>
            <tr>
              <th>المرحلة القضائية الحالية</th>
              <td>
                {caseData.courtLevel === 'FIRST'
                  ? 'محكمة أول درجة'
                  : caseData.courtLevel === 'APPEAL'
                    ? 'محكمة الاستئناف'
                    : caseData.courtLevel === 'CASSATION'
                      ? 'محكمة النقض'
                      : 'لا يوجد'}
              </td>
            </tr>
            <tr>
              <th>تاريخ بدء المتابعة الجزائية</th>
              <td>{formatArabicDate(caseData.prosecutionStartDate)}</td>
            </tr>
            <tr>
              <th>تاريخ بدء التقادم</th>
              <td>{formatArabicDate(caseData.prescriptionStartDate)}</td>
            </tr>
            <tr>
              <th>تاريخ آخر إجراء</th>
              <td>{formatArabicDate(caseData.lastActionDate)}</td>
            </tr>
            <tr>
              <th>تاريخ انتهاء التقادم</th>
              <td>{formatArabicDate(caseData.prescriptionEndDate)}</td>
            </tr>
            {caseData.isMinor && (
              <>
                <tr>
                  <th>قاصر</th>
                  <td>نعم</td>
                </tr>
                {caseData.birthDate && (
                  <tr>
                    <th>تاريخ الميلاد</th>
                    <td>{formatArabicDate(caseData.birthDate)}</td>
                  </tr>
                )}
              </>
            )}
            {caseData.sentenceDate && (
              <tr>
                <th>تاريخ الحكم</th>
                <td>{formatArabicDate(caseData.sentenceDate)}</td>
              </tr>
            )}
            <tr>
              <th>حالة التقادم</th>
              <td>{getStatusLabel(caseData.status)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="print-section">
        <h2 className="print-section-title">سجل الإجراءات</h2>
        {actions.length === 0 ? (
          <p className="muted">
            لا توجد إجراءات مسجّلة على هذه القضية في النظام حتى تاريخ الطباعة.
          </p>
        ) : (
          <table className="print-table">
            <thead>
              <tr>
                <th>تاريخ الإجراء</th>
                <th>نوع الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((a) => (
                <tr key={a.id}>
                  <td>{formatArabicDate(a.actionDate)}</td>
                  <td>{getActionTypeLabel(a.actionType)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="print-footer">
        <p className="muted">
          تم استخراج هذه النسخة من نظام متابعة آجال التقادم للاستخدام الإداري
          والمرجعي ضمن وزارة العدل.
        </p>
      </section>
    </div>
  )
}

