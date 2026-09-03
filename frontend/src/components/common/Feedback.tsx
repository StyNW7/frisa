import type { LucideIcon } from 'lucide-react'
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useApp'
import type { ToastTone } from '@/store/ToastContext'

/* -------------------------------------------------------------------------- */
/*  EmptyState                                                                 */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-10 text-center', className)}>
      <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-frisa-50 text-frisa-600">
        <Icon className="h-7 w-7" strokeWidth={1.8} aria-hidden />
      </span>
      <h3 className="text-[15px] font-bold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-[280px] text-[13px] leading-relaxed text-ink-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Skeletons                                                                  */
/* -------------------------------------------------------------------------- */

export function SkeletonCard({ lines = 2, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('card flex items-center gap-3 p-3.5', className)}>
      <div className="skeleton h-12 w-12 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-2/5 rounded-full" />
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skeleton h-2.5 rounded-full" style={{ width: `${72 - i * 18}%` }} />
        ))}
      </div>
    </div>
  )
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-3xl', className)} />
}

/* -------------------------------------------------------------------------- */
/*  Toast                                                                      */
/* -------------------------------------------------------------------------- */

const TONE_STYLES: Record<ToastTone, { icon: LucideIcon; ring: string; tint: string }> = {
  success: { icon: CircleCheck, ring: 'ring-frisa-100', tint: 'bg-frisa-50 text-frisa-600' },
  info: { icon: Info, ring: 'ring-info-100', tint: 'bg-info-50 text-info-600' },
  warning: { icon: TriangleAlert, ring: 'ring-ember-100', tint: 'bg-ember-50 text-ember-600' },
  error: { icon: CircleAlert, ring: 'ring-danger-100', tint: 'bg-danger-50 text-danger-600' },
}

export function ToastViewport() {
  const { toasts, dismiss } = useToast()
  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-[70] flex flex-col gap-2 px-4 pt-4"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const { icon: Icon, ring, tint } = TONE_STYLES[toast.tone]
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex animate-toast-in items-start gap-3 rounded-2xl bg-surface p-3 pr-2.5 shadow-lift ring-1',
              ring,
            )}
          >
            <span className={cn('mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', tint)}>
              <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[13px] font-bold leading-tight text-ink">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 text-xs leading-snug text-ink-muted">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-mist hover:text-ink"
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
