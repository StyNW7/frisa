import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChefHat, CircleCheck, ShieldCheck } from 'lucide-react'
import type { FoodItem } from '@/types'
import { FoodAvatar } from '@/components/common/FoodAvatar'
import { RiskBadge, RiskMeter } from '@/components/common/Badges'
import { ConfirmationSheet } from '@/components/common/BottomSheet'
import { EmptyState } from '@/components/common/Feedback'
import { SectionHeader } from '@/components/common/Primitives'
import { useApp, useToast } from '@/hooks/useApp'
import { daysUntil, expiryPhrase, formatQuantity, riskScore, rupiah } from '@/lib/utils'

/**
 * "Use These First" - the most important widget on Home. Horizontal rail so three
 * items fit above the fold without turning the screen into a list.
 */
export function PriorityRail() {
  const { priorityItems, consumeItem } = useApp()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [pending, setPending] = useState<FoodItem | null>(null)

  const confirmUse = () => {
    if (!pending) return
    const name = pending.name
    const value = pending.value
    consumeItem(pending.id)
    setPending(null)
    toast(`${name} marked as used`, {
      description: `Inventory updated. About ${rupiah(value)} of food rescued.`,
    })
  }

  return (
    <section>
      <SectionHeader
        title="Use These First"
        subtitle="Ranked by FRISA waste risk, not just by date."
        actionLabel="See all"
        actionTo="/inventory?filter=Use%20Soon"
      />

      {priorityItems.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ShieldCheck}
            title="Nothing needs urgent attention"
            description="Your food is in good shape. FRISA will let you know the moment that changes."
          />
        </div>
      ) : (
        <div className="hide-scrollbar edge-fade -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
          {priorityItems.map((item) => {
            const score = riskScore(item)
            const days = daysUntil(item.expiresAt)
            return (
              <article
                key={item.id}
                className="card flex w-[220px] shrink-0 snap-start flex-col p-3.5"
              >
                <Link to={`/food/${item.id}`} className="group">
                  <div className="flex items-start justify-between gap-2">
                    <FoodAvatar name={item.name} category={item.category} size="lg" />
                    <RiskBadge score={score} size="sm" />
                  </div>
                  <p className="mt-3 truncate text-[15px] font-bold leading-tight text-ink group-hover:text-frisa-700">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-ember-700">
                    Expires {expiryPhrase(days).toLowerCase()}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {formatQuantity(item)} · {item.storage}
                  </p>
                  <RiskMeter score={score} className="mt-3 h-1.5" />
                </Link>

                <div className="mt-3.5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPending(item)}
                    className="h-9 flex-1 rounded-xl bg-frisa-500 text-xs font-bold text-white transition-all duration-200 active:scale-95"
                  >
                    Use Now
                  </button>
                  <button
                    type="button"
                    aria-label={`Find a recipe for ${item.name}`}
                    onClick={() => navigate(`/recipes?focus=${item.id}`)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-frisa-50 text-frisa-700 transition-all duration-200 hover:bg-frisa-100 active:scale-95"
                  >
                    <ChefHat className="h-4 w-4" strokeWidth={2.2} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <ConfirmationSheet
        open={Boolean(pending)}
        title={`Use ${pending?.name ?? ''}?`}
        description="FRISA will remove it from your inventory and count it as food rescued."
        confirmLabel="Yes, mark as used"
        onCancel={() => setPending(null)}
        onConfirm={confirmUse}
        detail={
          pending ? (
            <div className="flex items-center gap-3 rounded-2xl bg-frisa-50 p-3.5">
              <CircleCheck className="h-5 w-5 shrink-0 text-frisa-600" strokeWidth={2.2} aria-hidden />
              <p className="text-[13px] leading-snug text-frisa-800">
                {formatQuantity(pending)} will be deducted, and about {rupiah(pending.value)} will be added to this
                month&apos;s savings.
              </p>
            </div>
          ) : null
        }
      />
    </section>
  )
}
