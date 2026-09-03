import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleCheck, Clock, Sparkles, Wallet } from 'lucide-react'
import type { DerivedRecipe } from '@/types'
import { FrisaMark } from '@/components/common/FrisaMark'
import { useToast } from '@/hooks/useApp'
import { rupiah } from '@/lib/utils'

function listNames(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/**
 * The FRISA recommendation. Written as a sentence about this fridge, not as a promo.
 */
export function SmartSuggestionCard({ recipe }: { recipe: DerivedRecipe }) {
  const { toast } = useToast()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const priorityNames = recipe.priorityItems.map((i) => i.name.toLowerCase())
  const sentence =
    priorityNames.length > 0
      ? `Your ${listNames(priorityNames)} should be used soon. You can turn them into ${recipe.name} tonight.`
      : `Everything is fresh. ${recipe.name} is the best match for what you already have.`

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-frisa-100 p-4"
      style={{ background: 'linear-gradient(135deg, #EAF8F1 0%, #FFFFFF 58%, #FFF6EC 100%)' }}
    >
      <div className="flex items-center gap-2">
        <FrisaMark className="h-8 w-8" />
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-frisa-700">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
          FRISA Suggests
        </span>
      </div>

      <p className="mt-3 text-[15px] font-semibold leading-relaxed text-ink">{sentence}</p>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white/80 p-2.5 text-center ring-1 ring-inset ring-frisa-100">
          <dt className="sr-only">Estimated time</dt>
          <Clock className="mx-auto h-4 w-4 text-frisa-600" strokeWidth={2.2} aria-hidden />
          <dd className="num mt-1.5 text-sm font-extrabold text-ink">{recipe.minutes} min</dd>
        </div>
        <div className="rounded-2xl bg-white/80 p-2.5 text-center ring-1 ring-inset ring-frisa-100">
          <dt className="sr-only">Ingredients available</dt>
          <CircleCheck className="mx-auto h-4 w-4 text-frisa-600" strokeWidth={2.2} aria-hidden />
          <dd className="num mt-1.5 text-sm font-extrabold text-ink">
            {recipe.available}/{recipe.total}
          </dd>
        </div>
        <div className="rounded-2xl bg-white/80 p-2.5 text-center ring-1 ring-inset ring-ember-100">
          <dt className="sr-only">Food value rescued</dt>
          <Wallet className="mx-auto h-4 w-4 text-ember-600" strokeWidth={2.2} aria-hidden />
          <dd className="num mt-1.5 text-sm font-extrabold text-ink">{rupiah(recipe.rescueValue)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex gap-2.5">
        <Link
          to={`/recipe/${recipe.id}`}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl bg-frisa-500 text-sm font-bold text-white shadow-pill transition-all duration-200 active:scale-95"
        >
          View Recipe
        </Link>
        <button
          type="button"
          onClick={() => {
            setDismissed(true)
            toast('Suggestion hidden for now', {
              tone: 'info',
              description: 'FRISA will suggest again when your inventory changes.',
            })
          }}
          className="h-11 rounded-2xl border border-line bg-white px-4 text-sm font-bold text-ink-muted transition-all duration-200 hover:text-ink active:scale-95"
        >
          Not Now
        </button>
      </div>
    </section>
  )
}
