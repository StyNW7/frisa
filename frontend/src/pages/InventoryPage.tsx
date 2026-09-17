import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowUpDown,
  Check,
  FilterX,
  LayoutGrid,
  PackageOpen,
  Plus,
  Rows3,
  Search,
  SearchX,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/common/TopHeader'
import { FilterPills } from '@/components/common/Primitives'
import { FoodCard, FoodTile } from '@/components/inventory/FoodCard'
import { EmptyState } from '@/components/common/Feedback'
import { BottomSheet } from '@/components/common/BottomSheet'
import { Button, LinkButton } from '@/components/common/Button'
import { StatusChip } from '@/components/common/Badges'
import { useApp } from '@/hooks/useApp'
import { cn, daysUntil, isPriority, pluralize, riskScore, rupiah } from '@/lib/utils'

const FILTERS = [
  'All',
  'Use Soon',
  'Fresh',
  'Vegetables',
  'Protein',
  'Dairy',
  'Fruit',
  'Drinks',
  'Frozen',
  'Leftover',
] as const
type Filter = (typeof FILTERS)[number]

const SORTS = [
  { key: 'expiry', label: 'Expiry soonest' },
  { key: 'risk', label: 'Waste risk' },
  { key: 'recent', label: 'Recently added' },
  { key: 'alpha', label: 'Alphabetical' },
] as const
type SortKey = (typeof SORTS)[number]['key']

export function InventoryPage() {
  const { items, activeFridge } = useApp()
  const [params, setParams] = useSearchParams()

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('All')
  const [sort, setSort] = useState<SortKey>('expiry')
  const [grid, setGrid] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  /* Deep link from Home: /inventory?filter=Use%20Soon */
  useEffect(() => {
    const incoming = params.get('filter')
    if (incoming && (FILTERS as readonly string[]).includes(incoming)) {
      setFilter(incoming as Filter)
      const next = new URLSearchParams(params)
      next.delete('filter')
      setParams(next, { replace: true })
    }
  }, [params, setParams])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    let list = items.filter((item) => {
      if (needle && !`${item.name} ${item.category} ${item.storage}`.toLowerCase().includes(needle)) return false
      if (filter === 'All') return true
      if (filter === 'Use Soon') return isPriority(item)
      if (filter === 'Fresh') return !isPriority(item)
      return item.category === filter
    })

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'risk':
          return riskScore(b) - riskScore(a)
        case 'recent':
          return b.addedAt.localeCompare(a.addedAt)
        case 'alpha':
          return a.name.localeCompare(b.name)
        default:
          return daysUntil(a.expiresAt) - daysUntil(b.expiresAt)
      }
    })
    return list
  }, [items, query, filter, sort])

  const useSoonCount = items.filter(isPriority).length
  const totalValue = items.reduce((sum, item) => sum + item.value, 0)
  const activeSort = SORTS.find((s) => s.key === sort)

  return (
    <div className="pb-8">
      <PageHeader
        title="Smart Inventory"
        subtitle={`${pluralize(items.length, 'item')} across your ${activeFridge.name}`}
        right={
          <LinkButton to="/scan" size="sm" aria-label="Add food">
            <Plus className="h-4 w-4" strokeWidth={2.6} aria-hidden />
            Add
          </LinkButton>
        }
      />

      <div className="space-y-3 px-5 pb-1 pt-4">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-faint"
              strokeWidth={2.2}
              aria-hidden
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search food, category or shelf"
              aria-label="Search inventory"
              className="h-11 w-full rounded-2xl border border-line bg-surface pl-11 pr-10 text-sm text-ink placeholder:text-ink-faint focus:border-frisa-300 focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint hover:bg-mist hover:text-ink"
              >
                <X className="h-4 w-4" strokeWidth={2.4} />
              </button>
            ) : null}
          </div>

          <button
            type="button"
            aria-label={grid ? 'Switch to list view' : 'Switch to grid view'}
            onClick={() => setGrid((g) => !g)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface text-ink-soft transition-colors hover:bg-mist"
          >
            {grid ? <Rows3 className="h-[18px] w-[18px]" strokeWidth={2} /> : <LayoutGrid className="h-[18px] w-[18px]" strokeWidth={2} />}
          </button>
        </div>

        <FilterPills options={FILTERS} value={filter} onChange={setFilter} label="Filter inventory" />

        <div className="flex items-center justify-between gap-3 pt-0.5">
          <p className="text-xs text-ink-muted">
            <span className="num font-bold text-ink">{filtered.length}</span> shown ·{' '}
            <span className="num font-semibold text-ink-soft">{rupiah(totalValue)}</span> tracked
          </p>
          <button
            type="button"
            onClick={() => setSortOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-xs font-semibold text-ink-soft transition-colors hover:border-frisa-200"
          >
            <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
            {activeSort?.label}
          </button>
        </div>

        {useSoonCount > 0 && filter === 'All' ? (
          <button
            type="button"
            onClick={() => setFilter('Use Soon')}
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-ember-50 px-4 py-3 text-left transition-colors hover:bg-ember-100"
          >
            <span className="text-[13px] font-semibold text-ember-800">
              {useSoonCount} {useSoonCount === 1 ? 'item needs' : 'items need'} to be used soon
            </span>
            <StatusChip tone="orange">Show</StatusChip>
          </button>
        ) : null}
      </div>

      <div className="px-5 pt-3">
        {filtered.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={query ? SearchX : PackageOpen}
              title={query ? 'No matching food' : 'Nothing in this filter'}
              description={
                query
                  ? `FRISA could not find anything for "${query}" in ${activeFridge.name}.`
                  : 'Try another category, or add something new through the Scan tab.'
              }
              action={
                /* A narrowed view is the usual reason nothing is showing, so the way
                   back to the full inventory comes first. */
                query || filter !== 'All' ? (
                  <div className="flex flex-col items-center gap-2.5">
                    <Button
                      size="md"
                      onClick={() => {
                        setQuery('')
                        setFilter('All')
                      }}
                    >
                      <FilterX className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                      Clear filters
                    </Button>
                    <LinkButton to="/scan" variant="ghost" size="sm">
                      <Plus className="h-4 w-4" strokeWidth={2.6} aria-hidden />
                      Add food instead
                    </LinkButton>
                  </div>
                ) : (
                  <LinkButton to="/scan" size="md">
                    <Plus className="h-4 w-4" strokeWidth={2.6} aria-hidden />
                    Add food
                  </LinkButton>
                )
              }
            />
          </div>
        ) : grid ? (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((item) => (
              <FoodTile key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <FoodCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      <BottomSheet open={sortOpen} onClose={() => setSortOpen(false)} title="Sort inventory">
        <ul className="space-y-1 pb-2">
          {SORTS.map((option) => {
            const active = option.key === sort
            return (
              <li key={option.key}>
                <button
                  type="button"
                  onClick={() => {
                    setSort(option.key)
                    setSortOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm font-semibold transition-colors',
                    active ? 'bg-frisa-50 text-frisa-700' : 'text-ink hover:bg-mist',
                  )}
                >
                  {option.label}
                  {active ? <Check className="h-[18px] w-[18px]" strokeWidth={2.6} aria-hidden /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      </BottomSheet>
    </div>
  )
}
