import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Camera,
  CircleCheck,
  CircleHelp,
  Cpu,
  Minus,
  PencilLine,
  Plus,
  RefreshCw,
  ScanLine,
  Smartphone,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import type { FoodCategory, FoodItem, StorageLocation } from '@/types'
import { PageHeader } from '@/components/common/TopHeader'
import { Button } from '@/components/common/Button'
import { StatusChip } from '@/components/common/Badges'
import { FoodAvatar } from '@/components/common/FoodAvatar'
import { SegmentedControl } from '@/components/common/Primitives'
import { FrisaMark } from '@/components/common/FrisaMark'
import { FOOD_CATEGORIES, STORAGE_LOCATIONS } from '@/data/fridges'
import { useApp, useToast } from '@/hooks/useApp'
import { cn, isoInDays, riskScore, rupiah } from '@/lib/utils'

type Mode = 'hub' | 'phone' | 'manual'
type Phase = 'ready' | 'scanning' | 'recognised' | 'unknown' | 'form' | 'added'

interface Draft {
  name: string
  category: FoodCategory
  quantity: number
  unit: string
  expiresAt: string
  storage: StorageLocation
  value: number
  weightKg: number
}

interface Detection extends Draft {
  confidence: number
}

const HUB_DETECTION: Detection = {
  name: 'Ultra Milk Full Cream 1L',
  category: 'Dairy',
  quantity: 1,
  unit: 'L',
  expiresAt: isoInDays(3),
  storage: 'Door Shelf',
  value: 22000,
  weightKg: 1.03,
  confidence: 94,
}

const PHONE_DETECTION: Detection = {
  name: 'Fuji Apples',
  category: 'Fruit',
  quantity: 4,
  unit: 'pcs',
  expiresAt: isoInDays(9),
  storage: 'Fresh Drawer',
  value: 32000,
  weightKg: 0.64,
  confidence: 91,
}

const UNKNOWN_SUGGESTIONS = ['Leftover Fried Rice', 'Homemade Sambal', 'Chicken Soup', 'Sliced Papaya']

const EMPTY_DRAFT: Draft = {
  name: '',
  category: 'Vegetables',
  quantity: 1,
  unit: 'pcs',
  expiresAt: isoInDays(5),
  storage: 'Fresh Drawer',
  value: 20000,
  weightKg: 0.3,
}

const UNITS = ['pcs', 'pack', 'packs', 'g', 'ml', 'L', 'bottle', 'bottles', 'cups', 'container', 'head', 'loaf']

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'
}

export function ScanPage() {
  const navigate = useNavigate()
  const { addItem, activeFridge } = useApp()
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()

  const [mode, setMode] = useState<Mode>(params.get('tab') === 'manual' ? 'manual' : 'hub')
  const [phase, setPhase] = useState<Phase>(params.get('tab') === 'manual' ? 'form' : 'ready')
  const [progress, setProgress] = useState(0)
  const [detection, setDetection] = useState<Detection | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [addedName, setAddedName] = useState('')

  useEffect(() => {
    if (params.get('tab')) {
      const next = new URLSearchParams(params)
      next.delete('tab')
      setParams(next, { replace: true })
    }
  }, [params, setParams])

  const reset = useCallback((next: Mode) => {
    setMode(next)
    setDetection(null)
    setProgress(0)
    setDraft(EMPTY_DRAFT)
    setPhase(next === 'manual' ? 'form' : 'ready')
  }, [])

  /* Simulated recognition run. */
  const runScan = (recognisable: boolean) => {
    setPhase('scanning')
    setProgress(0)
    const started = Date.now()
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - started
      setProgress(Math.min(100, Math.round((elapsed / 2100) * 100)))
    }, 60)
    window.setTimeout(() => {
      window.clearInterval(tick)
      setProgress(100)
      if (recognisable) {
        const found = mode === 'hub' ? HUB_DETECTION : PHONE_DETECTION
        setDetection(found)
        setDraft({ ...found })
        setPhase('recognised')
      } else {
        setDetection(null)
        setDraft({ ...EMPTY_DRAFT, expiresAt: isoInDays(2), category: 'Leftover', unit: 'container' })
        setPhase('unknown')
      }
    }, 2150)
  }

  const previewRisk = useMemo(() => {
    const preview: FoodItem = {
      id: 'preview',
      name: draft.name || 'New item',
      category: draft.category,
      quantity: draft.quantity,
      initialQuantity: draft.quantity,
      unit: draft.unit,
      addedAt: isoInDays(0),
      expiresAt: draft.expiresAt,
      storage: draft.storage,
      value: draft.value,
      weightKg: draft.weightKg,
      patternAdjust: 0,
      source: mode === 'manual' ? 'manual' : mode === 'phone' ? 'phone' : 'hub',
    }
    return riskScore(preview)
  }, [draft, mode])

  const submit = () => {
    if (!draft.name.trim()) {
      toast('Give the item a name first', { tone: 'warning' })
      return
    }
    const item: FoodItem = {
      id: slug(draft.name),
      name: draft.name.trim(),
      category: draft.category,
      quantity: draft.quantity,
      initialQuantity: draft.quantity,
      unit: draft.unit,
      addedAt: isoInDays(0),
      expiresAt: draft.expiresAt,
      storage: draft.storage,
      value: draft.value,
      weightKg: draft.weightKg,
      patternAdjust: 0,
      source: mode === 'manual' ? 'manual' : mode === 'phone' ? 'phone' : 'hub',
    }
    addItem(item)
    setAddedName(item.name)
    setPhase('added')
    toast('Inventory updated', { description: `${item.name} was added to ${activeFridge.name}.` })
  }

  const stepQty = draft.unit === 'g' || draft.unit === 'ml' ? 50 : 1

  return (
    <div className="pb-8">
      <PageHeader
        title="Add Food"
        subtitle={`New items go straight into ${activeFridge.name}`}
      />

      <div className="px-5 pt-4">
        <SegmentedControl<Mode>
          label="Add method"
          value={mode}
          onChange={reset}
          options={[
            { value: 'hub', label: 'FRISA Camera' },
            { value: 'phone', label: 'Phone Camera' },
            { value: 'manual', label: 'Manual' },
          ]}
        />
      </div>

      <div className="space-y-5 px-5 pt-5">
        {/* Success */}
        {phase === 'added' ? (
          <section className="card animate-fade-up overflow-hidden">
            <div
              className="p-6 text-center"
              style={{ background: 'linear-gradient(135deg, #EAF8F1 0%, #FFFFFF 70%)' }}
            >
              <span className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-frisa-500 text-white">
                <CircleCheck className="h-8 w-8" strokeWidth={2.2} aria-hidden />
              </span>
              <h2 className="text-lg font-extrabold tracking-tight text-ink">Inventory updated</h2>
              <p className="mx-auto mt-2 max-w-[270px] text-[13px] leading-relaxed text-ink-muted">
                {addedName} is now tracked in {activeFridge.name} and synced to every device in your household.
              </p>
            </div>
            <div className="flex gap-3 border-t border-line p-4">
              <Button variant="outline" size="lg" block onClick={() => reset(mode)}>
                Add another
              </Button>
              <Button size="lg" block onClick={() => navigate('/inventory')}>
                View inventory
              </Button>
            </div>
          </section>
        ) : null}

        {/* Camera modes */}
        {mode !== 'manual' && phase !== 'added' && phase !== 'form' ? (
          <section className="space-y-4">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] bg-ink">
              {/* Viewfinder backdrop */}
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  background:
                    'radial-gradient(120% 80% at 50% 20%, rgba(37,184,119,0.28) 0%, rgba(24,33,28,0) 60%), linear-gradient(180deg, #1f2a24 0%, #18211C 100%)',
                }}
                aria-hidden
              />

              {/* Corner brackets */}
              {[
                'left-6 top-6 border-l-[3px] border-t-[3px] rounded-tl-2xl',
                'right-6 top-6 border-r-[3px] border-t-[3px] rounded-tr-2xl',
                'left-6 bottom-6 border-b-[3px] border-l-[3px] rounded-bl-2xl',
                'right-6 bottom-6 border-b-[3px] border-r-[3px] rounded-br-2xl',
              ].map((position) => (
                <span
                  key={position}
                  className={cn('absolute h-12 w-12 border-frisa-400/90', position)}
                  aria-hidden
                />
              ))}

              {phase === 'scanning' ? (
                <span
                  className="absolute inset-x-8 top-8 h-24 animate-scan-sweep rounded-full"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(37,184,119,0) 0%, rgba(37,184,119,0.45) 50%, rgba(37,184,119,0) 100%)',
                  }}
                  aria-hidden
                />
              ) : null}

              {/* Subject placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={cn(
                    'flex h-32 w-32 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-inset ring-white/15 transition-transform duration-500',
                    phase === 'scanning' && 'scale-95',
                  )}
                >
                  {phase === 'recognised' && detection ? (
                    <FoodAvatar name={detection.name} category={detection.category} size="xl" className="bg-white/90" />
                  ) : phase === 'unknown' ? (
                    <CircleHelp className="h-12 w-12 text-white/70" strokeWidth={1.6} aria-hidden />
                  ) : (
                    <ScanLine className="h-12 w-12 text-white/60" strokeWidth={1.4} aria-hidden />
                  )}
                </div>
              </div>

              {/* Status strip */}
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-ink/90 to-transparent px-5 pb-5 pt-10">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-inset ring-white/20">
                  {mode === 'hub' ? (
                    <Cpu className="h-4 w-4" strokeWidth={2} aria-hidden />
                  ) : (
                    <Smartphone className="h-4 w-4" strokeWidth={2} aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-white">
                    {phase === 'ready'
                      ? 'Ready to scan'
                      : phase === 'scanning'
                        ? 'Recognising item...'
                        : phase === 'recognised'
                          ? 'Item recognised'
                          : 'Unable to identify item'}
                  </p>
                  <p className="truncate text-2xs text-white/60">
                    {mode === 'hub' ? `${activeFridge.deviceId} camera` : 'Phone camera'}
                  </p>
                </div>
                {phase === 'scanning' ? (
                  <span className="num shrink-0 text-xs font-bold text-frisa-300">{progress}%</span>
                ) : null}
              </div>

              {phase === 'scanning' ? (
                <div className="absolute inset-x-5 bottom-[68px] h-1 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-frisa-400 transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ) : null}
            </div>

            {/* Controls */}
            {phase === 'ready' ? (
              <div className="space-y-3">
                <Button size="lg" block onClick={() => runScan(true)}>
                  {mode === 'hub' ? (
                    <>
                      <ScanLine className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
                      Show item to FRISA
                    </>
                  ) : (
                    <>
                      <Camera className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
                      Capture item
                    </>
                  )}
                </Button>
                <Button variant="outline" size="lg" block onClick={() => runScan(false)}>
                  <CircleHelp className="h-[18px] w-[18px]" strokeWidth={2.1} aria-hidden />
                  Scan an unlabelled item
                </Button>
                <p className="px-1 text-center text-2xs leading-relaxed text-ink-faint">
                  {mode === 'hub'
                    ? 'The FRISA Hub camera reads the item as you place it in the fridge. Nothing needs to be opened on your phone.'
                    : 'Use your phone when you are away from the hub. The result syncs back to the same inventory.'}
                </p>
              </div>
            ) : null}

            {phase === 'scanning' ? (
              <div className="flex items-center justify-center gap-2.5 rounded-2xl bg-frisa-50 px-4 py-3.5">
                <Sparkles className="h-4 w-4 animate-pulse text-frisa-600" strokeWidth={2.2} aria-hidden />
                <p className="text-[13px] font-semibold text-frisa-800">FRISA is identifying your item...</p>
              </div>
            ) : null}

            {phase === 'recognised' && detection ? (
              <section className="card animate-fade-up overflow-hidden">
                <div className="flex items-start gap-3.5 p-4">
                  <FoodAvatar name={detection.name} category={detection.category} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold leading-tight text-ink">{detection.name}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">Detected category: {detection.category}</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <StatusChip tone="green" icon={CircleCheck}>
                        {detection.confidence}% confidence
                      </StatusChip>
                      <StatusChip tone="neutral" icon={Cpu}>
                        {mode === 'hub' ? 'FRISA Hub' : 'Phone camera'}
                      </StatusChip>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 border-t border-line p-4">
                  <Button variant="outline" size="lg" block onClick={() => setPhase('form')}>
                    <PencilLine className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                    Edit details
                  </Button>
                  <Button size="lg" block onClick={() => setPhase('form')}>
                    Continue
                  </Button>
                </div>
              </section>
            ) : null}

            {phase === 'unknown' ? (
              <section className="card animate-fade-up overflow-hidden">
                <div className="flex items-start gap-3 p-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ember-50 text-ember-600">
                    <TriangleAlert className="h-5 w-5" strokeWidth={2.1} aria-hidden />
                  </span>
                  <div>
                    <p className="text-[15px] font-bold leading-tight text-ink">
                      We need your help identifying this item
                    </p>
                    <p className="mt-1 text-[13px] leading-snug text-ink-muted">
                      Home-cooked and unlabelled food is hard to recognise. Tell FRISA what it is and it will remember
                      for next time.
                    </p>
                  </div>
                </div>

                <div className="border-t border-line p-4">
                  <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                    Common in your household
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {UNKNOWN_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setDraft((d) => ({ ...d, name: suggestion }))
                          setPhase('form')
                        }}
                        className="rounded-2xl border border-line px-3 py-2.5 text-[13px] font-semibold text-ink-muted transition-colors hover:border-frisa-200 hover:text-frisa-700"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Button variant="outline" size="lg" block onClick={() => runScan(true)}>
                      <RefreshCw className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                      Scan again
                    </Button>
                    <Button size="lg" block onClick={() => setPhase('form')}>
                      Enter manually
                    </Button>
                  </div>
                </div>
              </section>
            ) : null}
          </section>
        ) : null}

        {/* Confirmation / manual form */}
        {phase === 'form' ? (
          <section className="animate-fade-up space-y-4">
            {mode !== 'manual' && detection ? (
              <div className="flex items-center gap-3 rounded-2xl bg-frisa-50 p-3.5">
                <FrisaMark className="h-9 w-9 shrink-0" />
                <p className="text-[13px] leading-snug text-frisa-800">
                  I detected {detection.name} at {detection.confidence}% confidence. Confirm the quantity and expiry
                  date and I will add it.
                </p>
              </div>
            ) : null}

            <div className="card space-y-4 p-4">
              <div>
                <label htmlFor="item-name" className="mb-1.5 block text-[13px] font-bold text-ink">
                  Item name
                </label>
                <input
                  id="item-name"
                  value={draft.name}
                  onChange={(event) => setDraft((d) => ({ ...d, name: event.target.value }))}
                  placeholder="For example, Fresh Milk"
                  className="h-12 w-full rounded-2xl border border-line bg-mist/50 px-3.5 text-sm font-semibold text-ink placeholder:font-normal placeholder:text-ink-faint focus:border-frisa-400 focus:bg-surface focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="item-category" className="mb-1.5 block text-[13px] font-bold text-ink">
                    Category
                  </label>
                  <select
                    id="item-category"
                    value={draft.category}
                    onChange={(event) => setDraft((d) => ({ ...d, category: event.target.value as FoodCategory }))}
                    className="h-12 w-full rounded-2xl border border-line bg-mist/50 px-3 text-sm font-semibold text-ink focus:border-frisa-400 focus:bg-surface focus:outline-none"
                  >
                    {FOOD_CATEGORIES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="item-storage" className="mb-1.5 block text-[13px] font-bold text-ink">
                    Storage
                  </label>
                  <select
                    id="item-storage"
                    value={draft.storage}
                    onChange={(event) => setDraft((d) => ({ ...d, storage: event.target.value as StorageLocation }))}
                    className="h-12 w-full rounded-2xl border border-line bg-mist/50 px-3 text-sm font-semibold text-ink focus:border-frisa-400 focus:bg-surface focus:outline-none"
                  >
                    {STORAGE_LOCATIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[13px] font-bold text-ink">Quantity</p>
                <div className="flex items-center gap-2.5">
                  <div className="flex flex-1 items-center justify-between rounded-2xl border border-line bg-mist/50 p-1.5">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() =>
                        setDraft((d) => ({ ...d, quantity: Math.max(stepQty, d.quantity - stepQty) }))
                      }
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-ink shadow-card transition-transform active:scale-95"
                    >
                      <Minus className="h-4 w-4" strokeWidth={2.4} />
                    </button>
                    <span className="num text-lg font-extrabold text-ink">{draft.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setDraft((d) => ({ ...d, quantity: d.quantity + stepQty }))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-ink shadow-card transition-transform active:scale-95"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.4} />
                    </button>
                  </div>
                  <select
                    aria-label="Unit"
                    value={draft.unit}
                    onChange={(event) => setDraft((d) => ({ ...d, unit: event.target.value }))}
                    className="h-12 w-28 rounded-2xl border border-line bg-mist/50 px-3 text-sm font-semibold text-ink focus:border-frisa-400 focus:bg-surface focus:outline-none"
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="item-expiry" className="mb-1.5 block text-[13px] font-bold text-ink">
                    Expiry date
                  </label>
                  <input
                    id="item-expiry"
                    type="date"
                    value={draft.expiresAt}
                    min={isoInDays(0)}
                    onChange={(event) => setDraft((d) => ({ ...d, expiresAt: event.target.value }))}
                    className="h-12 w-full rounded-2xl border border-line bg-mist/50 px-3 text-sm font-semibold text-ink focus:border-frisa-400 focus:bg-surface focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="item-value" className="mb-1.5 block text-[13px] font-bold text-ink">
                    Estimated value
                  </label>
                  <input
                    id="item-value"
                    type="number"
                    min={0}
                    step={1000}
                    value={draft.value}
                    onChange={(event) => setDraft((d) => ({ ...d, value: Number(event.target.value) || 0 }))}
                    className="num h-12 w-full rounded-2xl border border-line bg-mist/50 px-3 text-sm font-semibold text-ink focus:border-frisa-400 focus:bg-surface focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-2xl bg-mist/60 p-3.5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Predicted waste risk</p>
                  <p className="num mt-0.5 text-lg font-extrabold text-ink">{previewRisk} / 100</p>
                </div>
                <p className="max-w-[52%] text-right text-2xs leading-snug text-ink-muted">
                  Based on the expiry date, category and {rupiah(draft.value)} of value at stake.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              {mode !== 'manual' ? (
                <Button variant="outline" size="lg" block onClick={() => reset(mode)}>
                  Cancel
                </Button>
              ) : null}
              <Button size="lg" block onClick={submit}>
                <CircleCheck className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
                Confirm &amp; Add
              </Button>
            </div>
          </section>
        ) : null}

        {/* Workflow explainer */}
        {phase !== 'added' ? (
          <section className="rounded-3xl border border-line bg-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink-faint">How FRISA adds food</p>
            <ol className="mt-3 space-y-2.5">
              {[
                'The hub camera recognises the item as it goes in.',
                'If FRISA is unsure, you name it once and it learns.',
                'You confirm quantity and expiry date.',
                'The inventory syncs to every device in the household.',
              ].map((line, index) => (
                <li key={line} className="flex items-start gap-2.5">
                  <span className="num mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-frisa-50 text-[10px] font-extrabold text-frisa-700">
                    {index + 1}
                  </span>
                  <p className="text-[13px] leading-snug text-ink-muted">{line}</p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </div>
  )
}
