import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {
  getCaseById,
  addCaseInterruption,
  addCaseSuspension,
  resumeCaseFromSuspension,
} from '../services/caseService'
import { formatArabicDate, getDaysRemaining } from '../utils/prescription'
import {
  getCrimeTypeLabel,
  getStatusDescription,
  getTrackTypeLabel,
  getSeverityLevelLabel,
} from '../utils/statusHelpers'
import { canTakeJudicialActions } from '../utils/rbacHelper'
import شارة_الحالة from '../components/شارة_الحالة.jsx'
import سجل_إجراءات_التقادم from '../components/سجل_إجراءات_التقادم.jsx'

export default function تفاصيل_القضية() {
  const { caseId } = useParams()
  const { user, role, profile } = useAuth()
  const navigate = useNavigate()
  const [caseData, setCaseData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadCaseDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, user?.uid, role, profile?.courtId, profile?.councilId])

  const loadCaseDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getCaseById(caseId, {
        userId: user?.uid,
        userRole: role,
        userContext: profile,
      })

      if (!data) {
        setError('القضية غير متاحة لك أو غير موجودة.')
      } else {
        setCaseData(data)
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل تفاصيل القضية')
      // eslint-disable-next-line no-console
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddInterruption = async (interruptionData) => {
    try {
      await addCaseInterruption(caseId, interruptionData, user.uid, role, caseData, profile)
      await loadCaseDetails()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error adding interruption:', err)
      alert('حدث خطأ أثناء إضافة إجراء الانقطاع: ' + err.message)
    }
  }

  const handleAddSuspension = async (suspensionData) => {
    try {
      await addCaseSuspension(caseId, suspensionData, user.uid, role, caseData, profile)
      await loadCaseDetails()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error adding suspension:', err)
      alert('حدث خطأ أثناء إضافة حالة الوقف: ' + err.message)
    }
  }

  const handleResumeSuspension = async (resumeData) => {
    try {
      await resumeCaseFromSuspension(caseId, resumeData, user.uid, role, caseData, profile)
      await loadCaseDetails()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error resuming from suspension:', err)
      alert('حدث خطأ أثناء تفعيل الأجل: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="card centered-page">
        <div className="card-body">
          <div className="spinner" /> جاري تحميل تفاصيل القضية...
        </div>
      </div>
    )
  }

  if (error || !caseData) {
    return (
      <div className="card centered-page">
        <div className="card-body">
          <h3 className="card-title">تعذر فتح القضية</h3>
          <p>{error || 'القضية غير متاحة.'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/القضايا')}>
            العودة إلى القائمة
          </button>
        </div>
      </div>
    )
  }

  const daysRemaining = getDaysRemaining(caseData.prescriptionEndDate)
  const canEditCase = canTakeJudicialActions(role, caseData.accessLevel)

  return (
    <div className="case-details">
      <div className="page-header">
        <h2 className="page-title">تفاصيل القضية: {caseData.caseReference}</h2>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/القضايا')}>
            العودة إلى القائمة
          </button>
        </div>
      </div>

      {!canEditCase && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body">
            <strong>وضع القراءة فقط:</strong> لديك صلاحية الاطلاع الرقابي/الإداري على هذه القضية دون التصرف القضائي.
          </div>
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">البيانات الأساسية</h3>
          </div>
          <div className="card-body">
            <div className="detail-row">
              <strong>1) الرقم المرجعي:</strong>
              <span>{caseData.caseReference}</span>
            </div>
            <div className="detail-row">
              <strong>2) المسار الإجرائي:</strong>
              <span>{getTrackTypeLabel(caseData.trackType)}</span>
            </div>
            <div className="detail-row">
              <strong>3) تصنيف وتكييف الجريمة:</strong>
              <span>{getCrimeTypeLabel(caseData.crimeType)}</span>
            </div>
            <div className="detail-row">
              <strong>4) الجهة القضائية:</strong>
              <span>{caseData.judicialAuthority}</span>
            </div>
            <div className="detail-row">
              <strong>5) الصفة القضائية:</strong>
              <span>{caseData.judicialOfficer}</span>
            </div>
            <div className="detail-row">
              <strong>6) تاريخ اقتراف الجريمة / بدء السريان:</strong>
              <span>{formatArabicDate(caseData.crimeDate)}</span>
            </div>
            {caseData.severityLevel && (
              <div className="detail-row">
                <strong>تفصيل التكييف:</strong>
                <span>{getSeverityLevelLabel(caseData.severityLevel)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">بيانات التقادم</h3>
          </div>
          <div className="card-body">
            <div className="detail-row">
              <strong>7) حالة التقادم:</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <شارة_الحالة status={caseData.status} />
                <span className="muted">{getStatusDescription(caseData.status)}</span>
              </div>
            </div>
            <div className="detail-row">
              <strong>8) تاريخ بدء الأجل:</strong>
              <span>{formatArabicDate(caseData.prescriptionStartDate)}</span>
            </div>
            <div className="detail-row">
              <strong>9) تاريخ السقوط / انتهاء الأجل:</strong>
              <span>
                {caseData.prescriptionEndDate
                  ? formatArabicDate(caseData.prescriptionEndDate)
                  : 'لا تسقط بالتقادم'}
              </span>
            </div>
            {caseData.prescriptionEndDate && (
              <div className="detail-row">
                <strong>الأيام المتبقية:</strong>
                <span>
                  {daysRemaining === null
                    ? 'غير قابل للتقادم'
                    : daysRemaining < 0
                      ? `انتهى منذ ${Math.abs(daysRemaining)} يوم`
                      : daysRemaining === 0
                        ? 'ينتهي اليوم'
                        : `باقي ${daysRemaining} يوم`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <br />

      <سجل_إجراءات_التقادم
        caseId={caseId}
        caseData={caseData}
        userRole={role}
        canEditCase={canEditCase}
        onAddInterruption={handleAddInterruption}
        onAddSuspension={handleAddSuspension}
        onResumeSuspension={handleResumeSuspension}
      />
    </div>
  )
}
