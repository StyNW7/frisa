/**
 * FRISA - shared domain types.
 * Every screen in the prototype reads from these shapes so the demo stays coherent.
 */

export type FoodCategory =
  | 'Vegetables'
  | 'Protein'
  | 'Dairy'
  | 'Fruit'
  | 'Drinks'
  | 'Frozen'
  | 'Leftover'
  | 'Pantry'

export type StorageLocation =
  | 'Fresh Drawer'
  | 'Lower Shelf'
  | 'Middle Shelf'
  | 'Upper Shelf'
  | 'Top Shelf'
  | 'Door Shelf'
  | 'Egg Tray'
  | 'Freezer'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type FoodStatus = 'fresh' | 'use-soon' | 'expired'

export interface FoodItem {
  id: string
  name: string
  category: FoodCategory
  /** Remaining amount, in `unit`. */
  quantity: number
  /** Amount held when the item was first added - used for the remaining-stock term of the risk score. */
  initialQuantity: number
  unit: string
  /** ISO date (yyyy-mm-dd) the item entered the fridge. */
  addedAt: string
  /** ISO date (yyyy-mm-dd) the item expires. */
  expiresAt: string
  storage: StorageLocation
  /** Rupiah value of the full quantity currently held. */
  value: number
  /** Approximate weight of the full quantity, in kilograms. */
  weightKg: number
  /**
   * Household consumption-pattern correction applied on top of the computed
   * expiry/category risk. Positive means this household tends to let it go bad.
   */
  patternAdjust: number
  /** True for shelf-stable goods that never drive an expiry alert. */
  shelfStable?: boolean
  /** How the item reached the inventory. */
  source: 'hub' | 'phone' | 'manual'
  note?: string
}

export interface RecipeIngredient {
  name: string
  amount: string
  /** Links the ingredient to an inventory item so availability is computed live. */
  foodId?: string
  /** Everyday staples the household is assumed to keep. */
  pantry?: boolean
  /** Portion of the linked item consumed when the recipe is completed. */
  consumes?: number
}

export type RecipeTag = 'Use Soon' | 'Quick Meals' | 'High Protein' | 'Low Waste' | 'Comfort' | 'Light'

export interface Recipe {
  id: string
  name: string
  summary: string
  cuisine: string
  minutes: number
  difficulty: 'Easy' | 'Medium'
  servings: number
  calories: number
  tags: RecipeTag[]
  /** Two-stop gradient used for the recipe artwork placeholder. */
  art: [string, string]
  ingredients: RecipeIngredient[]
  steps: string[]
}

export interface DerivedRecipe extends Recipe {
  available: number
  total: number
  missing: string[]
  priorityItems: FoodItem[]
  matchScore: number
  rescueValue: number
}

/**
 * Pairing credentials for one FRISA hub.
 *
 * In the product this lives in the device firmware; the browser stands in for the
 * hub here so the flow can be demonstrated without a backend. The password itself
 * is never held - only a salted, iterated digest of it.
 */
export interface DeviceSecurity {
  /** Random per-device salt for the pairing digest. */
  salt: string
  /** Salted digest of the current pairing password. */
  passwordDigest: string
  /** True while the hub still accepts the password printed at the factory. */
  usingFactoryPassword: boolean
  /** What the label under the hub reads. Owners type this in once, then change it. */
  factoryPassword: string
  /** Issued on a successful pairing. This, not the password, is what authorises the app. */
  pairingToken?: string
  /** ISO timestamp of the successful pairing. */
  pairedAt?: string
  /** Consecutive failed attempts since the last success. */
  failedAttempts: number
  /** Epoch milliseconds until which further attempts are refused. */
  lockedUntil?: number
}

export interface Fridge {
  id: string
  name: string
  location: string
  deviceId: string
  online: boolean
  /** This app holds a valid pairing token for the hub. Without it the fridge stays locked. */
  paired: boolean
  security: DeviceSecurity
  /** Minutes since the hub last synced. */
  lastSyncMinutes: number
  battery: number
  wifi: string
  temperature: number
  items: FoodItem[]
}

export type NotificationCategory = 'Priority' | 'Inventory' | 'Recipes' | 'System'

export interface AppNotification {
  id: string
  category: NotificationCategory
  title: string
  body: string
  /** ISO timestamp. */
  at: string
  read: boolean
  high?: boolean
  /** In-app route opened when the notification is tapped. */
  link?: string
}

export type ActivityKind =
  | 'added'
  | 'updated'
  | 'consumed'
  | 'flagged'
  | 'recipe'
  | 'wasted'
  | 'sync'
  | 'removed'

export interface ActivityEvent {
  id: string
  kind: ActivityKind
  title: string
  detail?: string
  /** ISO timestamp. */
  at: string
}

export interface ShoppingItem {
  id: string
  name: string
  note?: string
  qty: string
  /** Suggested by FRISA vs added by the user. */
  suggested: boolean
  checked: boolean
}

export interface ChartDataPoint {
  label: string
  value: number
}

export interface SavingsSummary {
  foodSavedKg: number
  moneySaved: number
  itemsRescued: number
  wasteReductionPct: number
  co2Kg: number
}

export interface UserPreference {
  name: string
  household: string
  members: number
  diet: string
  allergies: string[]
  cuisines: string[]
  recipePrefs: string[]
  notifications: {
    expiry: boolean
    recipes: boolean
    inventory: boolean
    device: boolean
  }
  reminderTiming: string[]
}

export interface AssistantMessage {
  id: string
  role: 'user' | 'frisa'
  text: string
  at: string
}

export type InsightTone = 'positive' | 'attention' | 'neutral'

export interface ConsumptionInsight {
  id: string
  icon: string
  title: string
  body: string
  tone: InsightTone
}

export type PeriodKey = '7d' | '30d' | '3m'
