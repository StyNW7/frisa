import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ChefHat,
  Check,
  CircleCheck,
  Clock,
  Flame,
  Heart,
  Info,
  Plus,
  ShoppingBasket,
  Sparkles,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { BottomSheet } from '@/components/common/BottomSheet'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/Feedback'
import { StatusChip } from '@/components/common/Badges'
import { RecipeArt, RecipeMatchBadge } from '@/components/recipes/RecipeCard'
import { SectionHeader } from '@/components/common/Primitives'
import { useApp, useToast } from '@/hooks/useApp'
import { RECIPES } from '@/data/recipes'
import { deriveRecipe, ingredientStates } from '@/lib/recipes'
import type { RecipeCompletionResult } from '@/store/AppContext'
import { cn, kg, riskScore, rupiah } from '@/lib/utils'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { items, favorites, toggleFavorite, completeRecipe, addShoppingItem, shopping } = useApp()
  const { toast } = useToast()

  const base = RECIPES.find((r) => r.id === id)
  const recipe = useMemo(() => (base ? deriveRecipe(base, items) : undefined), [base, items])
  const states = useMemo(() => (base ? ingredientStates(base, items) : []), [base, items])

  const [cooking, setCooking] = useState(false)
  const [doneSteps, setDoneSteps] = useState<number[]>([])
  const [result, setResult] = useState<RecipeCompletionResult | null>(null)

  if (!base || !recipe) {
    return (
      <div>
        <EmptyState
          icon={ChefHat}
          title="Recipe not found"
          description="This recipe is no longer part of your FRISA collection."
          action={
            <Button size="lg" onClick={() => navigate('/recipes')}>
              Back to recipes
            </Button>
          }
          className="pt-24"
        />
      </div>
    )
  }

  const favorite = favorites.includes(recipe.id)
  const allStepsDone = doneSteps.length === recipe.steps.length

  const finish = () => {
    const outcome = completeRecipe(base)
    setCooking(false)
    setResult(outcome)
    toast('Recipe completed', { description: 'Your inventory was updated automatically.' })
  }

  const addMissingToList = (name: string) => {
    if (shopping.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast(`${name} is already on your list`, { tone: 'info' })
      return
    }
    addShoppingItem(name, '1', `Missing from ${recipe.name}`)
    toast(`${name} added to shopping list`)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="hide-scrollbar flex-1 overflow-y-auto pb-6">
        {/* Hero */}
        <RecipeArt recipe={recipe} className="px-5 pb-6 pt-5">
          <div className="relative flex items-center justify-between">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => navigate(-1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm transition-transform active:scale-95"
            >
              <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              aria-label={favorite ? 'Remove from favourites' : 'Add to favourites'}
              aria-pressed={favorite}
              onClick={() => {
                toggleFavorite(recipe.id)
                toast(favorite ? 'Removed from favourites' : 'Saved to favourites', { tone: 'info' })
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm transition-transform active:scale-95"
            >
              <Heart className={cn('h-[18px] w-[18px]', favorite && 'fill-white')} strokeWidth={2.2} />
            </button>
          </div>

          <div className="relative mt-8">
            <div className="flex flex-wrap items-center gap-2">
              <RecipeMatchBadge score={recipe.matchScore} onArt />
              {recipe.priorityItems.length > 0 ? (
                <StatusChip tone="onGreen" icon={Sparkles}>
                  Rescues {recipe.priorityItems.length}
                </StatusChip>
              ) : null}
            </div>
            <h1 className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight text-white">{recipe.name}</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-white/80">{recipe.summary}</p>
          </div>
        </RecipeArt>

        <div className="space-y-6 px-5 pt-5">
          {/* Facts */}
          <dl className="card grid grid-cols-4 divide-x divide-line">
            {[
              { icon: Clock, label: 'Time', value: `${recipe.minutes} min` },
              { icon: Flame, label: 'Level', value: recipe.difficulty },
              { icon: Users, label: 'Serves', value: `${recipe.servings}` },
              { icon: ChefHat, label: 'Cuisine', value: recipe.cuisine },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="px-2 py-3 text-center">
                <Icon className="mx-auto h-4 w-4 text-ink-faint" strokeWidth={2} aria-hidden />
                <dd className="mt-1.5 truncate text-[13px] font-extrabold leading-none text-ink">{value}</dd>
                <dt className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{label}</dt>
              </div>
            ))}
          </dl>

          {/* Rescue callout */}
          {recipe.priorityItems.length > 0 ? (
            <section className="flex items-start gap-3 rounded-3xl border border-ember-100 bg-ember-50 p-4">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-ember-600" strokeWidth={2.2} aria-hidden />
              <div>
                <p className="text-[13px] font-bold text-ember-800">
                  Cooking this rescues about {rupiah(recipe.rescueValue)} of food
                </p>
                <p className="mt-1 text-[13px] leading-snug text-ember-800/80">
                  It uses {recipe.priorityItems.map((i) => `${i.name.toLowerCase()} (risk ${riskScore(i)})`).join(', ')}.
                </p>
              </div>
            </section>
          ) : null}

          {/* Ingredients */}
          <section>
            <SectionHeader
              title="Ingredients"
              subtitle={`${recipe.available} of ${recipe.total} already in your fridge.`}
            />

            <div className="mb-3 flex flex-wrap gap-1.5">
              <StatusChip tone="green" icon={CircleCheck}>
                Available
              </StatusChip>
              <StatusChip tone="orange" icon={Sparkles}>
                Priority
              </StatusChip>
              <StatusChip tone="neutral" icon={TriangleAlert}>
                Missing
              </StatusChip>
            </div>

            <ul className="card divide-y divide-line overflow-hidden">
              {states.map(({ ingredient, item, available, priority, short }) => (
                <li key={ingredient.name} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                      priority
                        ? 'bg-ember-50 text-ember-600'
                        : available
                          ? 'bg-frisa-50 text-frisa-600'
                          : 'bg-mist text-ink-faint',
                    )}
                  >
                    {available ? (
                      <Check className="h-4 w-4" strokeWidth={2.8} aria-hidden />
                    ) : (
                      <TriangleAlert className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-sm font-semibold', available ? 'text-ink' : 'text-ink-muted')}>
                      {ingredient.name}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-faint">
                      {ingredient.amount}
                      {ingredient.pantry ? ' · pantry staple' : ''}
                      {item ? ` · ${item.storage.toLowerCase()}` : ''}
                      {short ? ' · less than the recipe asks for' : ''}
                    </span>
                  </span>

                  {priority ? (
                    <StatusChip tone="orange">Priority</StatusChip>
                  ) : !available ? (
                    <button
                      type="button"
                      aria-label={`Add ${ingredient.name} to shopping list`}
                      onClick={() => addMissingToList(ingredient.name)}
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-line px-2.5 text-2xs font-bold text-ink-muted transition-colors hover:border-frisa-200 hover:text-frisa-700"
                    >
                      <Plus className="h-3 w-3" strokeWidth={2.8} aria-hidden />
                      List
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          {/* Steps */}
          <section>
            <SectionHeader title="Method" subtitle={`${recipe.steps.length} steps, about ${recipe.minutes} minutes.`} />
            <ol className="space-y-2.5">
              {recipe.steps.map((step, index) => (
                <li key={step} className="card flex gap-3 p-3.5">
                  <span className="num inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-frisa-50 text-xs font-extrabold text-frisa-700">
                    {index + 1}
                  </span>
                  <p className="pt-0.5 text-[13px] leading-relaxed text-ink-soft">{step}</p>
                </li>
              ))}
            </ol>
          </section>

          <div className="flex items-start gap-2.5 rounded-2xl bg-mist/60 p-3.5">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" strokeWidth={2.2} aria-hidden />
            <p className="text-2xs leading-relaxed text-ink-muted">
              Completing this recipe deducts the listed quantities from {recipe.priorityItems.length > 0 ? 'your' : 'your'}{' '}
              inventory automatically. Pantry staples are not tracked.
            </p>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="shrink-0 border-t border-line bg-surface px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3.5">
        <Button
          size="lg"
          block
          onClick={() => {
            setDoneSteps([])
            setCooking(true)
          }}
        >
          <ChefHat className="h-[18px] w-[18px]" strokeWidth={2.1} aria-hidden />
          Start Cooking
        </Button>
      </div>

      {/* Cooking mode */}
      <BottomSheet
        open={cooking}
        onClose={() => setCooking(false)}
        className="h-[84%]"
        title={recipe.name}
        description="Tick each step as you go. FRISA updates the inventory when you finish."
        footer={
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
              <span>
                <span className="num text-ink">{doneSteps.length}</span> of{' '}
                <span className="num">{recipe.steps.length}</span> steps done
              </span>
              <span className="num">{Math.round((doneSteps.length / recipe.steps.length) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-mist">
              <div
                className="h-full rounded-full bg-frisa-500 transition-all duration-300"
                style={{ width: `${(doneSteps.length / recipe.steps.length) * 100}%` }}
              />
            </div>
            <Button size="lg" block onClick={finish} variant={allStepsDone ? 'primary' : 'secondary'}>
              {allStepsDone ? 'Mark recipe as completed' : 'Finish and update inventory'}
            </Button>
          </div>
        }
      >
        <ol className="space-y-2.5 pb-2">
          {recipe.steps.map((step, index) => {
            const done = doneSteps.includes(index)
            return (
              <li key={step}>
                <button
                  type="button"
                  aria-pressed={done}
                  onClick={() =>
                    setDoneSteps((current) =>
                      current.includes(index) ? current.filter((i) => i !== index) : [...current, index],
                    )
                  }
                  className={cn(
                    'flex w-full gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200',
                    done ? 'border-frisa-200 bg-frisa-50' : 'border-line bg-surface hover:border-frisa-200',
                  )}
                >
                  <span
                    className={cn(
                      'num inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-colors',
                      done ? 'bg-frisa-500 text-white' : 'bg-mist text-ink-soft',
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      'pt-0.5 text-[13px] leading-relaxed',
                      done ? 'text-frisa-800 line-through decoration-frisa-300' : 'text-ink-soft',
                    )}
                  >
                    {step}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </BottomSheet>

      {/* Completion */}
      <BottomSheet
        open={Boolean(result)}
        onClose={() => setResult(null)}
        title="Inventory Updated"
        description={`${recipe.name} was marked as cooked.`}
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              block
              onClick={() => {
                setResult(null)
                navigate('/inventory')
              }}
            >
              View inventory
            </Button>
            <Button
              size="lg"
              block
              onClick={() => {
                setResult(null)
                navigate('/insights')
              }}
            >
              See impact
            </Button>
          </div>
        }
      >
        {result ? (
          <div className="space-y-4 pb-2">
            <div
              className="rounded-3xl border border-frisa-100 p-4 text-center"
              style={{ background: 'linear-gradient(135deg, #EAF8F1 0%, #FFFFFF 70%)' }}
            >
              <span className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-frisa-500 text-white">
                <CircleCheck className="h-7 w-7" strokeWidth={2.2} aria-hidden />
              </span>
              <p className="text-[13px] font-semibold text-frisa-800">You rescued approximately</p>
              <p className="num mt-1 text-[30px] font-extrabold leading-none tracking-tight text-ink">
                {rupiah(result.rescuedValue)}
              </p>
              <p className="mt-2 text-[13px] text-ink-muted">
                {kg(result.rescuedKg, 2)} of food and {result.itemsRescued}{' '}
                {result.itemsRescued === 1 ? 'item' : 'items'} at risk were used in time.
              </p>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint">Deducted from inventory</p>
              <ul className="card divide-y divide-line overflow-hidden">
                {result.consumed.map((entry) => (
                  <li key={entry.name} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[13px] font-semibold text-ink">{entry.name}</span>
                    <span className="num text-xs font-semibold text-ink-muted">
                      -{Math.round(entry.portion * 100) / 100} {entry.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => {
                setResult(null)
                navigate('/shopping')
              }}
              className="flex w-full items-center gap-3 rounded-2xl bg-mist/60 p-3.5 text-left transition-colors hover:bg-mist"
            >
              <ShoppingBasket className="h-[18px] w-[18px] shrink-0 text-ink-soft" strokeWidth={2} aria-hidden />
              <span className="text-[13px] font-semibold text-ink-soft">
                Need to restock? Check your shopping list before buying.
              </span>
            </button>
          </div>
        ) : null}
      </BottomSheet>
    </div>
  )
}
