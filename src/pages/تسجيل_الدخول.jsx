import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const TEST_PASSWORD = 'test123'
const TEST_ACCOUNTS = [
  {
    email: 'clerk@test.com',
    role: 'أمين الضبط',
    desc: 'إدخال بيانات القضية لأول مرة واستخراج بطاقة المعلومات عند الحاجة',
  },
  {
    email: 'judge@test.com',
    role: 'قاضٍ',
    desc: 'الاطلاع والتصرف في الملفات المسندة إليه حصراً',
  },
  {
    email: 'prosecutor@test.com',
    role: 'وكيل الجمهورية',
    desc: 'اطلاع رقابي على قضاة المحكمة والتصرف الكامل في ملفاته الخاصة',
  },
  {
    email: 'attorney@test.com',
    role: 'النائب العام',
    desc: 'اطلاع شامل على قضاة المجلس والتصرف الكامل في ملفاته الخاصة',
  },
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
  const [showPassword, setShowPassword] = useState(false)

  const from = location.state?.from?.pathname || '/'
  const normalizedEmail = email.trim()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(normalizedEmail, password)
      toast.success('تم تسجيل الدخول بنجاح.')
      navigate(from, { replace: true })
    } catch {
      setError('تعذر التحقق من بيانات الدخول. يرجى التأكد من البريد وكلمة المرور ثم إعادة المحاولة.')
      toast.error('فشل تسجيل الدخول. يرجى التحقق من البيانات أو المحاولة مجدداً.')
    } finally {
      setLoading(false)
    }
  }

  const fillTestAccount = (account) => {
    setEmail(account.email)
    setPassword(TEST_PASSWORD)
    setError('')
  }

  return (
    <div className="login-shell">
      <div className="login-layout">
        <section className="login-hero">
          <span className="login-hero__badge">منصة قضائية داخلية</span>
          <h1 className="login-hero__title">نظام متابعة آجال التقادم</h1>
          <p className="login-hero__text">
            دخول موحّد للجهات القضائية عبر واجهة عربية واضحة، مع تنبيهات مرئية تُسهّل متابعة
            الملفات الحساسة وفق الصلاحيات الممنوحة لكل دور.
          </p>

          <div className="login-hero__features">
            <div className="login-hero__feature">
              <strong>متابعة حسب الدور</strong>
              <span>أمين الضبط، قاضٍ، وكيل الجمهورية، والنائب العام.</span>
            </div>
            <div className="login-hero__feature">
              <strong>تنبيهات الأعمال الحرجة</strong>
              <span>تصنيف أحمر/أصفر/أخضر بصياغة قضائية واضحة.</span>
            </div>
            <div className="login-hero__feature">
              <strong>تجربة عربية محسّنة</strong>
              <span>تصميم RTL واضح مع معالجة سلسة لحالات التحميل والأخطاء.</span>
            </div>
          </div>
        </section>

        <div className="card login-card login-card--enhanced">
          <div className="login-card__header">
            <div>
              <h2 className="login-title">تسجيل الدخول الآمن</h2>
              <p className="login-subtitle">
                أدخل بيانات الاعتماد للوصول إلى مركز المتابعة والتنبيهات.
              </p>
            </div>
            {from !== '/' && (
              <span className="login-return-chip">ستُعاد تلقائياً إلى الصفحة المطلوبة فور تسجيل الدخول</span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="login-form" aria-busy={loading}>
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
                placeholder="name@justice.dz"
                autoComplete="username"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="password">
                كلمة المرور
              </label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input password-field__input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="أدخل كلمة المرور"
                  required
                />
                <button
                  type="button"
                  className="password-field__toggle"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? 'إخفاء' : 'إظهار'}
                </button>
              </div>
            </div>

            {error && <div className="login-error-box">{error}</div>}

            <div className="form-actions login-form__actions">
              <button
                type="submit"
                className="btn btn-primary login-submit"
                disabled={loading || !normalizedEmail || !password}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    <span>جارٍ التحقق من الهوية...</span>
                  </>
                ) : (
                  'دخول إلى النظام'
                )}
              </button>
            </div>
          </form>

          <div className="login-test-accounts">
            <div className="login-test-accounts-title">حسابات تجريبية للدخول السريع</div>
            <p className="login-test-accounts-note muted">
              للوصول السريع في العرض التجريبي، اختر أحد الحسابات التالية. كلمة المرور الافتراضية لجميعها
              هي: <strong>{TEST_PASSWORD}</strong>
            </p>
            <ul className="login-test-accounts-list">
              {TEST_ACCOUNTS.map((account) => (
                <li key={account.email}>
                  <button
                    type="button"
                    className="login-test-account-item"
                    onClick={() => fillTestAccount(account)}
                  >
                    <span className="login-test-account-email">{account.email}</span>
                    <span className="login-test-account-role">{account.role}</span>
                    <span className="muted">{account.desc}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
