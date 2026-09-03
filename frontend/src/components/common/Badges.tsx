import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, CalendarClock, CircleCheck, CircleDot, Info } from 'lucide-react'
import { cn, daysRemainingLabel, daysUntil, RISK_LABEL, riskLevel } from '@/lib/utils'
import type { RiskLevel } from '@/types'

/* -------------------------------------------------------------------------- */
/*  StatusChip                                                                 */
/* -------------------------------------------------------------------------- */

export type ChipTone = 'green' | 'orange' | 'neutral' | 'danger' | 'info' | 'onGreen'

const CHIP_TONES: Record<ChipTone, string> = {
  green: 'bg-frisa-50 text-frisa-700 ring-1 ring-inset ring-frisa-100',
  orange: 'bg-ember-50 text-ember-700 ring-1 ring-inset ring-ember-100',
  neutral: 'bg-mist text-ink-muted ring-1 ring-inset ring-line',
  danger: 'bg-danger-50 text-danger-600 ring-1 ring-inset ring-danger-100',
  info: 'bg-info-50 text-info-600 ring-1 ring-inset ring-info-100',
  onGreen: 'bg-white/15 text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm',
}

export function StatusChip({
  icon: Icon,
  children,
  tone = 'neutral',
  className,
}: {
  icon?: LucideIcon
  children: React.ReactNode
  tone?: ChipTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-semibold leading-none',
        CHIP_TONES[tone],
        className,
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden /> : null}
      {children}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  RiskBadge                                                                  */
/* -------------------------------------------------------------------------- */

const RISK_STYLES: Record<RiskLevel, { chip: string; bar: string; icon: LucideIcon }> = {
  critical: { chip: 'bg-danger-50 text-danger-600', bar: 'bg-danger-500', icon: AlertTriangle },
  high: { chip: 'bg-ember-50 text-ember-700', bar: 'bg-ember-500', icon: AlertTriangle },
  medium: { chip: 'bg-ember-50/70 text-ember-700', bar: 'bg-ember-300', icon: Info },
  low: { chip: 'bg-frisa-50 text-frisa-700', bar: 'bg-frisa-400', icon: CircleCheck },
}

export function riskStyles(level: RiskLevel) {
  return RISK_STYLES[level]
}

/**
 * Waste risk always ships as number + word + icon, never colour alone.
 */
export function RiskBadge({
  score,
  size = 'md',
  className,
}: {
  score: number
  size?: 'sm' | 'md'
  className?: string
}) {
  const level = riskLevel(score)
  const { chip, icon: Icon } = RISK_STYLES[level]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold leading-none',
        chip,
        size === 'sm' ? 'px-2 py-1 text-2xs' : 'px-2.5 py-1.5 text-xs',
        className,
      )}
      title={`Waste risk ${score} out of 100`}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} strokeWidth={2.4} aria-hidden />
      <span className="num">{score}</span>
      <span className="opacity-70">{RISK_LABEL[level]}</span>
    </span>
  )
}

/** Slim meter used on detail screens. */
export function RiskMeter({ score, className }: { score: number; className?: string }) {
  const level = riskLevel(score)
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-mist', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', RISK_STYLES[level].bar)}
        style={{ width: `${Math.max(4, score)}%` }}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Waste risk score"
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  ExpiryBadge                                                                */
/* -------------------------------------------------------------------------- */

export function ExpiryBadge({
  expiresAt,
  shelfStable,
  className,
}: {
  expiresAt: string
  shelfStable?: boolean
  className?: string
}) {
  const days = daysUntil(expiresAt)
  const urgent = !shelfStable && days <= 2
  const soon = !shelfStable && days <= 5
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-2xs font-semibold leading-none',
        urgent
          ? 'bg-ember-50 text-ember-700'
          : soon
            ? 'bg-mist text-ink-soft'
            : 'bg-mist text-ink-muted',
        className,
      )}
    >
      {urgent ? (
        <CalendarClock className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
      ) : (
        <CircleDot className="h-3 w-3" strokeWidth={2.2} aria-hidden />
      )}
      {shelfStable ? 'Long shelf life' : daysRemainingLabel(days)}
    </span>
  )
}
