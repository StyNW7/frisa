import type { Recipe, UserPreference } from '@/types'

/**
 * Dietary screening for recipes.
 *
 * Allergens and diet conflicts are read from the ingredient names rather than
 * hand-tagged on each recipe, so a recipe added later is screened the same way
 * without anyone having to remember to label it.
 */

type Rule = readonly string[]

/** Ingredient words that carry each allergen on the setup list. */
const ALLERGEN_WORDS: Record<string, Rule> = {
  Peanuts: ['peanut', 'satay', 'kacang'],
  Shellfish: ['prawn', 'shrimp', 'crab', 'lobster', 'shellfish', 'squid', 'clam', 'mussel'],
  Eggs: ['egg', 'omelette', 'mayonnaise'],
  Dairy: ['milk', 'cheese', 'cheddar', 'parmesan', 'butter', 'yogurt', 'yoghurt', 'cream'],
  /* Soy sauce and kecap manis are brewed with wheat. */
  Gluten: ['spaghetti', 'pasta', 'noodle', 'bread', 'flour', 'granola', 'soy sauce', 'kecap'],
  Soy: ['soy', 'tempeh', 'tofu', 'kecap', 'edamame'],
}

const MEAT: Rule = ['chicken', 'beef', 'pork', 'bacon', 'ham', 'lamb', 'duck', 'sausage', 'meat']
const SEAFOOD: Rule = ['fish', 'salmon', 'tuna', 'mackerel', 'prawn', 'shrimp', 'crab', 'squid', 'anchovy']

/** What each diet rules out. "No restriction" is simply absent. */
const DIET_EXCLUDES: Record<string, Rule> = {
  Vegetarian: [...MEAT, ...SEAFOOD],
  Pescatarian: MEAT,
  'Halal only': ['pork', 'bacon', 'ham', 'lard', 'wine', 'rum'],
  'Low carb': ['rice', 'spaghetti', 'pasta', 'noodle', 'bread', 'granola', 'potato'],
}

/** Ingredients that are fine for a diet even though they contain an excluded word. */
const SAFE_PHRASES: Rule = ['vegetable stock', 'cauliflower rice']

function contains(name: string, words: Rule): boolean {
  const text = name.toLowerCase()
  if (SAFE_PHRASES.some((phrase) => text.includes(phrase))) return false
  /* Whole words with an optional plural, so "eggs" counts but "eggplant" does not. */
  return words.some((word) => new RegExp(`\\b${word}(?:e?s)?\\b`).test(text))
}

export interface DietaryVerdict {
  /** Allergens on the household list that the recipe contains. */
  allergens: string[]
  /** Set when the recipe does not fit the household diet. */
  dietConflict?: string
  /** Ingredient names responsible, for the explanation line. */
  culprits: string[]
  compatible: boolean
}

export function screenRecipe(recipe: Recipe, prefs: Pick<UserPreference, 'diet' | 'allergies'>): DietaryVerdict {
  const allergens: string[] = []
  const culprits = new Set<string>()

  for (const allergen of prefs.allergies) {
    const words = ALLERGEN_WORDS[allergen]
    if (!words) continue
    const hits = recipe.ingredients.filter((ingredient) => contains(ingredient.name, words))
    if (hits.length > 0) {
      allergens.push(allergen)
      hits.forEach((hit) => culprits.add(hit.name))
    }
  }

  let dietConflict: string | undefined
  const excluded = DIET_EXCLUDES[prefs.diet]
  if (excluded) {
    const hits = recipe.ingredients.filter((ingredient) => contains(ingredient.name, excluded))
    if (hits.length > 0) {
      dietConflict = prefs.diet
      hits.forEach((hit) => culprits.add(hit.name))
    }
  }

  return {
    allergens,
    dietConflict,
    culprits: [...culprits],
    compatible: allergens.length === 0 && !dietConflict,
  }
}

/** One readable reason, e.g. "Contains eggs and dairy" or "Not vegetarian". */
export function verdictReason(verdict: DietaryVerdict): string {
  const parts: string[] = []
  if (verdict.allergens.length > 0) {
    const names = verdict.allergens.map((a) => a.toLowerCase())
    const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
    parts.push(`Contains ${list}`)
  }
  if (verdict.dietConflict) {
    parts.push(
      verdict.dietConflict === 'Halal only'
        ? 'Not halal'
        : verdict.dietConflict === 'Low carb'
          ? 'Not low carb'
          : `Not ${verdict.dietConflict.toLowerCase()}`,
    )
  }
  return parts.join(' · ')
}

/**
 * Small ranking nudge for the household's favourite cuisines and recipe styles.
 * Deliberately modest: rescuing food that is about to expire always leads.
 */
export function preferenceBoost(recipe: Recipe, prefs: Pick<UserPreference, 'cuisines' | 'recipePrefs'>): number {
  let boost = 0
  if (prefs.cuisines.includes(recipe.cuisine)) boost += 3
  for (const pref of prefs.recipePrefs) {
    if ((recipe.tags as string[]).includes(pref)) boost += 2
    if (pref === 'Quick Meals' && recipe.minutes <= 20) boost += 1
    if (pref === 'Family Portions' && recipe.servings >= 3) boost += 2
  }
  return boost
}
