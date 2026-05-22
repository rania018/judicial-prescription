import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const TEST_PASSWORD = 'test123'
const TEST_ACCOUNTS = [
  {
    email: 'clerk@test.com',
    role: 'كاتب ضبط',
    desc: 'تسجيل القضايا، البحث، والطباعة التشغيلية',
  },
  {
    email: 'prosecutor@test.com',
    role: 'عضو نيابة',
    desc: 'متابعة رقابية على مستوى المحكمة',
  },
  {
    email: 'attorney@test.com',
    role: 'محام عام',
    desc: 'إشراف أوسع على مستوى المجلس القضائي',
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
      toast.error('فشل تسجيل الدخول. تحقق من البيانات أو حاول مرة أخرى بعد قليل.')
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
            دخول موحّد للجهات القضائية مع عرض عربي واضح، وتنبيهات مرئية تسهّل متابعة الملفات
            الحساسة وفق الصلاحيات الممنوحة لكل دور.
          </p>

          <div className="login-hero__features">
            <div className="login-hero__feature">
              <strong>متابعة حسب الدور</strong>
              <span>القاضي، النيابة، المحامي العام، وكتابة الضبط.</span>
            </div>
            <div className="login-hero__feature">
              <strong>تنبيهات الأعمال الحرجة</strong>
              <span>تصنيف أحمر/أصفر/أخضر بصياغة قضائية واضحة.</span>
            </div>
            <div className="login-hero__feature">
              <strong>تجربة عربية محسّنة</strong>
              <span>تصميم RTL واضح مع حالات تحميل وخطأ أكثر سلاسة.</span>
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
              <span className="login-return-chip">سيتم إعادتك إلى الصفحة المطلوبة بعد الدخول</span>
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
            <div className="login-test-accounts-title">حسابات اختبار سريعة</div>
            <p className="login-test-accounts-note muted">
              كلمة المرور الافتراضية لجميع الحسابات: <strong>test123</strong>
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
