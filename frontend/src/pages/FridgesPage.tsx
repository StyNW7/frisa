import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  Cpu,
  PackageOpen,
  Refrigerator,
  SquarePen,
  Thermometer,
  Wifi,
  WifiOff,
} from 'lucide-react'
import type { Fridge } from '@/types'
import { TopHeader } from '@/components/common/TopHeader'
import { Button } from '@/components/common/Button'
import { BottomSheet } from '@/components/common/BottomSheet'
import { StatusChip } from '@/components/common/Badges'
import { useApp, useToast } from '@/hooks/useApp'
import { cn, isPriority, pluralize, relativeMinutes, rupiah } from '@/lib/utils'

export function FridgesPage() {
  const navigate = useNavigate()
  const { fridges, activeFridgeId, setActiveFridge, renameFridge } = useApp()
  const { toast } = useToast()

  const [renaming, setRenaming] = useState<Fridge | null>(null)
  const [draftName, setDraftName] = useState('')

  return (
    <div className="pb-8">
      <TopHeader title="Your fridges" subtitle={`${fridges.length} connected FRISA hubs`} />

      <div className="space-y-4 px-5 pt-4">
        {fridges.map((fridge) => {
          const active = fridge.id === activeFridgeId
          const priority = fridge.items.filter(isPriority).length
          const value = fridge.items.reduce((sum, item) => sum + item.value, 0)

          return (
            <article
              key={fridge.id}
              className={cn(
                'card overflow-hidden transition-colors',
                active && 'border-frisa-300 ring-1 ring-frisa-100',
              )}
            >
              <div className="flex items-start gap-3.5 p-4">
                <span
                  className={cn(
                    'inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                    fridge.online ? 'bg-frisa-50 text-frisa-600' : 'bg-mist text-ink-faint',
                  )}
                >
                  {fridge.online ? (
                    <Refrigerator className="h-[22px] w-[22px]" strokeWidth={1.9} aria-hidden />
                  ) : (
                    <WifiOff className="h-[22px] w-[22px]" strokeWidth={1.9} aria-hidden />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-[15px] font-bold leading-tight text-ink">{fridge.name}</h2>
                    {active ? <StatusChip tone="green">Active</StatusChip> : null}
                  </div>
                  <p className="num mt-0.5 text-xs text-ink-muted">
                    {fridge.location} · {fridge.deviceId}
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <StatusChip tone={fridge.online ? 'green' : 'neutral'} icon={fridge.online ? Wifi : WifiOff}>
                      {fridge.online ? 'Online' : `Last connected ${relativeMinutes(fridge.lastSyncMinutes)}`}
                    </StatusChip>
                    <StatusChip tone="neutral" icon={PackageOpen}>
                      {pluralize(fridge.items.length, 'item')}
                    </StatusChip>
                    {priority > 0 ? <StatusChip tone="orange">{priority} at risk</StatusChip> : null}
                  </div>
                </div>
              </div>

              <dl className="grid grid-cols-3 divide-x divide-line border-t border-line">
                <div className="px-3 py-2.5 text-center">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Temperature</dt>
                  <dd className="num mt-0.5 text-[13px] font-bold text-ink">{fridge.temperature.toFixed(1)}&deg;C</dd>
                </div>
                <div className="px-3 py-2.5 text-center">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Hub battery</dt>
                  <dd className="num mt-0.5 text-[13px] font-bold text-ink">{fridge.battery}%</dd>
                </div>
                <div className="px-3 py-2.5 text-center">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Value held</dt>
                  <dd className="num mt-0.5 text-[13px] font-bold text-ink">{rupiah(value)}</dd>
                </div>
              </dl>

              <div className="grid grid-cols-2 gap-2 border-t border-line p-3">
                <Button
                  variant={active ? 'outline' : 'primary'}
                  size="sm"
                  disabled={active}
                  onClick={() => {
                    setActiveFridge(fridge.id)
                    toast(`Switched to ${fridge.name}`, { description: 'The whole app now follows this fridge.' })
                  }}
                >
                  <ArrowLeftRight className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                  {active ? 'Selected' : 'Switch'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRenaming(fridge)
                    setDraftName(fridge.name)
                  }}
                >
                  <SquarePen className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                  Rename
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setActiveFridge(fridge.id)
                    navigate('/inventory')
                  }}
                >
                  <PackageOpen className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                  Inventory
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setActiveFridge(fridge.id)
                    navigate('/device')
                  }}
                >
                  <Cpu className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                  Device
                </Button>
              </div>
            </article>
          )
        })}

        <div className="flex items-start gap-2.5 rounded-2xl bg-mist/60 p-3.5">
          <Thermometer className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" strokeWidth={2.2} aria-hidden />
          <p className="text-2xs leading-relaxed text-ink-muted">
            Each hub keeps its own inventory. Remote monitoring means you can check a fridge in another city without
            calling anyone to open the door.
          </p>
        </div>
      </div>

      <BottomSheet
        open={Boolean(renaming)}
        onClose={() => setRenaming(null)}
        title="Rename fridge"
        description="The name appears in the fridge selector and in every notification."
        footer={
          <Button
            size="lg"
            block
            onClick={() => {
              if (renaming && draftName.trim()) {
                renameFridge(renaming.id, draftName.trim())
                toast('Fridge renamed', { description: `Now called ${draftName.trim()}.` })
              }
              setRenaming(null)
            }}
          >
            Save name
          </Button>
        }
      >
        <input
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          aria-label="Fridge name"
          className="h-14 w-full rounded-2xl border border-line bg-mist/50 px-4 text-[15px] font-semibold text-ink focus:border-frisa-400 focus:bg-surface focus:outline-none"
        />
      </BottomSheet>
    </div>
  )
}
