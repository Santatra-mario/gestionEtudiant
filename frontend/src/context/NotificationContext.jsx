// context/NotificationContext.jsx — Système de notifications global
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react'
import ReactDOM from 'react-dom'

const NotificationContext = createContext(null)

/* ═══════════════════════════════════════════════════════════
   COMPOSANT TOAST
═══════════════════════════════════════════════════════════ */
function Toast({ id, type, message, onClose, duration = 4000 }) {
  const [visible, setVisible] = useState(true)

  // Auto-fermeture après duration
  useEffect(() => {
    if (duration <= 0) return
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onClose(id), 300)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, id, onClose])

  const config = {
    success: { bg: 'rgba(34,197,94,0.12)', border: '#16a34a', icon: CheckCircle, color: 'var(--success)' },
    error: { bg: 'rgba(239,68,68,0.12)', border: '#dc2626', icon: AlertCircle, color: 'var(--danger)' },
    warning: { bg: 'rgba(245,158,11,0.12)', border: '#d97706', icon: AlertTriangle, color: 'var(--warning)' },
    info: { bg: 'rgba(79,142,247,0.12)', border: '#2563eb', icon: Info, color: 'var(--accent)' },
  }

  const { bg, border, icon: Icon, color } = config[type] || config.info

  return (
    <div
      style={{
        animation: visible ? 'slideInRight 0.3s ease' : 'slideOutRight 0.3s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(400px)',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          padding: '14px 16px',
          borderRadius: 'var(--radius-lg)',
          background: bg,
          border: `2px solid ${border}`,
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          marginBottom: 12,
          minWidth: 300,
          maxWidth: 400,
        }}
      >
        <Icon size={18} style={{ flexShrink: 0, color, marginTop: 2 }} />
        <p style={{ flex: 1, color: 'var(--text)', fontSize: 14, margin: 0, lineHeight: 1.4 }}>
          {message}
        </p>
        <button
          onClick={() => {
            setVisible(false)
            setTimeout(() => onClose(id), 300)
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
          aria-label="Fermer la notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   CONTENEUR DE TOASTS
═══════════════════════════════════════════════════════════ */
function ToastContainer({ toasts, onCloseToast }) {
  const portalRoot = document.getElementById('toast-portal') || document.body

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: 8,
        maxHeight: '100vh',
        overflowY: 'auto',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(toast => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <Toast
            id={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={onCloseToast}
            duration={toast.duration}
          />
        </div>
      ))}
    </div>,
    portalRoot
  )
}

/* ═══════════════════════════════════════════════════════════
   PROVIDER
═══════════════════════════════════════════════════════════ */
export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showNotification = useCallback((type, message, duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, type, message, duration }])
    return id
  }, [])

  const closeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const notify = {
    success: (message, duration) => showNotification('success', message, duration),
    error: (message, duration) => showNotification('error', message, duration ?? 5000),
    warning: (message, duration) => showNotification('warning', message, duration),
    info: (message, duration) => showNotification('info', message, duration),
  }

  return (
    <NotificationContext.Provider value={notify}>
      <ToastContainer toasts={toasts} onCloseToast={closeToast} />
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    console.warn('useNotification utilisé en dehors de NotificationProvider')
    return {
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
    }
  }
  return context
}
