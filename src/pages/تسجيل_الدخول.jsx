import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
// @ts-ignore JSX module implemented in JS
import { useAuth } from '../context/AuthContext.jsx'
// @ts-ignore JSX module implemented in JS
import { useToast } from '../context/ToastContext.jsx'

// حسابات تجريبية للاختبار — عدّل القائمة حسب المستخدمين المُنشئين في Firebase Auth
const TEST_PASSWORD = 'test123'
const TEST_ACCOUNTS = [
  { email: 'clerk@test.com', role: 'كاتب ضبط', desc: 'تسجيل قضايا جديدة' },
  { email: 'prosecutor@test.com', role: 'عضو نيابة', desc: 'إضافة إجراءات على القضايا' },
  { email: 'attorney@test.com', role: 'محام عام', desc: 'كل الصلاحيات + إدارة المستخدمين' },
]

export default function تسجيل_الدخول() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      toast.success('تم تسجيل الدخول بنجاح.')
      navigate(from, { replace: true })
    } catch (err) {
      setError('بيانات الدخول غير صحيحة أو حدث خطأ في المصادقة.')
      toast.error('تعذر تسجيل الدخول. يرجى التحقق من البيانات أو المحاولة لاحقاً.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="centered-page">
      <div className="card login-card">
        <h1 className="login-title">نظام متابعة آجال التقادم</h1>
        <p className="login-subtitle">
          فضلاً أدخل بيانات الدخول للوصول إلى النظام.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label" htmlFor="email">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-field" style={{ marginTop: '0.75rem' }}>
            <label className="form-label" htmlFor="password">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="error-text" style={{ marginTop: '0.75rem' }}>
              {error}
            </p>
          )}

          <div className="form-actions" style={{ marginTop: '1.25rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  <span>جارٍ تسجيل الدخول...</span>
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </div>
        </form>

        <div className="login-test-accounts">
          <div className="login-test-accounts-title">حسابات تجريبية للاختبار</div>
          <p className="login-test-accounts-note muted">
            كلمة المرور لجميع الحسابات: <strong>test123</strong> — انقر على أي حساب لملء الحقول ثم تسجيل الدخول.
          </p>
          <ul className="login-test-accounts-list">
            {TEST_ACCOUNTS.map((acc) => (
              <li key={acc.email}>
                <button
                  type="button"
                  className="login-test-account-item"
                  onClick={() => {
                    setEmail(acc.email)
                    setPassword(TEST_PASSWORD)
                  }}
                  title="استخدام هذا الحساب"
                >
                  <span className="login-test-account-email">{acc.email}</span>
                  <span className="login-test-account-role">{acc.role}</span>
                  <span className="muted">{acc.desc}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

