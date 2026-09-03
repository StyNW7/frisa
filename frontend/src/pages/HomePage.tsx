import { useEffect, useMemo, useState } from 'react'
import { HomeHeader } from '@/components/home/HomeHeader'
import { StatusHeroCard } from '@/components/home/StatusHeroCard'
import { PriorityRail } from '@/components/home/PriorityRail'
import { SmartSuggestionCard } from '@/components/home/SmartSuggestionCard'
import { QuickActions, RecentActivity, SavingsSummaryCard } from '@/components/home/HomeSections'
import { SkeletonBlock, SkeletonCard } from '@/components/common/Feedback'
import { useApp } from '@/hooks/useApp'
import { deriveRecipes, sortRecommended } from '@/lib/recipes'
import { RECIPES } from '@/data/recipes'

export function HomePage() {
  const { items } = useApp()
  const [loading, setLoading] = useState(true)

  /* A short skeleton pass on first paint: the app is talking to the hub. */
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 520)
    return () => window.clearTimeout(timer)
  }, [])

  const suggestion = useMemo(() => sortRecommended(deriveRecipes(RECIPES, items))[0], [items])

  return (
    <div className="pb-8">
      <div
        className="relative"
        style={{ background: 'linear-gradient(180deg, #168653 0%, #1CA167 62%, #25B877 100%)' }}
      >
        <div className="pointer-events-none absolute -right-14 -top-10 h-44 w-44 rounded-full border border-white/10" aria-hidden />
        <div className="pointer-events-none absolute -left-16 top-16 h-52 w-52 rounded-full border border-white/10" aria-hidden />
        <HomeHeader />
        {/* Green the hero card overlaps into. Taller than the overlap so the card
            never crowds the fridge selector above it. */}
        <div className="h-24" />
      </div>

      {/* `relative` is required, not decorative: the green header above is positioned,
          and CSS paints positioned elements over static siblings whatever the DOM
          order, which would otherwise hide the top of the hero card. */}
      <div className="relative z-10 -mt-14 space-y-7 px-5">
        {loading ? <SkeletonBlock className="h-[148px]" /> : <StatusHeroCard />}

        {loading ? (
          <div className="space-y-3">
            <SkeletonBlock className="h-5 w-40 rounded-full" />
            <div className="flex gap-3">
              <SkeletonBlock className="h-[188px] w-[220px] shrink-0" />
              <SkeletonBlock className="h-[188px] w-[220px] shrink-0" />
            </div>
          </div>
        ) : (
          <PriorityRail />
        )}

        {loading ? <SkeletonBlock className="h-[228px]" /> : suggestion ? <SmartSuggestionCard recipe={suggestion} /> : null}

        <QuickActions />

        <SavingsSummaryCard />

        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <RecentActivity />
        )}
      </div>
    </div>
  )
}
