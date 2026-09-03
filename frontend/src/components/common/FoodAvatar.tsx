import type { LucideIcon } from 'lucide-react'
import {
  Apple,
  Banana,
  Beef,
  Carrot,
  Coffee,
  Croissant,
  CupSoda,
  Drumstick,
  Egg,
  Fish,
  IceCream,
  Leaf,
  Milk,
  Package,
  Pizza,
  Salad,
  Sandwich,
  Snowflake,
  Soup,
  Utensils,
  Wheat,
  Wine,
} from 'lucide-react'
import type { FoodCategory } from '@/types'
import { cn } from '@/lib/utils'

/**
 * Food thumbnails without photography: a category tint plus a specific icon.
 * Keeps the prototype fast, consistent and free of stock-image placeholders.
 */

const CATEGORY_ICON: Record<FoodCategory, LucideIcon> = {
  Vegetables: Salad,
  Protein: Drumstick,
  Dairy: Milk,
  Fruit: Apple,
  Drinks: CupSoda,
  Frozen: Snowflake,
  Leftover: Utensils,
  Pantry: Wheat,
}

const NAME_ICON: Array<[RegExp, LucideIcon]> = [
  [/spinach|bok choy|broccoli|lettuce/i, Leaf],
  [/egg/i, Egg],
  [/carrot/i, Carrot],
  [/apple/i, Apple],
  [/banana/i, Banana],
  [/milk|yogurt|yoghurt/i, Milk],
  [/beef|rendang|steak/i, Beef],
  [/salmon|fish|shrimp/i, Fish],
  [/pizza/i, Pizza],
  [/bread|toast|sandwich/i, Sandwich],
  [/coffee/i, Coffee],
  [/tea|juice|water/i, Wine],
  [/rice|soup|noodle/i, Soup],
  [/cheese|butter/i, Croissant],
  [/nugget|frozen/i, Snowflake],
  [/ice cream/i, IceCream],
]

const CATEGORY_TINT: Record<FoodCategory, string> = {
  Vegetables: 'bg-frisa-50 text-frisa-700',
  Protein: 'bg-ember-50 text-ember-700',
  Dairy: 'bg-info-50 text-info-600',
  Fruit: 'bg-ember-50 text-ember-600',
  Drinks: 'bg-info-50 text-info-600',
  Frozen: 'bg-info-50 text-info-600',
  Leftover: 'bg-mist text-ink-soft',
  Pantry: 'bg-mist text-ink-soft',
}

export function foodIcon(name: string, category: FoodCategory): LucideIcon {
  const match = NAME_ICON.find(([pattern]) => pattern.test(name))
  return match?.[1] ?? CATEGORY_ICON[category] ?? Package
}

export function FoodAvatar({
  name,
  category,
  size = 'md',
  className,
}: {
  name: string
  category: FoodCategory
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const Icon = foodIcon(name, category)
  const box =
    size === 'sm'
      ? 'h-10 w-10 rounded-xl'
      : size === 'md'
        ? 'h-12 w-12 rounded-2xl'
        : size === 'lg'
          ? 'h-14 w-14 rounded-2xl'
          : 'h-20 w-20 rounded-3xl'
  const glyph =
    size === 'sm' ? 'h-5 w-5' : size === 'md' ? 'h-[22px] w-[22px]' : size === 'lg' ? 'h-6 w-6' : 'h-9 w-9'

  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center', box, CATEGORY_TINT[category], className)}
      aria-hidden
    >
      <Icon className={glyph} strokeWidth={1.9} />
    </span>
  )
}
