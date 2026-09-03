import { createContext, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { uid } from '@/lib/utils'

export type ToastTone = 'success' | 'info' | 'warning' | 'error'

export interface ToastRecord {
  id: string
  title: string
  description?: string
  tone: ToastTone
}

export interface ToastContextValue {
  toasts: ToastRecord[]
  toast: (title: string, opts?: { description?: string; tone?: ToastTone; duration?: number }) => void
  dismiss: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const timers = useRef(new Map<string, number>())

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback<ToastContextValue['toast']>(
    (title, opts) => {
      const id = uid('toast')
      const record: ToastRecord = {
        id,
        title,
        description: opts?.description,
        tone: opts?.tone ?? 'success',
      }
      setToasts((current) => [...current.slice(-2), record])
      const timer = window.setTimeout(() => dismiss(id), opts?.duration ?? 3200)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}
