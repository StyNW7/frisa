import { Link, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  ArrowRight,
  ChefHat,
  CircleCheck,
  Leaf,
  Mic,
  Package,
  PencilLine,
  RefreshCw,
  ScanLine,
  ShoppingBasket,
  Sparkles,
  Trash2,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import type { ActivityKind } from '@/types'
import { SectionHeader } from '@/components/common/Primitives'
import { useApp, useUi } from '@/hooks/useApp'
import { cn, formatEventTime, kg, rupiah } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*  Quick actions                                                              */
/* -------------------------------------------------------------------------- */

export function QuickActions() {
  const navigate = useNavigate()
  const { openAssistant } = useUi()

  const actions: Array<{ icon: LucideIcon; label: string; hint: string; onClick: () => void; tone: 'green' | 'orange' }> = [
    {
      icon: ScanLine,
      label: 'Scan Food',
      hint: 'Use the hub camera',
      onClick: () => navigate('/scan'),
      tone: 'green',
    },
    {
      icon: Mic,
      label: 'Ask FRISA',
      hint: 'Voice assistant',
      onClick: () => openAssistant(),
      tone: 'orange',
    },
    {
      icon: PencilLine,
      label: 'Add Manually',
      hint: 'Type the details',
      onClick: () => navigate('/scan?tab=manual'),
      tone: 'green',
    },
    {
      icon: ShoppingBasket,
      label: 'Shopping List',
      hint: 'Avoid overbuying',
      onClick: () => navigate('/shopping'),
      tone: 'orange',
    },
  ]

  return (
    <section>
      <SectionHeader title="Quick Actions" />
      <div className="grid grid-cols-2 gap-3">
        {actions.map(({ icon: Icon, label, hint, onClick, tone }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="card press flex items-center gap-3 p-3.5 text-left hover:border-frisa-200 hover:shadow-lift"
          >
            <span
              className={cn(
                'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                tone === 'green' ? 'bg-frisa-50 text-frisa-600' : 'bg-ember-50 text-ember-600',
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold text-ink">{label}</span>
              <span className="block truncate text-2xs text-ink-muted">{hint}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Savings summary                                                            */
/* -------------------------------------------------------------------------- */

export function SavingsSummaryCard() {
  const { savingsFor } = useApp()
  const summary = savingsFor('30d')

  const tiles = [
    { label: 'Food saved', value: kg(summary.foodSavedKg), icon: Leaf },
    { label: 'Items rescued', value: `${summary.itemsRescued}`, icon: Package },
    { label: 'Waste reduction', value: `${summary.wasteReductionPct}%`, icon: TrendingUp },
  ]

  return (
    <section>
      <SectionHeader title="This Month" actionLabel="Insights" actionTo="/insights" />

      <div className="card overflow-hidden">
        <div
          className="p-4"
          style={{ background: 'linear-gradient(135deg, #EAF8F1 0%, #FFFFFF 70%)' }}
        >
          <div className="flex items-center gap-2 text-2xs font-bold uppercase tracking-[0.16em] text-frisa-700">
            <Wallet className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
            Money saved
          </div>
          <p className="mt-1.5 text-[32px] font-extrabold leading-none tracking-tight text-ink">
            {rupiah(summary.moneySaved)}
          </p>
          <p className="mt-2 text-[13px] leading-snug text-ink-muted">
            by consuming food before it became waste.
          </p>
        </div>

        <dl className="grid grid-cols-3 divide-x divide-line border-t border-line">
          {tiles.map(({ label, value, icon: Icon }) => (
            <div key={label} className="px-3 py-3.5 text-center">
              <Icon className="mx-auto h-4 w-4 text-ink-faint" strokeWidth={2} aria-hidden />
              <dd className="num mt-1.5 text-[15px] font-extrabold leading-none text-ink">{value}</dd>
              <dt className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{label}</dt>
            </div>
          ))}
        </dl>

        <div className="flex items-center gap-2 border-t border-line bg-frisa-50/60 px-4 py-3">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-frisa-600" strokeWidth={2.4} aria-hidden />
          <p className="text-2xs font-semibold text-frisa-800">
            Estimated {summary.co2Kg} kg CO2e avoided this month
          </p>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Recent activity                                                            */
/* -------------------------------------------------------------------------- */

const ACTIVITY_ICON: Record<ActivityKind, { icon: LucideIcon; tone: string }> = {
  added: { icon: Package, tone: 'bg-frisa-50 text-frisa-600' },
  updated: { icon: PencilLine, tone: 'bg-mist text-ink-soft' },
  consumed: { icon: CircleCheck, tone: 'bg-frisa-50 text-frisa-600' },
  flagged: { icon: TriangleAlert, tone: 'bg-ember-50 text-ember-600' },
  recipe: { icon: ChefHat, tone: 'bg-frisa-50 text-frisa-600' },
  wasted: { icon: Trash2, tone: 'bg-danger-50 text-danger-500' },
  sync: { icon: RefreshCw, tone: 'bg-info-50 text-info-600' },
  removed: { icon: Trash2, tone: 'bg-mist text-ink-soft' },
}

export function RecentActivity({ limit = 5 }: { limit?: number }) {
  const { activity } = useApp()
  const rows = activity.slice(0, limit)

  return (
    <section>
      <SectionHeader title="Recent Activity" subtitle="Everything FRISA logged for this household." />

      <div className="card divide-y divide-line overflow-hidden">
        {rows.map((event) => {
          const { icon: Icon, tone } = ACTIVITY_ICON[event.kind]
          return (
            <div key={event.id} className="flex items-start gap-3 px-4 py-3">
              <span className={cn('mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', tone)}>
                <Icon className="h-4 w-4" strokeWidth={2.1} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-snug text-ink">{event.title}</p>
                {event.detail ? <p className="mt-0.5 text-xs text-ink-muted">{event.detail}</p> : null}
              </div>
              <span className="num shrink-0 pt-0.5 text-2xs font-medium text-ink-faint">
                {formatEventTime(event.at)}
              </span>
            </div>
          )
        })}

        <Link
          to="/device"
          className="flex items-center justify-center gap-1.5 px-4 py-3 text-[13px] font-semibold text-frisa-700 transition-colors hover:bg-mist/60"
        >
          <Activity className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          View device timeline
          <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        </Link>
      </div>
    </section>
  )
}
