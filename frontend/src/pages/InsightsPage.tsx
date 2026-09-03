import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Calendar,
  ChartNoAxesCombined,
  Leaf,
  Milk,
  Package,
  Sprout,
  Table2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import type { InsightTone, PeriodKey } from '@/types'
import { PageHeader } from '@/components/common/TopHeader'
import { MetricCard, SectionHeader, SegmentedControl } from '@/components/common/Primitives'
import {
  ChartCard,
  ConsumptionSplitChart,
  DataTable,
  FoodSavedTrendChart,
  MoneySavedChart,
  WasteByCategoryChart,
} from '@/components/insights/Charts'
import { INSIGHT_DATA, PERIODS } from '@/data/insights'
import { useApp } from '@/hooks/useApp'
import { cn, kg, rupiah, rupiahShort } from '@/lib/utils'

const INSIGHT_ICONS: Record<string, LucideIcon> = {
  sprout: Sprout,
  calendar: Calendar,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  milk: Milk,
  wallet: Wallet,
  leaf: Leaf,
}

const TONE_STYLES: Record<InsightTone, string> = {
  positive: 'bg-frisa-50 text-frisa-600',
  attention: 'bg-ember-50 text-ember-600',
  neutral: 'bg-mist text-ink-soft',
}

export function InsightsPage() {
  const { savingsFor, sessionSavings, activeFridge } = useApp()
  const [period, setPeriod] = useState<PeriodKey>('30d')
  const [view, setView] = useState<'charts' | 'table'>('charts')

  const data = INSIGHT_DATA[period]
  const summary = savingsFor(period)

  /* Anything rescued during this session is folded into the most recent bucket,
     so completing a recipe visibly moves the trend. */
  const savedTrend = useMemo(() => {
    const rows = data.savedTrend.map((point) => ({ ...point }))
    if (rows.length && sessionSavings.foodSavedKg > 0) {
      const last = rows[rows.length - 1]
      last.value = Math.round((last.value + sessionSavings.foodSavedKg) * 100) / 100
    }
    return rows
  }, [data.savedTrend, sessionSavings.foodSavedKg])

  const moneyTrend = useMemo(() => {
    const rows = data.moneyTrend.map((point) => ({ ...point }))
    if (rows.length && sessionSavings.moneySaved > 0) {
      const last = rows[rows.length - 1]
      last.value += sessionSavings.moneySaved
    }
    return rows
  }, [data.moneyTrend, sessionSavings.moneySaved])

  const metrics = [
    { icon: Leaf, label: 'Food saved', value: kg(summary.foodSavedKg), caption: 'Eaten instead of discarded', tone: 'green' as const },
    { icon: Package, label: 'Items rescued', value: `${summary.itemsRescued}`, caption: 'Used before the expiry date', tone: 'green' as const },
    { icon: TrendingUp, label: 'Waste reduction', value: `${summary.wasteReductionPct}%`, caption: 'Against your own baseline', tone: 'orange' as const },
    { icon: Sprout, label: 'CO2e avoided', value: `${summary.co2Kg} kg`, caption: 'Estimated, not certified', tone: 'info' as const },
  ]

  return (
    <div className="pb-8">
      {/* Header and the single filter row scroll as one sticky block. */}
      <div className="sticky top-0 z-30 bg-canvas/95 backdrop-blur-md">
      <PageHeader
        title="Consumption Insights"
        subtitle={`How ${activeFridge.name} is performing`}
        sticky={false}
        bordered={false}
        right={
          <button
            type="button"
            aria-label={view === 'charts' ? 'Show data as tables' : 'Show data as charts'}
            aria-pressed={view === 'table'}
            onClick={() => setView((v) => (v === 'charts' ? 'table' : 'charts'))}
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors',
              view === 'table'
                ? 'border-frisa-500 bg-frisa-50 text-frisa-700'
                : 'border-line bg-surface text-ink-soft hover:bg-mist',
            )}
          >
            {view === 'charts' ? (
              <Table2 className="h-[18px] w-[18px]" strokeWidth={2} />
            ) : (
              <BarChart3 className="h-[18px] w-[18px]" strokeWidth={2} />
            )}
          </button>
        }
      />

        {/* One filter row above everything it scopes. */}
        <div className="border-b border-line px-5 pb-3">
          <SegmentedControl<PeriodKey>
            label="Reporting period"
            value={period}
            onChange={setPeriod}
            options={PERIODS.map((p) => ({ value: p.key, label: p.label }))}
          />
        </div>
      </div>

      <div className="space-y-6 px-5 pt-5">
        {/* Hero metric */}
        <section
          className="relative overflow-hidden rounded-3xl border border-frisa-100 p-5"
          style={{ background: 'linear-gradient(135deg, #EAF8F1 0%, #FFFFFF 62%, #FFF6EC 100%)' }}
        >
          <span className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border border-frisa-100" aria-hidden />
          <p className="text-[13px] font-semibold text-frisa-700">{data.heroLabel}</p>
          <p className="mt-1.5 text-[40px] font-extrabold leading-none tracking-tight text-ink">
            {rupiah(summary.moneySaved)}
          </p>
          <p className="mt-2.5 max-w-[85%] text-[13px] leading-relaxed text-ink-muted">
            by consuming food before it became waste.
          </p>
          {sessionSavings.moneySaved > 0 ? (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-frisa-500 px-3 py-1.5 text-2xs font-bold text-white">
              <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
              <span className="num">+{rupiahShort(sessionSavings.moneySaved)}</span> since you opened the app
            </p>
          ) : null}
        </section>

        {/* Metric grid */}
        <section className="grid grid-cols-2 gap-3">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>

        {view === 'charts' ? (
          <>
            <ChartCard
              title="Food saved trend"
              subtitle={`Kilograms rescued per ${period === '3m' ? 'month' : period === '30d' ? 'week' : 'day'}.`}
              footnote="Counted when an item at risk is used, cooked or marked as consumed before its expiry date."
            >
              <FoodSavedTrendChart data={savedTrend} />
            </ChartCard>

            <ChartCard
              title="Consumed vs wasted"
              subtitle="Share of everything that entered this fridge during the period."
            >
              <ConsumptionSplitChart split={data.split} />
            </ChartCard>

            <ChartCard
              title="Food waste by category"
              subtitle="Where the remaining waste still comes from."
              footnote="Vegetables and leftovers lose value fastest, so FRISA ranks them highest in Use These First."
            >
              <WasteByCategoryChart data={data.wasteByCategory} />
            </ChartCard>

            <ChartCard
              title="Money saved trend"
              subtitle="Rupiah value of the food you used in time."
            >
              <MoneySavedChart data={moneyTrend} />
            </ChartCard>
          </>
        ) : (
          <div className="space-y-4">
            <DataTable
              caption="Food saved"
              columns={[period === '3m' ? 'Month' : period === '30d' ? 'Week' : 'Day', 'Kilograms']}
              rows={savedTrend.map((point) => [point.label, `${point.value} kg`])}
            />
            <DataTable
              caption="Money saved"
              columns={[period === '3m' ? 'Month' : period === '30d' ? 'Week' : 'Day', 'Amount']}
              rows={moneyTrend.map((point) => [point.label, rupiah(point.value)])}
            />
            <DataTable
              caption="Consumed vs wasted"
              columns={['Outcome', 'Share']}
              rows={[
                ['Consumed', `${data.split.consumed}%`],
                ['Wasted', `${data.split.wasted}%`],
                ['Still in inventory', `${data.split.inventory}%`],
              ]}
            />
            <DataTable
              caption="Food waste by category"
              columns={['Category', 'Kilograms']}
              rows={data.wasteByCategory.map((point) => [point.label, `${point.value} kg`])}
            />
          </div>
        )}

        {/* Smart insights */}
        <section>
          <SectionHeader
            title="Smart Insights"
            subtitle="What FRISA noticed about this household."
          />
          <div className="space-y-3">
            {data.insights.map((insight) => {
              const Icon = INSIGHT_ICONS[insight.icon] ?? ChartNoAxesCombined
              return (
                <article key={insight.id} className="card flex gap-3 p-4">
                  <span
                    className={cn(
                      'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                      TONE_STYLES[insight.tone],
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-bold leading-snug text-ink">{insight.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{insight.body}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <p className="px-1 text-center text-2xs leading-relaxed text-ink-faint">
          Savings are estimated from the value you record for each item. CO2e uses an average factor for household
          food waste and is an indication of direction, not a certified measurement.
        </p>
      </div>
    </div>
  )
}
