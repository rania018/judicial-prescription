import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

let toastIdCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((type, message, timeout = 4000) => {
    toastIdCounter += 1
    const id = toastIdCounter
    setToasts((prev) => [...prev, { id, type, message }])

    if (timeout > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, timeout)
    }
  }, [])

  const value = {
    success: (message, timeout) => addToast('success', message, timeout),
    error: (message, timeout) => addToast('error', message, timeout),
    info: (message, timeout) => addToast('info', message, timeout),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}

