import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { listCases } from '../services/caseService'
import { buildCaseAlerts } from '../utils/dashboardAlerts'
import شارة_الحالة from './شارة_الحالة.jsx'

export default function جرس_التنبيهات() {
  const navigate = useNavigate()
  const panelRef = useRef(null)
  const { user, role, userProfile } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      setAlerts([])
      return
    }

    let active = true

    const loadAlerts = async () => {
      setLoading(true)
      try {
        const cases = await listCases({
          userId: user.uid,
          userRole: role,
          userContext: userProfile,
        })
        if (active) {
          setAlerts(buildCaseAlerts(cases, role).slice(0, 8))
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadAlerts()

    return () => {
      active = false
    }
  }, [role, user, userProfile])

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const urgentCount = useMemo(
    () => alerts.filter((alert) => alert.priority === 'high').length,
    [alerts],
  )

  const openAlert = (alert) => {
    setOpen(false)
    navigate(alert.to.pathname, alert.to.state ? { state: alert.to.state } : undefined)
  }

  return (
    <div className="notification-bell" ref={panelRef}>
      <button
        type="button"
        className="notification-bell__button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label="فتح قائمة التنبيهات"
      >
        <span className="notification-bell__icon" aria-hidden="true">
          🔔
        </span>
        {urgentCount > 0 && <span className="notification-bell__count">{urgentCount}</span>}
      </button>

      {open && (
        <div className="notification-bell__panel">
          <div className="notification-bell__header">
            <div>
              <strong>التنبيهات الحالية</strong>
              <p className="notification-bell__subtitle">
                {urgentCount > 0
                  ? `${urgentCount} تنبيهات حرجة أقل من 6 أشهر`
                  : 'لا توجد تنبيهات حرجة حالياً'}
              </p>
            </div>
            <button
              type="button"
              className="notification-bell__link"
              onClick={() => {
                setOpen(false)
                navigate('/')
              }}
            >
              لوحة التحكم
            </button>
          </div>

          {loading ? (
            <div className="notification-bell__loading">
              <span className="spinner" />
              <span>جاري تحميل التنبيهات...</span>
            </div>
          ) : alerts.length === 0 ? (
            <p className="notification-bell__empty">
              لا توجد تنبيهات تتطلب عرضاً فورياً في الوقت الحالي.
            </p>
          ) : (
            <ul className="notification-bell__list">
              {alerts.map((alert) => (
                <li key={alert.id}>
                  <button
                    type="button"
                    className="notification-bell__item"
                    onClick={() => openAlert(alert)}
                  >
                    <div className="notification-bell__item-top">
                      <strong>{alert.caseReference}</strong>
                      <شارة_الحالة status={alert.status} />
                    </div>
                    <p className="notification-bell__item-title">{alert.title}</p>
                    <p className="notification-bell__item-meta">
                      {alert.description} • {alert.remainingLabel}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
