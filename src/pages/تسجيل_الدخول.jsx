import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const TEST_PASSWORD = 'test123'
const TEST_ACCOUNTS = [
  {
    email: 'clerk@test.com',
    role: 'أمين الضبط',
    badge: 'تسجيل',
    badgeClass: 'login-badge--violet',
  },
  {
    email: 'judge@test.com',
    role: 'قاضٍ',
    badge: 'اطلاع',
    badgeClass: 'login-badge--amber',
  },
  {
    email: 'prosecutor@test.com',
    role: 'وكيل الجمهورية',
    badge: 'رقابة',
    badgeClass: 'login-badge--red',
  },
  {
    email: 'attorney@test.com',
    role: 'النائب العام',
    badge: 'اطلاع',
    badgeClass: 'login-badge--green',
  },
]

const HERO_FEATURES = [
  {
    title: 'تنبيهات الأجل الحرج',
    desc: 'تصنيف أحمر / أصفر / أخضر بصياغة قضائية واضحة ومباشرة',
    dotClass: 'login-feature-dot--red',
  },
  {
    title: 'صلاحيات محددة لكل دور',
    desc: 'أمين الضبط — قاضٍ — وكيل الجمهورية — النائب العام',
    dotClass: 'login-feature-dot--green',
  },
  {
    title: 'لوحة تحكم تحليلية',
    desc: 'رسوم بيانية ومؤشرات أداء فورية لمتابعة القضايا',
    dotClass: 'login-feature-dot--blue',
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
            منصة موحدة للجهات القضائية لمتابعة آجال التقادم وإدارة الملفات الجزائرية بدقة وكفاءة، مع تنبيهات فورية وصلاحيات محددة لكل دور.
          </p>

          <div className="login-hero__features">
            {HERO_FEATURES.map((feat) => (
              <div key={feat.title} className="login-hero__feature">
                <div className="login-hero__feature-header">
                  <strong className="login-hero__feature-title">{feat.title}</strong>
                  <span className={`login-feature-dot ${feat.dotClass}`} />
                </div>
                <span className="login-hero__feature-desc">{feat.desc}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="login-card login-card--enhanced">
          <div className="login-card__header">
            <h2 className="login-title">تسجيل الدخول الآمن</h2>
            <p className="login-subtitle">أدخل بيانات اعتماد الجهة القضائية للمتابعة</p>
            {from !== '/' && (
              <span className="login-return-chip">ستُعاد تلقائياً إلى الصفحة المطلوبة فور تسجيل الدخول</span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="login-form" aria-busy={loading}>
            <div className="form-field">
              <label className="form-label" htmlFor="email">
                البريد الإلكتروني المؤسسي
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
                  placeholder="••••••••"
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
                  <>
                    <span className="login-submit-icon">🔒</span>
                    دخول إلى النظام
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="login-test-accounts">
            <div className="login-test-accounts-title">حسابات تجريبية للعرض السريع</div>
            <p className="login-test-accounts-note">
              اختر حسابًا للدخول الفوري — كلمة المرور: <strong>{TEST_PASSWORD}</strong>
            </p>
            <ul className="login-test-accounts-list">
              {TEST_ACCOUNTS.map((account) => (
                <li key={account.email}>
                  <button
                    type="button"
                    className="login-test-account-item"
                    onClick={() => fillTestAccount(account)}
                  >
                    <span className="login-test-account-role">{account.role}</span>
                    <span className="login-test-account-email">{account.email}</span>
                    <span className={`login-test-account-badge ${account.badgeClass}`}>{account.badge}</span>
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
