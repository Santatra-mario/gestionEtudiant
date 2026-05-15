import { useState, useCallback } from 'react';

/* ─── Hook de notification réutilisable ─────────────────────────────────── */
export const useNotification = () => {
  const [notification, setNotification] = useState({ message: '', type: '', visible: false });

  const showNotification = useCallback((message, type = 'success', duration = 4000) => {
    setNotification({ message, type, visible: true });
    if (duration > 0) {
      setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), duration);
    }
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, visible: false }));
  }, []);

  const success = useCallback((message) => showNotification(message, 'success', 4000), [showNotification]);
  const error = useCallback((message) => showNotification(message, 'danger', 5000), [showNotification]);
  const warning = useCallback((message) => showNotification(message, 'warning', 4000), [showNotification]);
  const info = useCallback((message) => showNotification(message, 'info', 3500), [showNotification]);

  return {
    notification,
    showNotification,
    hideNotification,
    success,
    error,
    warning,
    info
  };
};

/* ─── Composant de notification réutilisable ───────────────────────────── */
export const NotificationDisplay = ({ notification, onClose }) => {
  if (!notification.visible || !notification.message) return null;

  const icons = {
    success: '✓',
    danger: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const colors = {
    success: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e', border: 'rgba(34,197,94,0.3)' },
    danger: { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', border: 'rgba(239,68,68,0.3)' },
    warning: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    info: { bg: 'rgba(79,142,247,0.12)', text: '#4f8ef7', border: 'rgba(79,142,247,0.3)' }
  };

  const color = colors[notification.type] || colors.info;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        maxWidth: 400,
        animation: 'slideInRight 0.3s ease-out'
      }}
    >
      <div
        style={{
          background: color.bg,
          border: `1px solid ${color.border}`,
          borderRadius: 'var(--radius-lg)',
          padding: '14px 16px',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <span style={{ fontSize: 18, color: color.text, fontWeight: 'bold' }}>
          {icons[notification.type]}
        </span>
        <span style={{ fontSize: 14, color: 'var(--text)', flex: 1, fontWeight: 500 }}>
          {notification.message}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 18,
            padding: 0,
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
