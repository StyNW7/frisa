import { Link } from 'react-router-dom'
import { ChefHat, Clock, Flame, Sparkles, Users } from 'lucide-react'
import type { DerivedRecipe } from '@/types'
import { StatusChip } from '@/components/common/Badges'
import { cn, pluralize, rupiah } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*  Match badge                                                                */
/* -------------------------------------------------------------------------- */

export function RecipeMatchBadge({
  score,
  size = 'md',
  onArt,
}: {
  score: number
  size?: 'sm' | 'md'
  onArt?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-bold leading-none',
        size === 'sm' ? 'px-2 py-1 text-2xs' : 'px-2.5 py-1.5 text-xs',
        onArt ? 'bg-white/20 text-white ring-1 ring-inset ring-white/30 backdrop-blur-sm' : 'bg-frisa-50 text-frisa-700',
      )}
      title={`FRISA match ${score}%`}
    >
      <Sparkles className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} strokeWidth={2.4} aria-hidden />
      <span className="num">{score}%</span>
      <span className="font-semibold opacity-75">match</span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  Recipe artwork                                                             */
/* -------------------------------------------------------------------------- */

export function RecipeArt({
  recipe,
  className,
  children,
}: {
  recipe: DerivedRecipe
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ background: `linear-gradient(135deg, ${recipe.art[0]} 0%, ${recipe.art[1]} 100%)` }}
    >
      <span className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full border border-white/15" aria-hidden />
      <span className="pointer-events-none absolute -bottom-12 -left-6 h-36 w-36 rounded-full border border-white/15" aria-hidden />
      <ChefHat
        className="pointer-events-none absolute -bottom-3 right-3 h-24 w-24 text-white/15"
        strokeWidth={1.2}
        aria-hidden
      />
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Hero card                                                                  */
/* -------------------------------------------------------------------------- */

export function RecipeHeroCard({ recipe }: { recipe: DerivedRecipe }) {
  return (
    <Link to={`/recipe/${recipe.id}`} className="card press block overflow-hidden hover:shadow-lift">
      <RecipeArt recipe={recipe} className="p-4 pb-5">
        <div className="relative flex items-start justify-between gap-3">
          <RecipeMatchBadge score={recipe.matchScore} onArt />
          {recipe.priorityItems.length > 0 ? (
            <StatusChip tone="onGreen">{recipe.priorityItems.length} priority items</StatusChip>
          ) : null}
        </div>
        <h3 className="relative mt-6 text-[20px] font-extrabold leading-tight tracking-tight text-white">
          {recipe.name}
        </h3>
        <p className="relative mt-1.5 max-w-[85%] text-[13px] leading-snug text-white/80">{recipe.summary}</p>
      </RecipeArt>

      <dl className="grid grid-cols-3 divide-x divide-line">
        <div className="px-3 py-3 text-center">
          <Clock className="mx-auto h-4 w-4 text-ink-faint" strokeWidth={2} aria-hidden />
          <dd className="num mt-1.5 text-[15px] font-extrabold leading-none text-ink">{recipe.minutes} min</dd>
          <dt className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Time</dt>
        </div>
        <div className="px-3 py-3 text-center">
          <ChefHat className="mx-auto h-4 w-4 text-ink-faint" strokeWidth={2} aria-hidden />
          <dd className="num mt-1.5 text-[15px] font-extrabold leading-none text-ink">
            {recipe.available}/{recipe.total}
          </dd>
          <dt className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Ingredients</dt>
        </div>
        <div className="px-3 py-3 text-center">
          <Flame className="mx-auto h-4 w-4 text-ink-faint" strokeWidth={2} aria-hidden />
          <dd className="num mt-1.5 text-[15px] font-extrabold leading-none text-ink">{rupiah(recipe.rescueValue)}</dd>
          <dt className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Rescued</dt>
        </div>
      </dl>
    </Link>
  )
}

/* -------------------------------------------------------------------------- */
/*  Compact row                                                                */
/* -------------------------------------------------------------------------- */

export function RecipeRow({ recipe }: { recipe: DerivedRecipe }) {
  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className="card press flex items-stretch gap-3 overflow-hidden pr-3.5 hover:border-frisa-200 hover:shadow-lift"
    >
      <RecipeArt recipe={recipe} className="w-[86px] shrink-0">
        <span className="absolute inset-0 flex items-center justify-center">
          <ChefHat className="h-7 w-7 text-white/90" strokeWidth={1.8} aria-hidden />
        </span>
      </RecipeArt>

      <div className="min-w-0 flex-1 py-3">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[15px] font-bold leading-tight text-ink">{recipe.name}</p>
          <RecipeMatchBadge score={recipe.matchScore} size="sm" />
        </div>

        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-muted">
          <span className="num inline-flex items-center gap-1">
            <Clock className="h-3 w-3" strokeWidth={2.2} aria-hidden />
            {recipe.minutes} min
          </span>
          <span aria-hidden>·</span>
          <span className="num">
            {recipe.available}/{recipe.total} ingredients
          </span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" strokeWidth={2.2} aria-hidden />
            {recipe.servings}
          </span>
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {recipe.priorityItems.length > 0 ? (
            <StatusChip tone="orange">
              Uses {pluralize(recipe.priorityItems.length, 'priority item')}
            </StatusChip>
          ) : (
            <StatusChip tone="neutral">{recipe.difficulty}</StatusChip>
          )}
          {recipe.missing.length === 0 ? (
            <StatusChip tone="green">Everything available</StatusChip>
          ) : (
            <StatusChip tone="neutral">Missing {recipe.missing.length}</StatusChip>
          )}
        </div>
      </div>
    </Link>
  )
}
