import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

/**
 * Sticky page header for pushed screens: back affordance, title, optional action.
 */
export function TopHeader({
  title,
  subtitle,
  right,
  back = true,
  onBack,
  transparent,
  className,
}: {
  title: string
  subtitle?: string
  right?: React.ReactNode
  back?: boolean
  onBack?: () => void
  transparent?: boolean
  className?: string
}) {
  const navigate = useNavigate()

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center gap-3 px-4 pb-3 pt-4',
        transparent ? 'bg-transparent' : 'border-b border-line bg-surface/95 backdrop-blur-md',
        className,
      )}
    >
      {back ? (
        <button
          type="button"
          aria-label="Go back"
          onClick={() => (onBack ? onBack() : navigate(-1))}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-ink transition-all duration-200 hover:bg-mist active:scale-95"
        >
          <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </button>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[17px] font-bold leading-tight tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-0.5 truncate text-xs text-ink-muted">{subtitle}</p> : null}
      </div>
      {right ? <div className="flex shrink-0 items-center gap-2">{right}</div> : null}
    </header>
  )
}

/** Larger header for the main tabs, where there is no back affordance. */
export function PageHeader({
  title,
  subtitle,
  right,
  sticky = true,
  bordered = true,
  className,
}: {
  title: string
  subtitle?: string
  right?: React.ReactNode
  /** Turn off when the caller wraps the header in its own sticky container. */
  sticky?: boolean
  bordered?: boolean
  className?: string
}) {
  return (
    <header
      className={cn(
        'bg-canvas/95 px-5 pb-3.5 pt-5 backdrop-blur-md',
        sticky && 'sticky top-0 z-30',
        bordered && 'border-b border-line',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[25px] font-extrabold leading-tight tracking-tight text-ink">{title}</h1>
          {subtitle ? <p className="mt-1 text-[13px] leading-snug text-ink-muted">{subtitle}</p> : null}
        </div>
        {right ? <div className="flex shrink-0 items-center gap-2 pt-1">{right}</div> : null}
      </div>
    </header>
  )
}
