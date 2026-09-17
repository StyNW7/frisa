import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

/**
 * Arrow-key movement for the tab-style controls below. A `role="tablist"` promises
 * a keyboard user that the arrows move between options and that Tab steps past the
 * whole group, so the promise has to be kept.
 */
function useTabListKeys<T extends string>(options: readonly T[], value: T, onChange: (next: T) => void) {
  return (event: ReactKeyboardEvent<HTMLElement>) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End']
    if (!keys.includes(event.key)) return

    const index = options.indexOf(value)
    if (index === -1) return

    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? options.length - 1
          : event.key === 'ArrowRight' || event.key === 'ArrowDown'
            ? (index + 1) % options.length
            : (index - 1 + options.length) % options.length

    event.preventDefault()
    onChange(options[next])
    // Move real focus too, so the roving tabindex and the caret stay together.
    const group = event.currentTarget
    group.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus()
  }
}

/* -------------------------------------------------------------------------- */
/*  SectionHeader                                                              */
/* -------------------------------------------------------------------------- */

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  actionTo,
  onAction,
  className,
}: {
  title: string
  subtitle?: string
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-[17px] font-bold leading-tight tracking-tight text-ink">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[13px] leading-snug text-ink-muted">{subtitle}</p> : null}
      </div>
      {actionLabel && actionTo ? (
        <Link
          to={actionTo}
          className="inline-flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-frisa-700 transition-opacity hover:opacity-70"
        >
          {actionLabel}
          <ChevronRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
        </Link>
      ) : actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-frisa-700 transition-opacity hover:opacity-70"
        >
          {actionLabel}
          <ChevronRight className="h-4 w-4" strokeWidth={2.4} aria-hidden />
        </button>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  MetricCard                                                                 */
/* -------------------------------------------------------------------------- */

export function MetricCard({
  icon: Icon,
  label,
  value,
  caption,
  tone = 'green',
  className,
}: {
  icon: LucideIcon
  label: string
  value: string
  caption?: string
  tone?: 'green' | 'orange' | 'neutral' | 'info'
  className?: string
}) {
  const tint =
    tone === 'green'
      ? 'bg-frisa-50 text-frisa-600'
      : tone === 'orange'
        ? 'bg-ember-50 text-ember-600'
        : tone === 'info'
          ? 'bg-info-50 text-info-600'
          : 'bg-mist text-ink-soft'

  return (
    <div className={cn('card p-3.5', className)}>
      <span className={cn('inline-flex h-9 w-9 items-center justify-center rounded-xl', tint)}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </span>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-0.5 text-xl font-extrabold leading-tight tracking-tight text-ink">{value}</p>
      {caption ? <p className="mt-1 text-2xs leading-snug text-ink-muted">{caption}</p> : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  SegmentedControl                                                           */
/* -------------------------------------------------------------------------- */

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  label,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  className?: string
  label: string
}) {
  const onKeyDown = useTabListKeys(
    options.map((option) => option.value),
    value,
    onChange,
  )

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn('flex gap-1 rounded-2xl bg-mist p-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-9 flex-1 rounded-xl px-3 text-[13px] font-semibold transition-all duration-200',
              active ? 'bg-surface text-ink shadow-card' : 'text-ink-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  FilterPills                                                                */
/* -------------------------------------------------------------------------- */

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const onKeyDown = useTabListKeys(options, value, onChange)

  /* The rail scrolls, and the selection can be set from elsewhere - Home deep links
     into `Use Soon`, for one - so the active pill is brought into view rather than
     left off the right edge where it reads as "no filter applied". */
  useEffect(() => {
    const active = listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')
    active?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [value])

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn('hide-scrollbar edge-fade -mx-5 flex gap-2 overflow-x-auto px-5', className)}
    >
      {options.map((option) => {
        const active = option === value
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option)}
            className={cn(
              'h-9 shrink-0 rounded-full border px-3.5 text-[13px] font-semibold transition-all duration-200 active:scale-95',
              active
                ? 'border-frisa-500 bg-frisa-500 text-white shadow-pill'
                : 'border-line bg-surface text-ink-muted hover:border-frisa-200 hover:text-ink',
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Switch                                                                     */
/* -------------------------------------------------------------------------- */

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200',
        checked ? 'bg-frisa-500' : 'bg-line',
      )}
    >
      <span
        className={cn(
          'absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200',
          checked ? 'left-6' : 'left-1',
        )}
      />
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*  ListRow                                                                    */
/* -------------------------------------------------------------------------- */

export function ListRow({
  icon: Icon,
  title,
  subtitle,
  to,
  onClick,
  right,
  tone = 'neutral',
  className,
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  to?: string
  onClick?: () => void
  right?: React.ReactNode
  tone?: 'neutral' | 'green' | 'orange' | 'danger'
  className?: string
}) {
  const tint =
    tone === 'green'
      ? 'bg-frisa-50 text-frisa-600'
      : tone === 'orange'
        ? 'bg-ember-50 text-ember-600'
        : tone === 'danger'
          ? 'bg-danger-50 text-danger-500'
          : 'bg-mist text-ink-soft'

  const body = (
    <>
      <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', tint)}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-semibold text-ink">{title}</span>
        {subtitle ? <span className="mt-0.5 block truncate text-xs text-ink-muted">{subtitle}</span> : null}
      </span>
      {right ?? <ChevronRight className="h-[18px] w-[18px] shrink-0 text-ink-faint" strokeWidth={2.2} aria-hidden />}
    </>
  )

  const classes = cn(
    'flex w-full items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-mist/60 active:bg-mist',
    className,
  )

  if (to) {
    return (
      <Link to={to} className={classes}>
        {body}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {body}
    </button>
  )
}
