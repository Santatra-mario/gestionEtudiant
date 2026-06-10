// hooks/useConfirm.js — Hook pour les modales de confirmation cohérentes
import { useState, useCallback } from 'react'

export function useConfirm() {
  const [state, setState] = useState({
    open: false,
    title: 'Confirmation',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    variant: 'danger', // danger, warning, info
    onConfirm: null,
    loading: false,
  })

  const confirm = useCallback((config) => {
    return new Promise((resolve) => {
      setState(prev => ({
        ...prev,
        open: true,
        title: config.title || 'Confirmation',
        message: config.message || '',
        confirmText: config.confirmText || 'Confirmer',
        cancelText: config.cancelText || 'Annuler',
        variant: config.variant || 'danger',
        onConfirm: () => {
          resolve(true)
          setState(prev => ({ ...prev, open: false }))
        },
      }))
    })
  }, [])

  const cancel = useCallback(() => {
    setState(prev => ({ ...prev, open: false }))
  }, [])

  const setLoading = useCallback((loading) => {
    setState(prev => ({ ...prev, loading }))
  }, [])

  return {
    open: state.open,
    title: state.title,
    message: state.message,
    confirmText: state.confirmText,
    cancelText: state.cancelText,
    variant: state.variant,
    loading: state.loading,
    confirm,
    cancel,
    setLoading,
  }
}
