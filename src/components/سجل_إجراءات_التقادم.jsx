import { useState, useEffect } from 'react';
import { getInterruptionTypeLabel } from '../utils/statusHelpers';
import { formatArabicDate } from '../utils/prescription';
import نموذج_إجراء from './نموذج_إجراء';

export default function سجل_إجراءات_التقادم({ caseId, caseData, userRole, onAddInterruption, onAddSuspension, onResumeSuspension }) {
  const [interruptions, setInterruptions] = useState([]);
  const [suspensions, setSuspensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInterruptionForm, setShowInterruptionForm] = useState(false);
  const [showSuspensionForm, setShowSuspensionForm] = useState(false);
  const [showResumeForm, setShowResumeForm] = useState(false);
  const [resumeDate, setResumeDate] = useState('');
  
  const today = new Date().toISOString().split('T')[0];

  // Mock data fetching - in real implementation this would come from the DB
  useEffect(() => {
    // In a real implementation, fetch from Firestore subcollections
    // const interruptionsRef = collection(db, 'cases', caseId, 'interruptions');
    // const suspensionsRef = collection(db, 'cases', caseId, 'suspensions');
    
    // Mock data for demonstration
    setInterruptions(caseData.interruptionHistory || []);
    setSuspensions(caseData.suspensionHistory || []);
    setLoading(false);
  }, [caseId, caseData]);

  const handleAddInterruption = (interruptionData) => {
    onAddInterruption(interruptionData);
    setShowInterruptionForm(false);
  };

  const handleAddSuspension = (suspensionData) => {
    onAddSuspension(suspensionData);
    setShowSuspensionForm(false);
  };

  const handleResumeSuspension = () => {
    if (!resumeDate) return;
    
    onResumeSuspension({
      actionDate: new Date(resumeDate)
    });
    setShowResumeForm(false);
    setResumeDate('');
  };

  // Check if there's an active suspension
  const activeSuspension = suspensions.find(s => !s.endDate);

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="spinner" /> جاري تحميل سجل الإجراءات...
        </div>
      </div>
    );
  }

  return (
    <div className="prescription-actions-log">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">سجل إجراءات التقادم</h3>
        </div>
        <div className="card-body">
          {/* Action buttons based on user permissions */}
          <div className="form-actions mb-4">
            {caseData.status !== 'EXPIRED' && caseData.status !== 'NON_PRESCRIPTIBLE' && (
              <>
                {userRole === 'PROSECUTOR' && (
                  <button
                    type="button"
                    className="btn btn-primary mr-2"
                    onClick={() => setShowInterruptionForm(!showInterruptionForm)}
                  >
                    {showInterruptionForm ? 'إلغاء' : 'إضافة انقطاع (Interruption)'}
                  </button>
                )}
                
                {(userRole === 'PROSECUTOR' || userRole === 'ATTORNEY_GENERAL') && (
                  <button
                    type="button"
                    className="btn btn-secondary mr-2"
                    onClick={() => setShowSuspensionForm(!showSuspensionForm)}
                    disabled={!!activeSuspension}
                  >
                    {showSuspensionForm ? 'إلغاء' : 'إضافة وقف (Suspension)'}
                  </button>
                )}
                
                {activeSuspension && (userRole === 'PROSECUTOR' || userRole === 'ATTORNEY_GENERAL') && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => setShowResumeForm(!showResumeForm)}
                  >
                    {showResumeForm ? 'إلغاء' : 'استئناف بعد الوقف'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Interruption Form */}
          {showInterruptionForm && (
            <div className="mb-4 p-3 border rounded">
              <h4>إضافة إجراء انقطاع</h4>
              <نموذج_إجراء 
                onSubmit={handleAddInterruption}
                actionMode="INTERRUPTION"
              />
            </div>
          )}

          {/* Suspension Form */}
          {showSuspensionForm && (
            <div className="mb-4 p-3 border rounded">
              <h4>إضافة إجراء وقف</h4>
              <نموذج_إجراء 
                onSubmit={handleAddSuspension}
                actionMode="SUSPENSION"
              />
            </div>
          )}

          {/* Resume Suspension Form */}
          {showResumeForm && (
            <div className="mb-4 p-3 border rounded">
              <h4>استئناف بعد الوقف</h4>
              <div className="form-field">
                <label className="form-label" htmlFor="resumeDate">
                  تاريخ الاستئناف
                </label>
                <input
                  id="resumeDate"
                  type="date"
                  className="form-input"
                  max={today}
                  value={resumeDate}
                  onChange={(e) => setResumeDate(e.target.value)}
                  required
                />
                <p className="muted">لا يمكن اختيار تاريخ مستقبلي.</p>
              </div>
              <div className="form-actions mt-2">
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleResumeSuspension}
                  disabled={!resumeDate}
                >
                  تأكيد الاستئناف
                </button>
              </div>
            </div>
          )}

          {/* Interruption History */}
          {interruptions.length > 0 && (
            <div className="mb-4">
              <h4>سجل الإجراءات التي تؤدي إلى انقطاع التقادم</h4>
              <div className="card">
                <table className="table">
                  <thead>
                    <tr>
                      <th>نوع الإجراء</th>
                      <th>تاريخ الإجراء</th>
                      <th>تم بواسطة</th>
                      <th>ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interruptions.map((interruption) => (
                      <tr key={interruption.id}>
                        <td>{getInterruptionTypeLabel(interruption.type)}</td>
                        <td>{formatArabicDate(interruption.date)}</td>
                        <td>{interruption.performedByName || interruption.performedBy}</td>
                        <td>{interruption.notes || 'لا توجد'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Suspension History */}
          {suspensions.length > 0 && (
            <div>
              <h4>سجل حالات وقف التقادم</h4>
              <div className="card">
                <table className="table">
                  <thead>
                    <tr>
                      <th>تاريخ البداية</th>
                      <th>تاريخ النهاية</th>
                      <th>السبب</th>
                      <th>تم الوقف بواسطة</th>
                      <th>تم الاستئناف بواسطة</th>
                      <th>ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suspensions.map((suspension) => (
                      <tr key={suspension.id}>
                        <td>{formatArabicDate(suspension.startDate)}</td>
                        <td>{suspension.endDate ? formatArabicDate(suspension.endDate) : 'مستمر'}</td>
                        <td>{suspension.reason}</td>
                        <td>{suspension.suspendedByName || suspension.suspendedBy}</td>
                        <td>{suspension.resumedByName || suspension.resumedBy || 'لم يُستأنف'}</td>
                        <td>{suspension.notes || 'لا توجد'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {interruptions.length === 0 && suspensions.length === 0 && (
            <p className="muted">لا توجد إجراءات تقادم مسجلة لهذه القضية.</p>
          )}
        </div>
      </div>
    </div>
  );
}