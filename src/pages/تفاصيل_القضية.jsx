import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getCaseById, addCaseInterruption, addCaseSuspension, resumeCaseFromSuspension } from '../services/caseService';
import { formatArabicDate, getDaysRemaining } from '../utils/prescription';
import { getStatusLabel, getCrimeTypeLabel, getTrackTypeLabel, getSeverityLevelLabel } from '../utils/statusHelpers';
import شارة_الحالة from '../components/شارة_الحالة.jsx';
import سجل_إجراءات_التقادم from '../components/سجل_إجراءات_التقادم.jsx';

export default function تفاصيل_القضية() {
  const { caseId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCaseDetails();
  }, [caseId]);

  const loadCaseDetails = async () => {
    try {
      setLoading(true);
      const data = await getCaseById(caseId);
      if (!data) {
        setError('القضية غير موجودة');
      } else {
        setCaseData(data);
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل تفاصيل القضية');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInterruption = async (interruptionData) => {
    try {
      await addCaseInterruption(caseId, interruptionData, user.uid, caseData);
      // Reload case data to show updated status
      await loadCaseDetails();
    } catch (err) {
      console.error('Error adding interruption:', err);
      alert('حدث خطأ أثناء إضافة إجراء الانقطاع: ' + err.message);
    }
  };

  const handleAddSuspension = async (suspensionData) => {
    try {
      await addCaseSuspension(caseId, suspensionData, user.uid, caseData);
      // Reload case data to show updated status
      await loadCaseDetails();
    } catch (err) {
      console.error('Error adding suspension:', err);
      alert('حدث خطأ أثناء إضافة حالة الوقف: ' + err.message);
    }
  };

  const handleResumeSuspension = async (resumeData) => {
    try {
      await resumeCaseFromSuspension(caseId, resumeData, user.uid, caseData);
      // Reload case data to show updated status
      await loadCaseDetails();
    } catch (err) {
      console.error('Error resuming from suspension:', err);
      alert('حدث خطأ أثناء استئناف القضية بعد الوقف: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="card centered-page">
        <div className="card-body">
          <div className="spinner" /> جاري تحميل تفاصيل القضية...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card centered-page">
        <div className="card-body">
          <h3 className="card-title">خطأ</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/القضايا')}>
            العودة إلى القائمة
          </button>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="card centered-page">
        <div className="card-body">
          <h3 className="card-title">القضية غير موجودة</h3>
          <p>لم يتم العثور على القضية المطلوبة.</p>
          <button className="btn btn-primary" onClick={() => navigate('/القضايا')}>
            العودة إلى القائمة
          </button>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(caseData.prescriptionEndDate);

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

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">المعلومات الأساسية</h3>
          </div>
          <div className="card-body">
            <div className="detail-row">
              <strong>الرقم المرجعي:</strong>
              <span>{caseData.caseReference}</span>
            </div>
            <div className="detail-row">
              <strong>نوع المسار:</strong>
              <span>{getTrackTypeLabel(caseData.trackType)}</span>
            </div>
            <div className="detail-row">
              <strong>نوع الجريمة:</strong>
              <span>{getCrimeTypeLabel(caseData.crimeType)}</span>
            </div>
            {caseData.severityLevel && (
              <div className="detail-row">
                <strong>درجة الجسامة:</strong>
                <span>{getSeverityLevelLabel(caseData.severityLevel)}</span>
              </div>
            )}
            {caseData.customPenaltyDuration && (
              <div className="detail-row">
                <strong>مدة تخصيص العقوبة:</strong>
                <span>{caseData.customPenaltyDuration} سنة</span>
              </div>
            )}
            <div className="detail-row">
              <strong>الجهة القضائية:</strong>
              <span>{caseData.judicialAuthority}</span>
            </div>
            <div className="detail-row">
              <strong>الصفة القضائية:</strong>
              <span>{caseData.judicialOfficer}</span>
            </div>
            <div className="detail-row">
              <strong>تاريخ اقتراف الجريمة:</strong>
              <span>{formatArabicDate(caseData.crimeDate)}</span>
            </div>
            {caseData.isMinor && (
              <div className="detail-row">
                <strong>قضية قاصر:</strong>
                <span>نعم - تاريخ الميلاد: {formatArabicDate(caseData.minorBirthDate)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">حالة التقادم</h3>
          </div>
          <div className="card-body">
            <div className="detail-row">
              <strong>الحالة:</strong>
              <شارة_الحالة status={caseData.status} />
            </div>
            <div className="detail-row">
              <strong>تاريخ بدء التقادم:</strong>
              <span>{formatArabicDate(caseData.prescriptionStartDate)}</span>
            </div>
            <div className="detail-row">
              <strong>تاريخ انتهاء التقادم:</strong>
              <span>{caseData.prescriptionEndDate ? formatArabicDate(caseData.prescriptionEndDate) : 'غير قابل للتقادم'}</span>
            </div>
            {caseData.prescriptionEndDate && (
              <div className="detail-row">
                <strong>الأيام المتبقية:</strong>
                <span>
                  {daysRemaining === null ? 'غير قابل للتقادم' : 
                   daysRemaining < 0 ? `انتهى منذ ${Math.abs(daysRemaining)} يوم` :
                   daysRemaining === 0 ? 'ينتهي اليوم' :
                   `باقي ${daysRemaining} يوم`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <br/>

      <سجل_إجراءات_التقادم 
        caseId={caseId}
        caseData={caseData}
        userProfile={profile}
        onAddInterruption={handleAddInterruption}
        onAddSuspension={handleAddSuspension}
        onResumeSuspension={handleResumeSuspension}
      />
    </div>
  );
}