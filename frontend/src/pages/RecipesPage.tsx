import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChefHat, Heart, ShieldCheck, Sparkles, X } from 'lucide-react'
import { PageHeader } from '@/components/common/TopHeader'
import { FilterPills, SectionHeader } from '@/components/common/Primitives'
import { RecipeHeroCard, RecipeRow } from '@/components/recipes/RecipeCard'
import { FoodAvatar } from '@/components/common/FoodAvatar'
import { EmptyState } from '@/components/common/Feedback'
import { StatusChip } from '@/components/common/Badges'
import { useApp } from '@/hooks/useApp'
import { deriveRecipes, sortRecommended } from '@/lib/recipes'
import { RECIPES, RECIPE_CATEGORIES, type RecipeCategory } from '@/data/recipes'
import { expiryPhrase, daysUntil, riskScore, rupiah } from '@/lib/utils'

export function RecipesPage() {
  const { items, priorityItems, favorites } = useApp()
  const [params, setParams] = useSearchParams()
  const [category, setCategory] = useState<RecipeCategory>('Recommended')

  const focusId = params.get('focus')
  const focusItem = focusId ? items.find((i) => i.id === focusId) : undefined

  const derived = useMemo(() => sortRecommended(deriveRecipes(RECIPES, items)), [items])

  const list = useMemo(() => {
    let out = derived
    if (focusItem) {
      out = out.filter((recipe) => recipe.ingredients.some((ing) => ing.foodId === focusItem.id))
    }
    switch (category) {
      case 'Use Soon':
        return out.filter((r) => r.priorityItems.length > 0)
      case 'Quick Meals':
        return [...out].filter((r) => r.minutes <= 20).sort((a, b) => a.minutes - b.minutes)
      case 'High Match':
        return [...out].filter((r) => r.matchScore >= 90).sort((a, b) => b.matchScore - a.matchScore)
      case 'Favorites':
        return out.filter((r) => favorites.includes(r.id))
      default:
        return out
    }
  }, [derived, category, favorites, focusItem])

  const [hero, ...rest] = list
  const rescueTotal = priorityItems.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="pb-8">
      <PageHeader title="Smart Recipes" subtitle="Cook smarter with what you already have." />

      <div className="space-y-6 px-5 pt-4">
        {/* Save these ingredients */}
        {priorityItems.length > 0 && !focusItem ? (
          <section
            className="rounded-3xl border border-ember-100 p-4"
            style={{ background: 'linear-gradient(135deg, #FFF1E3 0%, #FFFFFF 68%)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-ember-700">
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
                  Save these ingredients
                </span>
                <p className="mt-2 text-[13px] leading-snug text-ink-soft">
                  Cooking with these first protects about{' '}
                  <span className="num font-bold text-ink">{rupiah(rescueTotal)}</span> of food.
                </p>
              </div>
            </div>

            <ul className="mt-3.5 flex flex-wrap gap-2">
              {priorityItems.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setParams({ focus: item.id })}
                    className="flex items-center gap-2 rounded-2xl bg-white px-2.5 py-2 shadow-card transition-transform active:scale-95"
                  >
                    <FoodAvatar name={item.name} category={item.category} size="sm" />
                    <span className="text-left">
                      <span className="block text-xs font-bold leading-tight text-ink">{item.name}</span>
                      <span className="num block text-[10px] font-semibold text-ember-700">
                        Risk {riskScore(item)} · {expiryPhrase(daysUntil(item.expiresAt))}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Focus banner */}
        {focusItem ? (
          <section className="flex items-center gap-3 rounded-3xl border border-frisa-100 bg-frisa-50 p-3.5">
            <FoodAvatar name={focusItem.name} category={focusItem.category} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-frisa-800">Recipes that use {focusItem.name}</p>
              <p className="mt-0.5 text-xs text-frisa-700/90">
                Waste risk {riskScore(focusItem)} · expires {expiryPhrase(daysUntil(focusItem.expiresAt)).toLowerCase()}
              </p>
            </div>
            <button
              type="button"
              aria-label="Clear ingredient filter"
              onClick={() => setParams({})}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-frisa-700 transition-colors hover:bg-frisa-100"
            >
              <X className="h-[18px] w-[18px]" strokeWidth={2.4} />
            </button>
          </section>
        ) : null}

        <FilterPills options={RECIPE_CATEGORIES} value={category} onChange={setCategory} label="Recipe categories" />

        {list.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={category === 'Favorites' ? Heart : ChefHat}
              title={category === 'Favorites' ? 'No favourites yet' : 'No recipe matches yet'}
              description={
                category === 'Favorites'
                  ? 'Tap the heart on any recipe and it will be waiting for you here.'
                  : 'Add more ingredients or adjust your preferences and FRISA will find something.'
              }
            />
          </div>
        ) : (
          <>
            <section>
              <SectionHeader
                title={category === 'Recommended' ? 'Recommended for tonight' : category}
                subtitle={
                  hero.priorityItems.length > 0
                    ? `Top pick rescues ${hero.priorityItems.length} ${hero.priorityItems.length === 1 ? 'ingredient' : 'ingredients'} at risk.`
                    : 'Best fit for the ingredients you already have.'
                }
              />
              <RecipeHeroCard recipe={hero} />
            </section>

            {rest.length > 0 ? (
              <section>
                <SectionHeader
                  title="More matches"
                  subtitle={`${rest.length} more ${rest.length === 1 ? 'recipe' : 'recipes'} fit this fridge.`}
                />
                <div className="space-y-3">
                  {rest.map((recipe) => (
                    <RecipeRow key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}

        {priorityItems.length === 0 ? (
          <section className="flex items-start gap-3 rounded-3xl border border-frisa-100 bg-frisa-50 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-frisa-600" strokeWidth={2} aria-hidden />
            <div>
              <p className="text-[13px] font-bold text-frisa-800">Nothing is at risk right now</p>
              <p className="mt-1 text-[13px] leading-snug text-frisa-700/90">
                These recipes are ranked purely by how well they fit your current inventory.
              </p>
              <div className="mt-2.5">
                <StatusChip tone="green">Low waste risk across the fridge</StatusChip>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
