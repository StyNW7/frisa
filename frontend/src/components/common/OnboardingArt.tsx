import { ArrowDown, Smartphone, Sparkles, Wifi } from 'lucide-react'
import type { FoodCategory } from '@/types'
import { FoodAvatar, FoodPhoto } from '@/components/common/FoodAvatar'
import { FrisaMark } from '@/components/common/FrisaMark'
import { Mascot } from '@/components/common/Mascot'
import { cn } from '@/lib/utils'

/* The art grows with the screen so tall phones are not left with an empty band. */
function Stage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative h-[clamp(248px,38dvh,330px)] w-full overflow-hidden rounded-[28px] border border-frisa-100 bg-gradient-to-b from-frisa-50 via-[#F5FBF8] to-white',
        className,
      )}
      aria-hidden
    >
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full border border-frisa-100" />
      <div className="pointer-events-none absolute -bottom-16 -right-8 h-48 w-48 rounded-full border border-frisa-100" />
      {children}
    </div>
  )
}

function Chip({
  className,
  icon: Icon,
  label,
}: {
  className?: string
  icon: typeof Wifi
  label: string
}) {
  return (
    <div className={cn('absolute inline-flex items-center gap-1.5 rounded-2xl bg-white px-2.5 py-2 shadow-card', className)}>
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-frisa-50 text-frisa-600">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <span className="text-[11px] font-bold text-ink">{label}</span>
    </div>
  )
}

/** A floating label with the food's photo, as the inventory would list it. */
function FoodChip({
  className,
  name,
  category,
  detail,
  style,
}: {
  className?: string
  name: string
  category: FoodCategory
  detail: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={cn('absolute z-10 inline-flex animate-bubble-in items-center gap-2 rounded-2xl bg-white/95 py-1.5 pl-1.5 pr-3 shadow-lift backdrop-blur-sm', className)}
      style={style}
    >
      <FoodAvatar name={name} category={category} size="xs" />
      <span className="leading-tight">
        <span className="block text-[11px] font-bold text-ink">{name}</span>
        <span className="block text-[10px] font-semibold text-ink-muted">{detail}</span>
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function ArtConnected() {
  return (
    <Stage>
      <div className="pointer-events-none absolute left-1/2 top-[54%] h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-frisa-100/70 blur-2xl" />
      <div className="absolute inset-x-0 bottom-0 flex h-[92%] animate-float items-end justify-center pl-16">
        <Mascot pose="hi" priority className="h-full max-h-[280px] w-auto drop-shadow-mascot" />
      </div>
      <div className="absolute left-4 top-5 z-10 animate-bubble-in rounded-2xl rounded-bl-md bg-white px-3 py-2 shadow-card">
        <span className="text-[12px] font-bold text-ink">Hello! I&apos;m Frisa</span>
        <span className="block text-[10px] font-semibold text-ink-muted">Your fridge&apos;s smart assistant</span>
      </div>
      <Chip className="right-4 top-[38%]" icon={Wifi} label="Connected" />
      <Chip className="bottom-6 right-6" icon={Smartphone} label="Paired" />
    </Stage>
  )
}

/** An open fridge, stocked with the real items, and the labels FRISA reads off them. */
function ArtInventory() {
  const shelves: Array<Array<[string, FoodCategory]>> = [
    [
      ['Fresh Milk', 'Dairy'],
      ['Orange Juice', 'Drinks'],
      ['Greek Yogurt', 'Dairy'],
    ],
    [
      ['Eggs', 'Protein'],
      ['Cheddar Cheese', 'Dairy'],
      ['Chicken Breast', 'Protein'],
    ],
    [
      ['Spinach', 'Vegetables'],
      ['Tomatoes', 'Vegetables'],
      ['Apples', 'Fruit'],
    ],
  ]
  return (
    <Stage>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex h-[84%] w-[150px] flex-col overflow-hidden rounded-[22px] border border-white bg-gradient-to-b from-[#F3F9FD] to-white p-2 shadow-lift ring-1 ring-frisa-100">
          <span className="pointer-events-none absolute inset-x-6 top-1.5 h-1 rounded-full bg-info-100/80" />
          {shelves.map((row, i) => (
            <div key={i} className="relative flex flex-1 items-end justify-around border-b-2 border-info-100/70 px-1 pb-1">
              {row.map(([name, category]) => (
                <FoodPhoto key={name} name={name} category={category} eager className="h-[78%] max-h-[44px] w-[30%]" />
              ))}
            </div>
          ))}
          <div className="flex h-[22%] items-center justify-center gap-1.5 rounded-b-[14px] bg-frisa-50/70">
            <FoodPhoto name="Carrot" category="Vegetables" eager className="h-[70%] w-[34%]" />
            <FoodPhoto name="Broccoli" category="Vegetables" eager className="h-[80%] w-[34%]" />
          </div>
        </div>
      </div>
      <FoodChip className="left-3 top-6" name="Spinach" category="Vegetables" detail="1 pack · fresh drawer" />
      <FoodChip className="right-3 top-[30%]" name="Fresh Milk" category="Dairy" detail="1 L · door shelf" style={{ animationDelay: '120ms' }} />
      <FoodChip className="bottom-12 left-4" name="Eggs" category="Protein" detail="6 pcs · egg tray" style={{ animationDelay: '240ms' }} />
      <FoodChip className="bottom-4 right-5" name="Chicken Breast" category="Protein" detail="450 g · lower shelf" style={{ animationDelay: '360ms' }} />
    </Stage>
  )
}

function ArtPriority() {
  const rows: Array<{ name: string; category: FoodCategory; when: string; score: number; urgent: boolean }> = [
    { name: 'Spinach', category: 'Vegetables', when: 'Tomorrow', score: 86, urgent: true },
    { name: 'Chicken Breast', category: 'Protein', when: 'in 2 days', score: 74, urgent: true },
    { name: 'Fresh Milk', category: 'Dairy', when: 'in 3 days', score: 66, urgent: false },
  ]
  return (
    <Stage>
      <div className="absolute inset-0 flex flex-col justify-center gap-2.5 px-5">
        {rows.map((row, i) => (
          <div
            key={row.name}
            className="flex animate-fade-up items-center gap-3 rounded-2xl bg-white p-2.5 pr-3 shadow-card"
            style={{ animationDelay: `${i * 110}ms` }}
          >
            <FoodAvatar name={row.name} category={row.category} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-bold text-ink">{row.name}</span>
                <span
                  className={cn(
                    'num rounded-full px-2 py-0.5 text-[10px] font-bold',
                    row.urgent ? 'bg-ember-50 text-ember-700' : 'bg-mist text-ink-soft',
                  )}
                >
                  Risk {row.score}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-mist">
                <div
                  className={cn('h-full rounded-full', row.urgent ? 'bg-ember-500' : 'bg-frisa-400')}
                  style={{ width: `${row.score}%` }}
                />
              </div>
              <span className="mt-1 block text-[10px] font-semibold text-ink-muted">Expires {row.when}</span>
            </div>
          </div>
        ))}
      </div>
    </Stage>
  )
}

function ArtRecipe() {
  const ingredients: Array<[string, FoodCategory]> = [
    ['Spinach', 'Vegetables'],
    ['Chicken Breast', 'Protein'],
    ['Broccoli', 'Vegetables'],
  ]
  return (
    <Stage>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
        <div className="flex items-end gap-3">
          {ingredients.map(([name, category], i) => (
            <span key={name} className="flex animate-fade-up flex-col items-center gap-1" style={{ animationDelay: `${i * 100}ms` }}>
              <FoodAvatar name={name} category={category} size="lg" className="shadow-card ring-2 ring-white" />
              <span className="text-[10px] font-semibold text-ink-muted">{name.split(' ')[0]}</span>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 text-frisa-500">
          <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.6} />
          <FrisaMark className="h-8 w-8" />
          <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.6} />
        </div>

        <div className="w-full max-w-[260px] animate-pop-in overflow-hidden rounded-2xl bg-white shadow-lift">
          <div className="flex items-center gap-3 p-2">
            <img
              src="/Images/recipes/chicken-spinach-stir-fry.webp"
              alt=""
              className="h-14 w-14 shrink-0 rounded-xl object-cover"
            />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold text-ink">Chicken Spinach Stir-Fry</span>
              <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-frisa-700">
                <Sparkles className="h-3 w-3" strokeWidth={2.4} />
                92% match · 25 min
              </span>
            </span>
          </div>
        </div>
      </div>
    </Stage>
  )
}

export const ONBOARDING_ART = [ArtConnected, ArtInventory, ArtPriority, ArtRecipe]
