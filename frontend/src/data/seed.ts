import type { ActivityEvent, AppNotification, ShoppingItem, UserPreference } from '@/types'

/** Timestamp helpers so seeded events always read as "this morning" / "yesterday". */
function hoursAgo(h: number): string {
  const d = new Date()
  d.setHours(d.getHours() - h, d.getMinutes(), 0, 0)
  return d.toISOString()
}

function atTimeToday(hour: number, minute: number): string {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  if (d.getTime() > Date.now()) d.setDate(d.getDate() - 1)
  return d.toISOString()
}

function daysAgoAt(days: number, hour: number, minute: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export function createSeedNotifications(): AppNotification[] {
  return [
    {
      id: 'n-1',
      category: 'Priority',
      title: 'Spinach expires tomorrow',
      body: 'Waste risk is 86 out of 100. FRISA found three recipes that use it today.',
      at: hoursAgo(1),
      read: false,
      high: true,
      link: '/food/spinach',
    },
    {
      id: 'n-2',
      category: 'Priority',
      title: 'Leftover Fried Rice needs attention today',
      body: 'Cooked containers hold their quality for about 48 hours. Risk is 91 out of 100.',
      at: hoursAgo(2),
      read: false,
      high: true,
      link: '/food/leftover-fried-rice',
    },
    {
      id: 'n-3',
      category: 'Priority',
      title: 'Chicken breast should be used within 2 days',
      body: 'Still 450 g remaining on the lower shelf of your Home Fridge.',
      at: hoursAgo(4),
      read: false,
      link: '/food/chicken-breast',
    },
    {
      id: 'n-4',
      category: 'Recipes',
      title: 'FRISA found 3 recipes for your priority ingredients',
      body: 'Chicken Spinach Stir-Fry matches 92% of what you already have.',
      at: hoursAgo(5),
      read: false,
      link: '/recipes',
    },
    {
      id: 'n-5',
      category: 'Inventory',
      title: 'Fresh Milk added through FRISA Hub',
      body: 'Recognised by the hub camera at 94% confidence and synced automatically.',
      at: atTimeToday(8, 42),
      read: true,
      link: '/food/fresh-milk',
    },
    {
      id: 'n-6',
      category: 'System',
      title: 'Inventory synchronized successfully',
      body: 'Home Fridge is up to date. 16 items tracked.',
      at: atTimeToday(8, 40),
      read: true,
    },
    {
      id: 'n-7',
      category: 'System',
      title: "Parents' Fridge has not synced for 1 hour",
      body: 'The hub is online but the last inventory push was delayed. No action needed yet.',
      at: hoursAgo(1),
      read: false,
      link: '/fridges',
    },
    {
      id: 'n-8',
      category: 'Recipes',
      title: 'Chicken Teriyaki marked as completed',
      body: 'Three ingredients were deducted from your inventory automatically.',
      at: daysAgoAt(1, 19, 12),
      read: true,
    },
    {
      id: 'n-9',
      category: 'Inventory',
      title: 'Apartment Fridge went offline',
      body: 'Last connected about an hour ago. Remote monitoring resumes when the hub reconnects.',
      at: hoursAgo(1),
      read: true,
      link: '/device',
    },
  ]
}

export function createSeedActivity(): ActivityEvent[] {
  return [
    {
      id: 'a-1',
      kind: 'added',
      title: 'Fresh Milk added through FRISA Hub',
      detail: 'Recognised at 94% confidence',
      at: atTimeToday(8, 42),
    },
    {
      id: 'a-2',
      kind: 'updated',
      title: 'Egg quantity updated from 8 to 6',
      detail: 'Voice command to the hub',
      at: atTimeToday(7, 55),
    },
    {
      id: 'a-3',
      kind: 'flagged',
      title: 'Spinach flagged as High Waste Risk',
      detail: 'Risk moved from 62 to 86',
      at: daysAgoAt(1, 21, 5),
    },
    {
      id: 'a-4',
      kind: 'recipe',
      title: 'Chicken Teriyaki recipe completed',
      detail: 'Rescued about Rp48,000 of ingredients',
      at: daysAgoAt(1, 19, 12),
    },
    {
      id: 'a-5',
      kind: 'consumed',
      title: 'Yogurt marked as consumed',
      detail: '1 cup deducted from inventory',
      at: daysAgoAt(2, 16, 30),
    },
    {
      id: 'a-6',
      kind: 'sync',
      title: 'Home Fridge synchronized',
      detail: '16 items confirmed',
      at: daysAgoAt(2, 9, 2),
    },
    {
      id: 'a-7',
      kind: 'wasted',
      title: 'Half a bunch of coriander marked as wasted',
      detail: 'Logged so FRISA can adjust future reminders',
      at: daysAgoAt(3, 18, 40),
    },
  ]
}

export function createSeedShopping(): ShoppingItem[] {
  return [
    {
      id: 's-1',
      name: 'Fresh Milk',
      qty: '1 L',
      note: 'Suggested refill in 2 days',
      suggested: true,
      checked: false,
    },
    {
      id: 's-2',
      name: 'Sesame Oil',
      qty: '1 bottle',
      note: 'Missing from Chicken Spinach Stir-Fry',
      suggested: true,
      checked: false,
    },
    {
      id: 's-3',
      name: 'Spinach',
      qty: '1 pack',
      note: 'You cook with it twice a week',
      suggested: true,
      checked: false,
    },
    { id: 's-4', name: 'Banana', qty: '1 comb', suggested: false, checked: false },
    { id: 's-5', name: 'Bread', qty: '1 loaf', suggested: false, checked: false },
    { id: 's-6', name: 'Coffee Beans', qty: '250 g', suggested: false, checked: true },
  ]
}

export const DEFAULT_PREFERENCES: UserPreference = {
  name: 'Stanley Wijaya',
  household: 'Wijaya Family',
  members: 4,
  diet: 'No restriction',
  allergies: ['Peanuts'],
  cuisines: ['Indonesian', 'Asian', 'Japanese'],
  recipePrefs: ['High Protein', 'Quick Meals', 'Low Waste'],
  notifications: { expiry: true, recipes: true, inventory: true, device: true },
  reminderTiming: ['3 days before', '1 day before', 'On expiry date'],
}

export const DIET_OPTIONS = ['No restriction', 'Vegetarian', 'Pescatarian', 'Halal only', 'Low carb']
export const ALLERGY_OPTIONS = ['Peanuts', 'Shellfish', 'Eggs', 'Dairy', 'Gluten', 'Soy']
export const CUISINE_OPTIONS = ['Indonesian', 'Asian', 'Japanese', 'Italian', 'Western', 'Middle Eastern']
export const RECIPE_PREF_OPTIONS = ['High Protein', 'Quick Meals', 'Low Waste', 'Budget Friendly', 'Family Portions']
export const REMINDER_TIMING_OPTIONS = ['3 days before', '1 day before', 'On expiry date']

/** Prompts offered in the Ask FRISA sheet. */
export const ASSISTANT_PROMPTS = [
  "What's expiring soon?",
  'What can I cook tonight?',
  'Do I still have milk?',
  'How many eggs are left?',
  'What should I use first?',
  'How much have I saved this month?',
]
