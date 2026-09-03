import { Link } from 'react-router-dom'
import { BatteryMedium, CircleCheck, RefreshCw, Thermometer, TriangleAlert } from 'lucide-react'
import { StatusChip } from '@/components/common/Badges'
import { FrisaMark } from '@/components/common/FrisaMark'
import { useApp } from '@/hooks/useApp'
import { pluralize, relativeMinutes } from '@/lib/utils'

/**
 * The card that answers "what is happening inside my refrigerator?" in one glance.
 * The headline changes with the state of the fridge, so on demo day it opens with
 * the sentence the presenter needs.
 */
export function StatusHeroCard() {
  const { activeFridge, items, priorityItems } = useApp()
  const attention = priorityItems.length

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start gap-3.5 p-4">
        <span className="relative inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-frisa-50">
          <span className="absolute inset-0 animate-pulse-ring rounded-2xl bg-frisa-200/70" aria-hidden />
          <FrisaMark className="relative h-9 w-9" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-extrabold leading-tight tracking-tight text-ink">
            {attention > 0
              ? `${attention} ${attention === 1 ? 'food needs' : 'foods need'} your attention`
              : 'Your fridge looks good today'}
          </h2>
          <p className="mt-1 text-[13px] leading-snug text-ink-muted">
            {attention > 0
              ? `FRISA is monitoring ${pluralize(items.length, 'item')} and flagged the ones worth using first.`
              : `FRISA is monitoring ${pluralize(items.length, 'item')}. Nothing is close to expiring.`}
          </p>
        </div>
      </div>

      <div className="hide-scrollbar edge-fade flex gap-1.5 overflow-x-auto px-4 pb-3.5">
        <StatusChip tone={activeFridge.online ? 'green' : 'neutral'} icon={CircleCheck} className="shrink-0">
          {activeFridge.online ? 'Connected' : 'Offline'}
        </StatusChip>
        <StatusChip tone="neutral" icon={Thermometer} className="shrink-0">
          {activeFridge.temperature.toFixed(1)}&deg;C stable
        </StatusChip>
        <StatusChip tone={attention > 0 ? 'orange' : 'green'} icon={attention > 0 ? TriangleAlert : CircleCheck} className="shrink-0">
          {attention > 0 ? `${attention} at risk` : 'All fresh'}
        </StatusChip>
      </div>

      <Link
        to="/device"
        className="flex items-center justify-between gap-3 border-t border-line bg-mist/40 px-4 py-3 transition-colors hover:bg-mist"
      >
        <span className="flex items-center gap-1.5 text-2xs font-semibold text-ink-muted">
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
          Synced {relativeMinutes(activeFridge.lastSyncMinutes)}
        </span>
        <span className="flex items-center gap-1.5 text-2xs font-semibold text-ink-muted">
          <BatteryMedium className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          Hub battery <span className="num text-ink">{activeFridge.battery}%</span>
        </span>
      </Link>
    </div>
  )
}
