import { useNavigate } from 'react-router-dom'

export default function شريط_الإشعارات({ banner }) {
  const navigate = useNavigate()

  if (!banner) return null

  return (
    <section className={`notification-strip notification-strip--${banner.tone}`}>
      <div className="notification-strip__content">
        <span className="notification-strip__eyebrow">إشعار فوري</span>
        <strong className="notification-strip__title">{banner.title}</strong>
        <p className="notification-strip__message">{banner.message}</p>
      </div>
      {banner.actionLabel && (
        <button
          type="button"
          className="notification-strip__action"
          onClick={() => navigate('/القضايا', { state: banner.actionState })}
        >
          {banner.actionLabel}
        </button>
      )}
    </section>
  )
}
