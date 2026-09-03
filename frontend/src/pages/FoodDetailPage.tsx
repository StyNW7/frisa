import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CalendarDays,
  ChefHat,
  ChevronRight,
  CircleCheck,
  Info,
  MapPin,
  Minus,
  PackageX,
  Plus,
  Sparkles,
  Trash2,
  TrendingDown,
  Wallet,
} from 'lucide-react'
import { TopHeader } from '@/components/common/TopHeader'
import { FoodAvatar } from '@/components/common/FoodAvatar'
import { RiskMeter, StatusChip } from '@/components/common/Badges'
import { BottomSheet, ConfirmationSheet } from '@/components/common/BottomSheet'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/Feedback'
import { SectionHeader } from '@/components/common/Primitives'
import { RecipeRow } from '@/components/recipes/RecipeCard'
import { useApp, useToast } from '@/hooks/useApp'
import { deriveRecipes, sortRecommended } from '@/lib/recipes'
import { RECIPES } from '@/data/recipes'
import {
  daysUntil,
  expiryPhrase,
  formatDate,
  formatQuantity,
  RISK_LABEL,
  riskLevel,
  riskScore,
  rupiah,
} from '@/lib/utils'

export function FoodDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { items, fridges, activeFridgeId, setActiveFridge, consumeItem, updateItem, wasteItem, removeItem } =
    useApp()
  const { toast } = useToast()

  const item = items.find((i) => i.id === id)

  /* The item may belong to another connected fridge - offer to switch instead of
     claiming it was thrown away. */
  const elsewhere = item
    ? undefined
    : fridges.find((f) => f.id !== activeFridgeId && f.items.some((i) => i.id === id))

  const [useOpen, setUseOpen] = useState(false)
  const [qtyOpen, setQtyOpen] = useState(false)
  const [wasteOpen, setWasteOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [draftQty, setDraftQty] = useState(item?.quantity ?? 1)

  const recipes = useMemo(() => {
    if (!item) return []
    return sortRecommended(deriveRecipes(RECIPES, items)).filter((recipe) =>
      recipe.ingredients.some((ingredient) => ingredient.foodId === item.id),
    )
  }, [items, item])

  if (!item) {
    return (
      <div>
        <TopHeader title="Food detail" />
        <EmptyState
          icon={PackageX}
          title={elsewhere ? `This item is in your ${elsewhere.name}` : 'This item is no longer in your inventory'}
          description={
            elsewhere
              ? `You are currently viewing another fridge. Switch to ${elsewhere.name} to open it.`
              : 'It was used, wasted or removed. Everything else is still tracked in Smart Inventory.'
          }
          action={
            elsewhere ? (
              <Button
                size="lg"
                onClick={() => {
                  setActiveFridge(elsewhere.id)
                  toast(`Switched to ${elsewhere.name}`)
                }}
              >
                Switch to {elsewhere.name}
              </Button>
            ) : (
              <Button onClick={() => navigate('/inventory')} size="lg">
                Back to inventory
              </Button>
            )
          }
          className="pt-16"
        />
      </div>
    )
  }

  const score = riskScore(item)
  const level = riskLevel(score)
  const days = daysUntil(item.expiresAt)
  const step = item.unit === 'g' || item.unit === 'ml' ? 50 : 1

  const facts = [
    { icon: CalendarDays, label: 'Expiry', value: item.shelfStable ? 'Long shelf life' : formatDate(item.expiresAt, { day: 'numeric', month: 'short', year: 'numeric' }) },
    { icon: PackageX, label: 'Quantity', value: formatQuantity(item) },
    { icon: MapPin, label: 'Storage', value: item.storage },
    { icon: Wallet, label: 'Estimated value', value: rupiah(item.value) },
  ]

  const recommendation =
    score >= 90
      ? 'Use this today. Cooked food loses quality quickly once it has been in the fridge for two days.'
      : score >= 70
        ? 'Use this ingredient today or tomorrow. It is the highest-risk item in this fridge right now.'
        : score >= 40
          ? 'Plan a meal with this within the next few days and it will not go to waste.'
          : 'No action needed. FRISA will remind you when it gets closer to its expiry date.'

  return (
    <div className="flex h-full flex-col">
      <div className="hide-scrollbar flex-1 overflow-y-auto pb-6">
      <TopHeader
        title={item.name}
        subtitle={`${item.category} · ${item.storage}`}
        right={
          <button
            type="button"
            aria-label="Delete item"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-surface text-ink-muted transition-colors hover:border-danger-100 hover:bg-danger-50 hover:text-danger-500"
          >
            <Trash2 className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        }
      />

      <div className="space-y-6 px-5 pt-5">
        {/* Risk hero */}
        <section className="card overflow-hidden">
          <div className="flex items-start gap-4 p-4">
            <FoodAvatar name={item.name} category={item.category} size="xl" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-faint">Waste risk</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="num text-[38px] font-extrabold leading-none tracking-tight text-ink">{score}</span>
                <span className="text-sm font-semibold text-ink-faint">/ 100</span>
                <StatusChip
                  tone={level === 'low' ? 'green' : level === 'critical' ? 'danger' : 'orange'}
                  className="ml-1"
                >
                  {RISK_LABEL[level]}
                </StatusChip>
              </div>
              <RiskMeter score={score} className="mt-3" />
            </div>
          </div>

          <div className="flex items-start gap-2.5 border-t border-line bg-mist/40 px-4 py-3">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" strokeWidth={2.2} aria-hidden />
            <p className="text-2xs leading-relaxed text-ink-muted">
              FRISA combines expiry proximity, remaining quantity, category sensitivity and your household&apos;s
              consumption patterns.
            </p>
          </div>
        </section>

        {/* Facts */}
        <section className="grid grid-cols-2 gap-3">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="card p-3.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-mist text-ink-soft">
                <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <p className="mt-2.5 text-[10px] font-bold uppercase tracking-wide text-ink-faint">{label}</p>
              <p className="num mt-0.5 text-sm font-bold leading-snug text-ink">{value}</p>
            </div>
          ))}
        </section>

        {/* FRISA recommendation */}
        <section
          className="rounded-3xl border border-frisa-100 p-4"
          style={{ background: 'linear-gradient(135deg, #EAF8F1 0%, #FFFFFF 70%)' }}
        >
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-frisa-700">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
            FRISA recommendation
          </span>
          <p className="mt-2.5 text-[15px] font-semibold leading-relaxed text-ink">{recommendation}</p>
          {!item.shelfStable ? (
            <p className="mt-2 text-[13px] text-ink-muted">
              Expires {expiryPhrase(days).toLowerCase()} · {formatDate(item.expiresAt)}
            </p>
          ) : null}
        </section>

        {/* Compatible recipes */}
        <section>
          <SectionHeader
            title="Compatible recipes"
            subtitle={`${recipes.length} ${recipes.length === 1 ? 'recipe uses' : 'recipes use'} this ingredient.`}
          />
          {recipes.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={ChefHat}
                title="No recipe matches yet"
                description="Add more ingredients or adjust your preferences and FRISA will find something."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {recipes.slice(0, 3).map((recipe) => (
                <RecipeRow key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </section>

        {/* History */}
        <section>
          <SectionHeader title="Consumption history" />
          <ol className="card divide-y divide-line overflow-hidden">
            {[
              { label: 'Added to inventory', value: formatDate(item.addedAt, { day: 'numeric', month: 'short' }), icon: Plus },
              {
                label: item.source === 'hub' ? 'Recognised by FRISA Hub' : item.source === 'phone' ? 'Added with phone camera' : 'Added manually',
                value: item.source === 'hub' ? '94% confidence' : 'Confirmed by you',
                icon: CircleCheck,
              },
              { label: 'Remaining now', value: formatQuantity(item), icon: TrendingDown },
            ].map(({ label, value, icon: Icon }) => (
              <li key={label} className="flex items-center gap-3 px-4 py-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-mist text-ink-soft">
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <span className="flex-1 text-[13px] font-semibold text-ink">{label}</span>
                <span className="num text-xs font-semibold text-ink-muted">{value}</span>
              </li>
            ))}
          </ol>
          {item.note ? <p className="mt-2.5 px-1 text-xs leading-relaxed text-ink-muted">{item.note}</p> : null}
        </section>

        {/* Secondary actions */}
        <section className="card divide-y divide-line overflow-hidden">
          <button
            type="button"
            onClick={() => {
              setDraftQty(item.quantity)
              setQtyOpen(true)
            }}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-mist/60"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-mist text-ink-soft">
              <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </span>
            <span className="flex-1 text-sm font-semibold text-ink">Update quantity</span>
            <ChevronRight className="h-[18px] w-[18px] text-ink-faint" strokeWidth={2.2} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setWasteOpen(true)}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-mist/60"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-ember-50 text-ember-600">
              <Trash2 className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </span>
            <span className="flex-1 text-sm font-semibold text-ink">Mark as wasted</span>
            <ChevronRight className="h-[18px] w-[18px] text-ink-faint" strokeWidth={2.2} aria-hidden />
          </button>
          <Link to="/inventory" className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-mist/60">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-mist text-ink-soft">
              <PackageX className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </span>
            <span className="flex-1 text-sm font-semibold text-ink">Back to inventory</span>
            <ChevronRight className="h-[18px] w-[18px] text-ink-faint" strokeWidth={2.2} aria-hidden />
          </Link>
        </section>
      </div>

      </div>

      {/* Persistent action bar */}
      <div className="shrink-0 border-t border-line bg-surface px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3.5">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => navigate(`/recipes?focus=${item.id}`)}
          >
            <ChefHat className="h-[18px] w-[18px]" strokeWidth={2.1} aria-hidden />
            Find Recipe
          </Button>
          <Button size="lg" className="flex-1" onClick={() => setUseOpen(true)}>
            <CircleCheck className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
            Use Item
          </Button>
        </div>
      </div>

      {/* Use item */}
      <ConfirmationSheet
        open={useOpen}
        title={`Use ${item.name}?`}
        description="The full remaining quantity will be deducted and counted as food rescued."
        confirmLabel="Yes, mark as used"
        onCancel={() => setUseOpen(false)}
        onConfirm={() => {
          setUseOpen(false)
          consumeItem(item.id)
          toast(`${item.name} marked as used`, { description: `About ${rupiah(item.value)} of food rescued.` })
          navigate('/inventory')
        }}
        detail={
          <div className="flex items-center gap-3 rounded-2xl bg-frisa-50 p-3.5">
            <CircleCheck className="h-5 w-5 shrink-0 text-frisa-600" strokeWidth={2.2} aria-hidden />
            <p className="text-[13px] leading-snug text-frisa-800">
              {formatQuantity(item)} will leave your inventory and {rupiah(item.value)} will be added to this
              month&apos;s savings.
            </p>
          </div>
        }
      />

      {/* Update quantity */}
      <BottomSheet
        open={qtyOpen}
        onClose={() => setQtyOpen(false)}
        title="Update quantity"
        description={`How much ${item.name.toLowerCase()} is left in ${item.storage.toLowerCase()}?`}
        footer={
          <Button
            size="lg"
            block
            onClick={() => {
              setQtyOpen(false)
              if (draftQty <= 0) {
                removeItem(item.id)
                toast(`${item.name} removed`, { tone: 'info', description: 'The quantity reached zero.' })
                navigate('/inventory')
                return
              }
              updateItem(item.id, { quantity: draftQty })
              toast('Inventory updated', { description: `${item.name} is now ${draftQty} ${item.unit}.` })
            }}
          >
            Save quantity
          </Button>
        }
      >
        <div className="flex items-center justify-between rounded-3xl border border-line bg-mist/50 p-3">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setDraftQty((q) => Math.max(0, Math.round((q - step) * 100) / 100))}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-ink shadow-card transition-transform active:scale-95"
          >
            <Minus className="h-4 w-4" strokeWidth={2.4} />
          </button>
          <div className="text-center">
            <span className="num text-3xl font-extrabold leading-none text-ink">{draftQty}</span>
            <span className="mt-1 block text-xs font-semibold text-ink-muted">{item.unit}</span>
          </div>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setDraftQty((q) => Math.round((q + step) * 100) / 100)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-ink shadow-card transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          Setting the quantity to zero removes the item from {item.storage.toLowerCase()}.
        </p>
      </BottomSheet>

      {/* Mark as wasted */}
      <ConfirmationSheet
        open={wasteOpen}
        title="Mark as wasted?"
        description="This does not count towards your savings, but it teaches FRISA how your household actually consumes food."
        confirmLabel="Mark as wasted"
        tone="warning"
        onCancel={() => setWasteOpen(false)}
        onConfirm={() => {
          setWasteOpen(false)
          wasteItem(item.id)
          toast(`${item.name} logged as wasted`, {
            tone: 'warning',
            description: 'FRISA will remind you earlier next time.',
          })
          navigate('/inventory')
        }}
      />

      {/* Delete */}
      <ConfirmationSheet
        open={deleteOpen}
        title={`Delete ${item.name}?`}
        description="The item is removed from this fridge without being counted as used or wasted."
        confirmLabel="Delete item"
        tone="danger"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false)
          removeItem(item.id)
          toast(`${item.name} deleted`, { tone: 'info' })
          navigate('/inventory')
        }}
      />
    </div>
  )
}
