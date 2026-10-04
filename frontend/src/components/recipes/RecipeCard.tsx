import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChefHat, Clock, Flame, ShieldAlert, Sparkles, Users } from 'lucide-react'
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
  scrim = 'bottom',
  eager,
  children,
}: {
  recipe: Pick<DerivedRecipe, 'art' | 'photo'>
  className?: string
  /** Where text sits on the photo, so the gradient keeps it legible. */
  scrim?: 'bottom' | 'full' | 'none'
  /** Heroes above the fold load immediately; list rows load lazily. */
  eager?: boolean
  children?: React.ReactNode
}) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  return (
    <div
      className={cn('relative isolate overflow-hidden', className)}
      style={{ background: `linear-gradient(135deg, ${recipe.art[0]} 0%, ${recipe.art[1]} 100%)` }}
    >
      {failed ? (
        <ChefHat
          className="pointer-events-none absolute -bottom-3 right-3 -z-10 h-24 w-24 text-white/15"
          strokeWidth={1.2}
          aria-hidden
        />
      ) : (
        <img
          src={recipe.photo}
          alt=""
          draggable={false}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            'pointer-events-none absolute inset-0 -z-10 h-full w-full select-none object-cover transition-[opacity,transform] duration-700 ease-out',
            loaded ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0',
          )}
        />
      )}
      {scrim !== 'none' ? (
        <span
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              scrim === 'full'
                ? 'linear-gradient(180deg, rgba(10,22,16,0.42) 0%, rgba(10,22,16,0.08) 34%, rgba(10,22,16,0.28) 58%, rgba(10,22,16,0.86) 100%)'
                : 'linear-gradient(180deg, rgba(10,22,16,0.30) 0%, rgba(10,22,16,0) 30%, rgba(10,22,16,0.18) 52%, rgba(10,22,16,0.82) 100%)',
          }}
          aria-hidden
        />
      ) : null}
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
      <RecipeArt recipe={recipe} eager className="flex min-h-[214px] flex-col p-4 pb-5">
        <div className="relative flex items-start justify-between gap-3">
          <RecipeMatchBadge score={recipe.matchScore} onArt />
          {recipe.priorityItems.length > 0 ? (
            <StatusChip tone="onGreen">{recipe.priorityItems.length} priority items</StatusChip>
          ) : null}
        </div>
        <h3 className="relative mt-auto pt-6 text-[21px] font-extrabold leading-tight tracking-tight text-white [text-shadow:0_1px_12px_rgba(0,0,0,0.35)]">
          {recipe.name}
        </h3>
        <p className="relative mt-1.5 line-clamp-2 max-w-[92%] text-[13px] leading-snug text-white/85">{recipe.summary}</p>
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

export function RecipeRow({
  recipe,
  warning,
}: {
  recipe: DerivedRecipe
  /** Set when the recipe clashes with the household diet or allergies. */
  warning?: string
}) {
  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className="card press flex items-stretch gap-3 overflow-hidden pr-3.5 hover:border-frisa-200 hover:shadow-lift"
    >
      <RecipeArt recipe={recipe} scrim="none" className="my-2 ml-2 w-[96px] shrink-0 rounded-2xl">
        <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5" aria-hidden />
        <span className="num absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-extrabold text-frisa-700 shadow-card backdrop-blur-sm">
          <Sparkles className="h-2.5 w-2.5" strokeWidth={2.6} aria-hidden />
          {recipe.matchScore}%
          <span className="sr-only"> match</span>
        </span>
      </RecipeArt>

      <div className="min-w-0 flex-1 py-3">
        <p className="line-clamp-2 text-[15px] font-bold leading-tight text-ink">{recipe.name}</p>

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
          {warning ? (
            <StatusChip tone="danger" icon={ShieldAlert}>
              {warning}
            </StatusChip>
          ) : recipe.priorityItems.length > 0 ? (
            <StatusChip tone="orange">
              Uses {pluralize(recipe.priorityItems.length, 'priority item')}
            </StatusChip>
          ) : (
            <StatusChip tone="neutral">{recipe.difficulty}</StatusChip>
          )}
          {warning ? null : recipe.missing.length === 0 ? (
            <StatusChip tone="green">Everything available</StatusChip>
          ) : (
            <StatusChip tone="neutral">Missing {recipe.missing.length}</StatusChip>
          )}
        </div>
      </div>
    </Link>
  )
}
