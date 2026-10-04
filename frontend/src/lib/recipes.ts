import type { DerivedRecipe, FoodItem, Recipe, RecipeIngredient, UserPreference } from '@/types'
import { isPriority, portionValue, portionWeight, riskScore } from '@/lib/utils'
import { preferenceBoost, screenRecipe, type DietaryVerdict } from '@/lib/dietary'

export interface IngredientState {
  ingredient: RecipeIngredient
  item?: FoodItem
  available: boolean
  priority: boolean
  /** True when the fridge holds some of the ingredient but less than the recipe asks for. */
  short: boolean
}

export function ingredientStates(recipe: Recipe, items: FoodItem[]): IngredientState[] {
  return recipe.ingredients.map((ingredient) => {
    if (ingredient.pantry) {
      return { ingredient, available: true, priority: false, short: false }
    }
    const item = ingredient.foodId ? items.find((i) => i.id === ingredient.foodId && i.quantity > 0) : undefined
    return {
      ingredient,
      item,
      available: Boolean(item),
      priority: Boolean(item && isPriority(item)),
      short: Boolean(item && ingredient.consumes != null && item.quantity < ingredient.consumes),
    }
  })
}

/**
 * FRISA match score.
 *
 * Availability drives the number; every priority ingredient the recipe clears adds
 * a small bonus, because a recipe that rescues food is worth more than one that
 * merely fits. Capped at 100.
 */
export function deriveRecipe(recipe: Recipe, items: FoodItem[]): DerivedRecipe {
  const states = ingredientStates(recipe, items)
  const total = states.length
  const available = states.filter((s) => s.available).length
  const missing = states.filter((s) => !s.available).map((s) => s.ingredient.name)
  const priorityItems = states.filter((s) => s.priority && s.item).map((s) => s.item as FoodItem)

  const matchScore = Math.min(100, Math.round((available / total) * 100 + priorityItems.length * 1.5))

  const rescueValue = states.reduce((sum, s) => {
    if (!s.item || !s.ingredient.consumes) return sum
    return sum + portionValue(s.item, s.ingredient.consumes)
  }, 0)

  return { ...recipe, available, total, missing, priorityItems, matchScore, rescueValue }
}

export function deriveRecipes(recipes: Recipe[], items: FoodItem[]): DerivedRecipe[] {
  return recipes.map((r) => deriveRecipe(r, items))
}

/**
 * Recommendation rank: how urgent the food it rescues is, how many at-risk items it
 * clears, and how well it fits the fridge. Urgency leads, but a recipe that rescues
 * three ingredients at 92% fit still beats one that rescues a single item at 87%.
 */
export function recommendationScore(recipe: DerivedRecipe, boost = 0): number {
  const urgency = Math.max(0, ...recipe.priorityItems.map(riskScore), 0)
  return urgency * 0.5 + recipe.matchScore * 0.3 + recipe.priorityItems.length * 6 + boost
}

export function sortRecommended(
  recipes: DerivedRecipe[],
  prefs?: Pick<UserPreference, 'cuisines' | 'recipePrefs'>,
): DerivedRecipe[] {
  const score = (recipe: DerivedRecipe) => recommendationScore(recipe, prefs ? preferenceBoost(recipe, prefs) : 0)
  return [...recipes].sort((a, b) => {
    const diff = score(b) - score(a)
    if (Math.abs(diff) > 0.001) return diff
    return b.matchScore - a.matchScore
  })
}

export interface ScreenedRecipe extends DerivedRecipe {
  verdict: DietaryVerdict
}

export interface RecipeRanking {
  /** Recipes that fit the household diet and allergies, best first. */
  suitable: ScreenedRecipe[]
  /** Recipes held back by the household preferences, best first. */
  filtered: ScreenedRecipe[]
}

/**
 * The one ranking every screen uses: live availability from the selected fridge,
 * screened against the household diet and allergies, nudged towards favourite
 * cuisines and recipe styles.
 */
export function rankRecipes(recipes: Recipe[], items: FoodItem[], prefs: UserPreference): RecipeRanking {
  const ranked = sortRecommended(deriveRecipes(recipes, items), prefs).map((recipe) => ({
    ...recipe,
    verdict: screenRecipe(recipe, prefs),
  }))
  return {
    suitable: ranked.filter((recipe) => recipe.verdict.compatible),
    filtered: ranked.filter((recipe) => !recipe.verdict.compatible),
  }
}

export interface RecipeConsumption {
  itemId: string
  name: string
  portion: number
  value: number
  weightKg: number
  wasPriority: boolean
}

/** What completing a recipe will actually take out of the fridge. */
export function planConsumption(recipe: Recipe, items: FoodItem[]): RecipeConsumption[] {
  return ingredientStates(recipe, items)
    .filter((s): s is IngredientState & { item: FoodItem } => Boolean(s.item && s.ingredient.consumes))
    .map((s) => {
      const portion = Math.min(s.ingredient.consumes as number, s.item.quantity)
      return {
        itemId: s.item.id,
        name: s.item.name,
        portion,
        value: portionValue(s.item, portion),
        weightKg: portionWeight(s.item, portion),
        wasPriority: isPriority(s.item),
      }
    })
}
