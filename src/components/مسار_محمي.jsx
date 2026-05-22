import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function مسار_محمي({ children, allowedRoles }) {
  const { user, loading, role } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="centered-page">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="spinner" />
            <span>جارِ تحميل البيانات...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/تسجيل-الدخول" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">صلاحية غير كافية</div>
        </div>
        <p className="muted">
          لا تملك الصلاحية المطلوبة للوصول إلى هذه الصفحة. يرجى التواصل مع
          مسؤول النظام.
        </p>
      </div>
    )
  }

  return children
}

