import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { useAuth } from '../context/AuthContext.jsx'
import { getCaseById, listCaseActions } from '../services/caseService'
import { formatArabicDate } from '../utils/prescription'
import {
  getCrimeTypeLabel,
  getJudicialAuthorityLabel,
  getJudicialOfficerLabel,
  getIndictmentBranchLabel,
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

function serializeDateForVerification(value) {
  if (!value) return null
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

export default function طباعة_القضية() {
  const { caseId } = useParams()
  const { user, role, userProfile } = useAuth()
  const [caseData, setCaseData] = useState(null)
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')

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

  useEffect(() => {
    const generateQrCode = async () => {
      if (!caseData) {
        setQrCodeDataUrl('')
        return
      }

      const verificationRoute = typeof window !== 'undefined'
        ? `${window.location.origin}/القضايا/${caseData.id || caseId}`
        : `/القضايا/${caseData.id || caseId}`

      const verificationPayload = JSON.stringify({
        r: caseData.caseReference,
        i: caseData.id || caseId,
        t: caseData.trackType,
        s: caseData.status,
        e: serializeDateForVerification(caseData.prescriptionEndDate),
        v: verificationRoute,
      })

      try {
        const dataUrl = await QRCode.toDataURL(verificationPayload, {
          width: 160,
          margin: 1,
          errorCorrectionLevel: 'M',
        })
        setQrCodeDataUrl(dataUrl)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('QR generation failed:', error)
        setQrCodeDataUrl('')
      }
    }

    generateQrCode()
  }, [caseData, caseId])

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
        <div className="print-header-subtitle">بطاقة معلومات التقادم</div>
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
              <td>{getJudicialAuthorityLabel(caseData.judicialAuthority) || '—'}</td>
            </tr>
            <tr>
              <th>5) الصفة القضائية</th>
              <td>{getJudicialOfficerLabel(caseData.judicialOfficer) || '—'}</td>
            </tr>
            {caseData.indictmentBranch && (
              <tr>
                <th>تفريع رئيس غرفة الاتهام</th>
                <td>{getIndictmentBranchLabel(caseData.indictmentBranch)}</td>
              </tr>
            )}
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
        <div className="print-verification">
          <div>
            <h3 className="print-section-title">التحقق السريع (QR)</h3>
            <p className="muted">
              امسح الرمز للوصول السريع لمسار التحقق المرتبط بالقضية داخل المنصة.
            </p>
            <p className="muted" style={{ direction: 'ltr' }}>
              {(typeof window !== 'undefined' ? window.location.origin : '')}/القضايا/{caseData.id || caseId}
            </p>
          </div>
          {qrCodeDataUrl ? (
            <img
              src={qrCodeDataUrl}
              alt="رمز QR للتحقق من بطاقة معلومات التقادم"
              className="print-qr-code"
            />
          ) : (
            <div className="print-qr-fallback muted">تعذر توليد رمز QR</div>
          )}
        </div>
        <p className="muted">
          تم استخراج هذه النسخة بعد آخر تحديث إجرائي لضمان تطابق السجل الرقمي مع الملف الورقي.
        </p>
      </section>
    </div>
  )
}
