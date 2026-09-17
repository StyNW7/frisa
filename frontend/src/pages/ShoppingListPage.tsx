import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Check, Info, Plus, ShieldCheck, ShoppingBasket, Sparkles, Trash2, X } from 'lucide-react'
import type { ShoppingItem } from '@/types'
import { TopHeader } from '@/components/common/TopHeader'
import { Button } from '@/components/common/Button'
import { BottomSheet } from '@/components/common/BottomSheet'
import { EmptyState } from '@/components/common/Feedback'
import { SectionHeader } from '@/components/common/Primitives'
import { FoodAvatar } from '@/components/common/FoodAvatar'
import { StatusChip } from '@/components/common/Badges'
import { useApp, useToast } from '@/hooks/useApp'
import { cn, formatQuantity, isPriority, pluralize } from '@/lib/utils'

/** One line of the list. Suggested and manual entries differ only in their trailing controls. */
function ShoppingRow({
  entry,
  onToggle,
  onRemove,
  right,
  removeIcon: RemoveIcon = Trash2,
}: {
  entry: ShoppingItem
  onToggle: () => void
  onRemove: () => void
  right?: React.ReactNode
  removeIcon?: LucideIcon
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={entry.checked}
        aria-label={entry.name}
        onClick={onToggle}
        className={cn(
          'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors',
          entry.checked ? 'border-frisa-500 bg-frisa-500 text-white' : 'border-line',
        )}
      >
        {entry.checked ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : null}
      </button>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate text-sm font-semibold',
            entry.checked ? 'text-ink-faint line-through' : 'text-ink',
          )}
        >
          {entry.name}
        </span>
        {entry.note ? <span className="block truncate text-xs text-ink-muted">{entry.note}</span> : null}
      </span>
      {right}
      <button
        type="button"
        aria-label={`Remove ${entry.name}`}
        onClick={onRemove}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-mist hover:text-danger-500"
      >
        <RemoveIcon className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      </button>
    </li>
  )
}

export function ShoppingListPage() {
  const { shopping, items, activeFridge, addShoppingItem, toggleShoppingItem, removeShoppingItem } = useApp()
  const { toast } = useToast()

  const [draft, setDraft] = useState('')
  const [conflict, setConflict] = useState<{ name: string; existing: string } | null>(null)

  const suggested = shopping.filter((s) => s.suggested)
  const manual = shopping.filter((s) => !s.suggested)
  const checked = shopping.filter((s) => s.checked)

  const clearChecked = () => {
    const count = checked.length
    checked.forEach((entry) => removeShoppingItem(entry.id))
    toast(`${pluralize(count, 'item')} cleared`, { tone: 'info', description: 'Ticked items left the list.' })
  }

  /* Overbuying prevention: what the fridge already holds in comfortable quantity. */
  const alreadyAvailable = useMemo(
    () => items.filter((item) => !isPriority(item) && item.quantity > 0).slice(0, 6),
    [items],
  )

  const commit = (name: string) => {
    addShoppingItem(name, '1')
    setDraft('')
    toast(`${name} added to your list`)
  }

  const attemptAdd = () => {
    const name = draft.trim()
    if (!name) return
    const match = items.find((item) => item.name.toLowerCase().includes(name.toLowerCase()) && item.quantity > 0)
    if (match) {
      setConflict({ name, existing: `${formatQuantity(match)} of ${match.name.toLowerCase()}` })
      return
    }
    commit(name)
  }

  return (
    <div className="pb-8">
      <TopHeader title="Shopping List" subtitle="Checked against your inventory before you buy" />

      <div className="space-y-6 px-5 pt-4">
        {/* Add row */}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            attemptAdd()
          }}
          className="flex gap-2"
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add an item"
            aria-label="Add an item to the shopping list"
            className="h-12 min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 text-sm text-ink placeholder:text-ink-faint focus:border-frisa-300 focus:outline-none"
          />
          <Button type="submit" size="lg" className="w-12 px-0" aria-label="Add to list">
            <Plus className="h-[18px] w-[18px]" strokeWidth={2.6} aria-hidden />
          </Button>
        </form>

        <div className="flex items-start gap-2.5 rounded-2xl bg-frisa-50 p-3.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-frisa-600" strokeWidth={2.2} aria-hidden />
          <p className="text-[13px] leading-snug text-frisa-800">
            FRISA checks every addition against {activeFridge.name} so you do not buy food you already own.
          </p>
        </div>

        {/* Suggested refill */}
        <section>
          <SectionHeader
            title="Suggested refill"
            subtitle="Based on how quickly your household uses these."
          />
          {suggested.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={Sparkles}
                title="No refills suggested"
                description="Everything you use regularly is still in stock."
              />
            </div>
          ) : (
            <ul className="card divide-y divide-line overflow-hidden">
              {suggested.map((entry) => (
                <ShoppingRow
                  key={entry.id}
                  entry={entry}
                  onToggle={() => toggleShoppingItem(entry.id)}
                  onRemove={() => removeShoppingItem(entry.id)}
                  removeIcon={X}
                  right={<StatusChip tone="green">{entry.qty}</StatusChip>}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Manual list */}
        <section>
          <SectionHeader
            title="Your list"
            subtitle={`${manual.length} added by you.`}
            actionLabel={checked.length > 0 ? `Clear ${checked.length} ticked` : undefined}
            onAction={checked.length > 0 ? clearChecked : undefined}
          />
          {manual.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={ShoppingBasket}
                title="Your list is empty"
                description="Add anything you plan to buy and FRISA will warn you if it is already in the fridge."
              />
            </div>
          ) : (
            <ul className="card divide-y divide-line overflow-hidden">
              {manual.map((entry) => (
                <ShoppingRow
                  key={entry.id}
                  entry={entry}
                  onToggle={() => toggleShoppingItem(entry.id)}
                  onRemove={() => removeShoppingItem(entry.id)}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Already available. Hidden outright when the fridge has nothing comfortably
            in stock, rather than shown as an empty card that reads as a glitch. */}
        {alreadyAvailable.length > 0 ? (
        <section>
          <SectionHeader title="Already available" subtitle="Do not buy these yet." />
          <ul className="card divide-y divide-line overflow-hidden">
            {alreadyAvailable.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <FoodAvatar name={item.name} category={item.category} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{item.name}</span>
                  <span className="num block truncate text-xs text-ink-muted">{formatQuantity(item)} remaining</span>
                </span>
                <StatusChip tone="neutral">In stock</StatusChip>
              </li>
            ))}
          </ul>
          <p className="mt-2.5 flex items-start gap-2 px-1 text-2xs leading-relaxed text-ink-faint">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden />
            Preventing a duplicate purchase is the cheapest way to cut food waste. FRISA blocks it before it happens.
          </p>
        </section>
        ) : null}
      </div>

      {/* Overbuying guard */}
      <BottomSheet
        open={Boolean(conflict)}
        onClose={() => setConflict(null)}
        title="You already have this"
        description={`FRISA found ${conflict?.existing ?? ''} in ${activeFridge.name}.`}
        footer={
          <div className="flex gap-3">
            <Button variant="outline" size="lg" block onClick={() => setConflict(null)}>
              Cancel
            </Button>
            <Button
              variant="warning"
              size="lg"
              block
              onClick={() => {
                if (conflict) commit(conflict.name)
                setConflict(null)
              }}
            >
              Add anyway
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3 rounded-2xl bg-ember-50 p-3.5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ember-600" strokeWidth={2.2} aria-hidden />
          <p className="text-[13px] leading-relaxed text-ember-800">
            Buying more now usually means one of the two goes to waste. Add it anyway if you are cooking for guests.
          </p>
        </div>
      </BottomSheet>
    </div>
  )
}
