import { Link } from 'react-router-dom'
import { ChevronRight, MapPin } from 'lucide-react'
import type { FoodItem } from '@/types'
import { FoodAvatar } from '@/components/common/FoodAvatar'
import { ExpiryBadge, RiskBadge, RiskMeter } from '@/components/common/Badges'
import { cn, daysUntil, formatDate, formatQuantity, riskScore, rupiah } from '@/lib/utils'

export function FoodCard({ item, className }: { item: FoodItem; className?: string }) {
  const score = riskScore(item)
  const days = daysUntil(item.expiresAt)

  return (
    <Link
      to={`/food/${item.id}`}
      className={cn(
        'card press flex items-center gap-3 p-3.5 hover:border-frisa-200 hover:shadow-lift',
        className,
      )}
    >
      <FoodAvatar name={item.name} category={item.category} size="lg" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold leading-tight text-ink">{item.name}</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              {item.category} · {formatQuantity(item)}
            </p>
          </div>
          <RiskBadge score={score} size="sm" />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <ExpiryBadge expiresAt={item.expiresAt} shelfStable={item.shelfStable} />
          <span className="inline-flex items-center gap-1 text-2xs font-medium text-ink-faint">
            <MapPin className="h-3 w-3" strokeWidth={2.2} aria-hidden />
            {item.storage}
          </span>
        </div>

        <div className="mt-2.5 flex items-center gap-2.5">
          <RiskMeter score={score} className="h-1.5 flex-1" />
          <span className="num shrink-0 text-2xs font-semibold text-ink-muted">{rupiah(item.value)}</span>
        </div>
      </div>

      <ChevronRight className="h-[18px] w-[18px] shrink-0 self-center text-ink-faint" strokeWidth={2.2} aria-hidden />
      <span className="sr-only">
        {item.shelfStable ? 'Long shelf life' : `Expires ${formatDate(item.expiresAt)}, ${days} days remaining`}
      </span>
    </Link>
  )
}

export function FoodTile({ item, className }: { item: FoodItem; className?: string }) {
  const score = riskScore(item)

  return (
    <Link
      to={`/food/${item.id}`}
      className={cn('card press flex flex-col p-3.5 hover:border-frisa-200 hover:shadow-lift', className)}
    >
      <div className="flex items-start justify-between">
        <FoodAvatar name={item.name} category={item.category} size="md" />
        <RiskBadge score={score} size="sm" />
      </div>
      <p className="mt-3 truncate text-sm font-bold leading-tight text-ink">{item.name}</p>
      <p className="mt-0.5 text-xs text-ink-muted">{formatQuantity(item)}</p>
      <div className="mt-2.5">
        <ExpiryBadge expiresAt={item.expiresAt} shelfStable={item.shelfStable} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <RiskMeter score={score} className="h-1.5 flex-1" />
      </div>
      <p className="num mt-2 text-2xs font-semibold text-ink-faint">{rupiah(item.value)}</p>
    </Link>
  )
}
