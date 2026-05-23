// components/ui/ConfirmationModal.jsx — Modal de confirmation cohérente et accessible
import { AlertTriangle, Trash2, CheckCircle } from 'lucide-react'
import { Modal, Btn } from './index'

export function ConfirmationModal({
  open,
  title = 'Confirmation',
  message = 'Êtes-vous sûr de cette action ?',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger', // danger, warning, info
  loading = false,
  onConfirm,
  onCancel,
  dangerZone = false, // Si true, ajoute un avertissement visuel
}) {
  if (!open) return null

  const configs = {
    danger: {
      icon: Trash2,
      color: 'var(--danger)',
      bg: 'rgba(239,68,68,0.1)',
      btnVariant: 'danger',
    },
    warning: {
      icon: AlertTriangle,
      color: 'var(--warning)',
      bg: 'rgba(245,158,11,0.1)',
      btnVariant: 'danger',
    },
    info: {
      icon: CheckCircle,
      color: 'var(--accent)',
      bg: 'rgba(79,142,247,0.1)',
      btnVariant: 'primary',
    },
  }

  const config = configs[variant] || configs.danger
  const Icon = config.icon

  return (
    <Modal title={title} onClose={onCancel} width={420}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* ── Icône et message ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '12px 14px',
            borderRadius: 'var(--radius-lg)',
            background: config.bg,
            border: `1px solid ${config.color}40`,
          }}
        >
          <Icon size={20} color={config.color} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 14, color: 'var(--text)', margin: 0, lineHeight: 1.5 }}>
            {message}
          </p>
        </div>

        {/* ── Zone danger optionnelle ── */}
        {dangerZone && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              fontSize: 12,
              color: 'var(--danger)',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            ⚠️ Cette action est irréversible
          </div>
        )}

        {/* ── Boutons ── */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Btn
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
            aria-label={cancelText}
          >
            {cancelText}
          </Btn>
          <Btn
            variant={config.btnVariant}
            onClick={onConfirm}
            disabled={loading}
            loading={loading}
            aria-label={confirmText}
          >
            {confirmText}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
