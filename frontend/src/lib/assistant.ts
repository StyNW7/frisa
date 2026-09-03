import type { DerivedRecipe, FoodItem, Fridge, SavingsSummary } from '@/types'
import {
  daysUntil,
  expiryPhrase,
  formatQuantity,
  isPriority,
  relativeMinutes,
  riskScore,
  rupiah,
} from '@/lib/utils'

export interface AssistantContext {
  items: FoodItem[]
  recipes: DerivedRecipe[]
  fridge: Fridge
  savings: SavingsSummary
  shoppingCount: number
}

/** Food words FRISA recognises even when the fridge does not currently hold them. */
const FOOD_VOCABULARY = [
  'milk',
  'egg',
  'spinach',
  'chicken',
  'broccoli',
  'yogurt',
  'yoghurt',
  'carrot',
  'tomato',
  'tempeh',
  'tofu',
  'juice',
  'cheese',
  'cheddar',
  'nugget',
  'butter',
  'apple',
  'rice',
  'water',
  'salmon',
  'shrimp',
  'banana',
  'bread',
  'coffee',
  'pizza',
  'papaya',
  'tea',
  'fish',
  'beef',
  'pork',
  'yoghurt',
]

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function singular(word: string): string {
  if (word.length > 3 && word.endsWith('ies')) return `${word.slice(0, -3)}y`
  if (word.length > 3 && word.endsWith('es') && !word.endsWith('ses')) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1)
  return word
}

function tokens(text: string): string[] {
  return normalize(text).split(' ').map(singular).filter(Boolean)
}

function mentionedItems(query: string, items: FoodItem[]): FoodItem[] {
  const queryTokens = new Set(tokens(query))
  return items.filter((item) =>
    tokens(item.name).some((word) => word.length >= 3 && queryTokens.has(word)),
  )
}

function mentionsKnownFood(query: string): string | undefined {
  const queryTokens = tokens(query)
  return FOOD_VOCABULARY.map(singular).find((word) => queryTokens.includes(word))
}

function listNames(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

function describePriority(items: FoodItem[]): string {
  const top = items.slice(0, 3)
  const phrases = top.map((item) => {
    const days = daysUntil(item.expiresAt)
    const when = days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`
    return `${item.name.toLowerCase()} ${when}`
  })
  return listNames(phrases)
}

/**
 * A deterministic, rule-based assistant.
 *
 * Every answer is read from the live inventory, so anything the user adds or cooks
 * during the demo is reflected immediately. No model, no network, no invented facts.
 */
export function answerQuestion(rawQuery: string, ctx: AssistantContext): string {
  const query = normalize(rawQuery)
  const { items, recipes, fridge, savings, shoppingCount } = ctx

  if (!query) {
    return 'I did not catch that. Try asking what is expiring soon, or what you can cook tonight.'
  }

  const priority = items.filter(isPriority).sort((a, b) => riskScore(b) - riskScore(a))
  const named = mentionedItems(rawQuery, items)
  const asksQuantity = /how many|how much|berapa|\bleft\b|remaining|still have|do i have|\bany\b/.test(query)
  const isYesNo =
    /^(do|does|is|are|have|has|any)\b/.test(query) || /still have|do i have|\bany\b/.test(query)

  /* A specific food was named - answer from stock first. */
  if (named.length > 0 && (asksQuantity || !/expir|cook|recipe|save|shopping/.test(query))) {
    const answers = named.slice(0, 2).map((item) => {
      const days = daysUntil(item.expiresAt)
      const risk = riskScore(item)
      const tail = item.shelfStable
        ? 'It has a long shelf life.'
        : `It expires ${expiryPhrase(days).toLowerCase()}${risk >= 60 ? `, and the waste risk is ${risk} out of 100` : ''}.`
      return `${isYesNo ? 'Yes. ' : ''}You have ${formatQuantity(item)} of ${item.name.toLowerCase()} on the ${item.storage.toLowerCase()}. ${tail}`
    })
    return answers.join(' ')
  }

  const knownFood = mentionsKnownFood(rawQuery)
  if (named.length === 0 && knownFood && asksQuantity) {
    return `There is no ${knownFood} in ${fridge.name} right now. You can add it from the Scan tab, or put it on your shopping list.`
  }

  /* Expiry and priority */
  if (/expir|soon|first|priorit|risk|waste|urgent|bad/.test(query)) {
    if (priority.length === 0) {
      return 'Nothing needs urgent attention. Every item in this fridge is still comfortably within its shelf life.'
    }
    const rest = priority.length > 3 ? ` ${priority.length - 3} more items are worth watching this week.` : ''
    return `${priority.length === 1 ? 'One item' : `${priority.length} items`} should be prioritised: ${describePriority(priority)}.${rest}`
  }

  /* Recipes */
  if (/cook|recipe|meal|dinner|lunch|breakfast|make|masak|eat/.test(query)) {
    const best = recipes[0]
    if (!best) return 'I could not find a recipe that fits the current inventory. Try adding a few ingredients first.'
    const priorityLine = best.priorityItems.length
      ? ` It uses ${listNames(best.priorityItems.map((i) => i.name.toLowerCase()))}, which should be used soon.`
      : ''
    return `I would cook ${best.name}. It matches ${best.matchScore}% of what you already have, takes ${best.minutes} minutes, and you are only missing ${best.missing.length === 0 ? 'nothing' : listNames(best.missing.map((m) => m.toLowerCase()))}.${priorityLine}`
  }

  /* Savings */
  if (/save|saving|money|spend|budget|rupiah|hemat|impact|co2|carbon/.test(query)) {
    return `This month you have saved ${rupiah(savings.moneySaved)} by using ${savings.foodSavedKg.toFixed(1)} kg of food before it expired. That is ${savings.itemsRescued} items rescued and roughly ${savings.co2Kg} kg CO2e avoided.`
  }

  /* Shopping */
  if (/shop|buy|grocer|market|list|beli/.test(query)) {
    return `Your shopping list has ${shoppingCount} ${shoppingCount === 1 ? 'entry' : 'entries'}. I check every addition against your inventory first, so you do not buy something you already have.`
  }

  /* Device and fridge status */
  if (/status|sync|connect|device|hub|temperature|battery|offline|online/.test(query)) {
    return `${fridge.name} is ${fridge.online ? 'connected' : 'offline'}. ${fridge.deviceId} last synced ${relativeMinutes(fridge.lastSyncMinutes)}, the compartment is holding ${fridge.temperature.toFixed(1)} degrees, and the hub battery is at ${fridge.battery}%.`
  }

  /* Inventory overview */
  if (/what.*(inside|have|fridge)|inventory|isi|list|show/.test(query)) {
    const categories = new Set(items.map((i) => i.category))
    return `${fridge.name} holds ${items.length} items across ${categories.size} categories. ${priority.length > 0 ? `${priority.length} of them should be used within the next few days.` : 'None of them are close to expiring.'}`
  }

  return `I can help with what is expiring, what to cook, what is in ${fridge.name}, and how much you have saved. Try asking "what should I use first?"`
}
