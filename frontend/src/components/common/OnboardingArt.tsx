import {
  Apple,
  ArrowRight,
  ChefHat,
  Drumstick,
  Egg,
  Leaf,
  Milk,
  Salad,
  Smartphone,
  Wifi,
} from 'lucide-react'
import { FrisaMark } from '@/components/common/FrisaMark'
import { cn } from '@/lib/utils'

function Stage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative h-[248px] w-full overflow-hidden rounded-[28px] border border-frisa-100 bg-gradient-to-b from-frisa-50 to-white',
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

function FridgeBody({ className }: { className?: string }) {
  return (
    <div className={cn('relative flex h-[142px] w-[92px] flex-col rounded-2xl bg-white shadow-card', className)}>
      <div className="flex-[0.38] rounded-t-2xl border-b-2 border-frisa-50 bg-gradient-to-b from-white to-frisa-50/60" />
      <div className="flex-1 rounded-b-2xl bg-gradient-to-b from-white to-frisa-50/40" />
      <span className="absolute right-2 top-[38%] h-6 w-[3px] rounded-full bg-frisa-200" />
      <span className="absolute right-2 top-[52%] h-8 w-[3px] rounded-full bg-frisa-200" />
    </div>
  )
}

function Floating({
  className,
  icon: Icon,
  label,
  tone = 'green',
}: {
  className?: string
  icon: typeof Leaf
  label: string
  tone?: 'green' | 'orange' | 'plain'
}) {
  return (
    <div
      className={cn(
        'absolute inline-flex items-center gap-1.5 rounded-2xl bg-white px-2.5 py-2 shadow-card',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex h-6 w-6 items-center justify-center rounded-lg',
          tone === 'green' && 'bg-frisa-50 text-frisa-600',
          tone === 'orange' && 'bg-ember-50 text-ember-600',
          tone === 'plain' && 'bg-mist text-ink-soft',
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <span className="text-[11px] font-bold text-ink">{label}</span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function ArtConnected() {
  return (
    <Stage>
      <div className="absolute inset-0 flex items-center justify-center gap-9">
        <div className="relative">
          <FridgeBody />
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-2xl bg-frisa-500 p-1.5 shadow-pill">
            <FrisaMark className="h-8 w-8" tone="white" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <Wifi className="h-5 w-5 text-frisa-400" strokeWidth={2.2} />
          <span className="h-px w-12 bg-gradient-to-r from-frisa-200 via-frisa-400 to-frisa-200" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-frisa-600">Synced</span>
        </div>

        <div className="relative flex h-[142px] w-[78px] flex-col items-center rounded-[18px] border-4 border-ink bg-white p-2 shadow-card">
          <span className="mb-2 h-1 w-6 rounded-full bg-ink/20" />
          <Smartphone className="h-4 w-4 text-frisa-500" strokeWidth={2} />
          <div className="mt-2 w-full space-y-1.5">
            <span className="block h-2 w-full rounded-full bg-frisa-100" />
            <span className="block h-2 w-4/5 rounded-full bg-mist" />
            <span className="block h-2 w-3/5 rounded-full bg-mist" />
          </div>
        </div>
      </div>
    </Stage>
  )
}

function ArtInventory() {
  return (
    <Stage>
      <div className="absolute inset-0 flex items-center justify-center">
        <FridgeBody />
      </div>
      <Floating className="left-4 top-8" icon={Leaf} label="Spinach" />
      <Floating className="right-5 top-14" icon={Milk} label="Milk" tone="plain" />
      <Floating className="bottom-16 left-6" icon={Egg} label="Eggs 6" tone="plain" />
      <Floating className="bottom-8 right-8" icon={Drumstick} label="450 g" tone="orange" />
      <Floating className="right-3 top-[46%]" icon={Apple} label="Apples" tone="green" />
    </Stage>
  )
}

function ArtPriority() {
  const rows = [
    { name: 'Spinach', when: 'Tomorrow', score: 86, tone: 'orange' as const, width: '86%' },
    { name: 'Chicken Breast', when: 'in 2 days', score: 74, tone: 'orange' as const, width: '74%' },
    { name: 'Fresh Milk', when: 'in 3 days', score: 66, tone: 'plain' as const, width: '66%' },
  ]
  return (
    <Stage>
      <div className="absolute inset-0 flex flex-col justify-center gap-2.5 px-6">
        {rows.map((row) => (
          <div key={row.name} className="rounded-2xl bg-white p-3 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink">{row.name}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold',
                  row.tone === 'orange' ? 'bg-ember-50 text-ember-700' : 'bg-mist text-ink-soft',
                )}
              >
                {row.score}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-mist">
              <div
                className={cn('h-full rounded-full', row.tone === 'orange' ? 'bg-ember-500' : 'bg-frisa-400')}
                style={{ width: row.width }}
              />
            </div>
            <span className="mt-1.5 block text-[10px] font-semibold text-ink-muted">Expires {row.when}</span>
          </div>
        ))}
      </div>
    </Stage>
  )
}

function ArtRecipe() {
  return (
    <Stage>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
        <div className="flex items-center gap-2">
          {[
            { icon: Salad, label: 'Spinach' },
            { icon: Drumstick, label: 'Chicken' },
            { icon: Leaf, label: 'Broccoli' },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="flex flex-col items-center gap-1">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-frisa-600 shadow-card">
                <Icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <span className="text-[10px] font-semibold text-ink-muted">{label}</span>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="h-px w-8 bg-frisa-200" />
          <FrisaMark className="h-9 w-9" />
          <ArrowRight className="h-4 w-4 text-frisa-400" strokeWidth={2.4} />
        </div>

        <div className="w-full max-w-[240px] rounded-2xl bg-white p-3 shadow-card">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-frisa-500 text-white">
              <ChefHat className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold text-ink">Chicken Spinach Stir-Fry</span>
              <span className="text-[10px] font-semibold text-frisa-700">92% match · 25 min</span>
            </span>
          </div>
        </div>
      </div>
    </Stage>
  )
}

export const ONBOARDING_ART = [ArtConnected, ArtInventory, ArtPriority, ArtRecipe]
