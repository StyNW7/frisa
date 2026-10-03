import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Apple, CupSoda, Drumstick, Milk, Package, Salad, Snowflake, Utensils, Wheat } from 'lucide-react'
import type { FoodCategory } from '@/types'
import { CATEGORY_BACKDROP, NEUTRAL_BACKDROP, foodPhoto } from '@/lib/foodImagery'
import { cn } from '@/lib/utils'

/**
 * Food thumbnails: a real cut-out photo of the item on a soft category backdrop.
 * The photo floats with its own shadow, so a carton, a fillet and a leaf all
 * read as objects rather than as cropped squares. An icon only appears if the
 * image itself fails to load.
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

export type FoodAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const BOX: Record<FoodAvatarSize, string> = {
  xs: 'h-9 w-9 rounded-xl',
  sm: 'h-10 w-10 rounded-xl',
  md: 'h-12 w-12 rounded-2xl',
  lg: 'h-14 w-14 rounded-2xl',
  xl: 'h-20 w-20 rounded-3xl',
}

const GLYPH: Record<FoodAvatarSize, string> = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-[22px] w-[22px]',
  lg: 'h-6 w-6',
  xl: 'h-9 w-9',
}

/** The cut-out with its shadow and fade-in. Shared by the avatar and the large stage. */
export function FoodPhoto({
  name,
  category,
  className,
  glyphClassName,
  eager,
}: {
  name: string
  category?: FoodCategory
  className?: string
  glyphClassName?: string
  /** Above-the-fold heroes load immediately; list thumbnails load lazily. */
  eager?: boolean
}) {
  const src = foodPhoto(name, category)
  const [failed, setFailed] = useState<string | null>(null)
  const [loaded, setLoaded] = useState<string | null>(null)

  if (!src || failed === src) {
    const Icon = (category && CATEGORY_ICON[category]) || Package
    return <Icon className={cn('text-ink-soft/70', glyphClassName)} strokeWidth={1.9} aria-hidden />
  }

  return (
    <img
      src={src}
      alt=""
      draggable={false}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setLoaded(src)}
      onError={() => setFailed(src)}
      className={cn(
        'pointer-events-none select-none object-contain transition-[opacity,transform] duration-500 ease-out',
        '[filter:drop-shadow(0_6px_8px_rgba(24,33,28,0.16))_drop-shadow(0_1px_1.5px_rgba(24,33,28,0.12))]',
        loaded === src ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
        className,
      )}
    />
  )
}

export function FoodAvatar({
  name,
  category,
  size = 'md',
  className,
}: {
  name: string
  category?: FoodCategory
  size?: FoodAvatarSize
  className?: string
}) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden ring-1 ring-inset ring-ink/[0.06]',
        BOX[size],
        className,
      )}
      style={{ background: category ? CATEGORY_BACKDROP[category] : NEUTRAL_BACKDROP }}
      aria-hidden
    >
      <FoodPhoto name={name} category={category} className="h-[84%] w-[84%]" glyphClassName={GLYPH[size]} />
    </span>
  )
}

/**
 * The large product shot at the top of a food's page: the photo on a lit
 * backdrop with a soft floor shadow, like a studio pack shot.
 */
export function FoodStage({
  name,
  category,
  className,
  photoClassName,
  eager = true,
  children,
}: {
  name: string
  category: FoodCategory
  className?: string
  photoClassName?: string
  /** True for a page hero; false for cards in a scrolling grid or rail. */
  eager?: boolean
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn('relative isolate flex items-center justify-center overflow-hidden', className)}
      style={{ background: CATEGORY_BACKDROP[category] }}
    >
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[78%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-2xl"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-[13%] left-1/2 -z-10 h-5 w-[42%] -translate-x-1/2 rounded-[50%] bg-ink/15 blur-lg"
        aria-hidden
      />
      <FoodPhoto
        name={name}
        category={category}
        eager={eager}
        className={cn('h-[78%] w-[78%] max-w-[260px]', photoClassName)}
        glyphClassName="h-16 w-16"
      />
      {children}
    </div>
  )
}
