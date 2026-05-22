import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
// @ts-ignore JSX module implemented in JS
import { useAuth } from '../context/AuthContext.jsx'
import { createCase } from '../services/caseService'
// @ts-ignore JSX module implemented in JS
import { useToast } from '../context/ToastContext.jsx'
// @ts-ignore JSX module implemented in JS
import نموذج_قضية from '../components/نموذج_قضية.jsx'

export default function إنشاء_قضية() {
  const { user, role, userProfile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (baseData) => {
    if (!user) return
    setError('')
    setSubmitting(true)
    try {
      const created = await createCase(baseData, user.uid, {
        role,
        courtId: userProfile?.courtId,
        councilId: userProfile?.councilId,
      })
      toast.success(`تم تسجيل القضية رقم ${baseData.caseReference} بنجاح.`)
      navigate(`/القضايا/${created.id}`)
    } catch (err) {
      // إظهار رسالة الخطأ الفعلية للمساعدة في التشخيص
      // eslint-disable-next-line no-console
      console.error('Create case error:', err)
      setError(
        err?.message ||
          'حدث خطأ أثناء إنشاء القضية. يرجى المحاولة لاحقاً.',
      )
      toast.error(
        err?.message || 'تعذر تسجيل القضية. يرجى المحاولة لاحقاً.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">إنشاء قضية جديدة</h2>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">بيانات القضية</div>
            <div className="card-subtitle">
              تعبئة الحقول المعتمدة لإنشاء قضية جديدة مع احتساب أجل التقادم
              تلقائياً.
            </div>
          </div>
        </div>

        {error && (
          <p className="error-text" style={{ marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        <نموذج_قضية onSubmit={handleSubmit} submitting={submitting} />
      </div>
    </div>
  )
}
